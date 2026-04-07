import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { OrderTable } from '@/components/OrderTable';
import axios from 'axios';

const mockOrders = [
  {
    order_id: 1,
    user: 'John Doe',
    model: 'GLA',
    tags: ['SUV', 'Mercedes'],
    order_date: '2025-06-15T00:00:00.000Z',
    current_status_date: '2025-06-16T00:00:00.000Z',
    status: 'Pending',
  },
  {
    order_id: 2,
    user: 'Jane Smith',
    model: 'CLA',
    tags: ['Coupe'],
    order_date: '2025-05-10T00:00:00.000Z',
    current_status_date: '2025-05-12T00:00:00.000Z',
    status: 'Delivered',
  },
];

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('OrderTable', () => {
  let queryClient: QueryClient;

  const renderComponent = () => {
    render(
      <QueryClientProvider client={queryClient}>
        <OrderTable />
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    mockedAxios.get.mockResolvedValue({ data: mockOrders });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders all column headers', async () => {
    renderComponent();
    await waitFor(() => screen.getByText('Order ID'));
    const uniqueHeaders = ['Order ID', 'User', 'Model', 'Tags', 'Order Date', 'Current Status Date', 'Status', 'Action'];
    uniqueHeaders.forEach((h) => expect(screen.getByText(h)).toBeInTheDocument());
    expect(screen.getAllByText('Cancel').length).toBeGreaterThanOrEqual(1);
  });

  it('renders order data in the correct columns', async () => {
    renderComponent();
    await waitFor(() => screen.getByText('John Doe'));

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('GLA')).toBeInTheDocument();
    expect(screen.getByText('SUV')).toBeInTheDocument();
    expect(screen.getByText('Mercedes')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();

    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('CLA')).toBeInTheDocument();
    expect(screen.getByText('Coupe')).toBeInTheDocument();
    expect(screen.getByText('Delivered')).toBeInTheDocument();
  });

  it('disables Next Step button for Delivered orders', async () => {
    renderComponent();
    await waitFor(() => screen.getByText('Jane Smith'));

    const nextStepButtons = screen.getAllByText('Next Step');
    expect(nextStepButtons[0]).not.toBeDisabled();
    expect(nextStepButtons[1]).toBeDisabled();
  });

  it('calls PATCH next-status when Next Step is clicked', async () => {
    mockedAxios.patch.mockResolvedValue({ data: { order_id: 1, new_status: 'Shipped' } });
    renderComponent();
    await waitFor(() => screen.getByText('John Doe'));

    const nextStepButtons = screen.getAllByText('Next Step');
    fireEvent.click(nextStepButtons[0]);

    await waitFor(() => {
      expect(mockedAxios.patch).toHaveBeenCalledWith('/api/orders/1/next-status');
    });
  });

  it('opens the Add New Car dialog', async () => {
    renderComponent();
    await waitFor(() => screen.getByText('Add new Car'));

    fireEvent.click(screen.getByText('Add new Car'));
    expect(screen.getByText('Add New Car')).toBeInTheDocument();
  });

  it('calls POST /api/products on form submit', async () => {
    mockedAxios.post.mockResolvedValue({ data: { product_id: 99 } });
    renderComponent();
    await waitFor(() => screen.getByText('Add new Car'));

    fireEvent.click(screen.getByText('Add new Car'));

    fireEvent.change(screen.getByLabelText('Model'), { target: { value: 'GLA' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'test desc' } });
    fireEvent.change(screen.getByLabelText('Year'), { target: { value: '2021' } });
    fireEvent.change(screen.getByLabelText('Gears'), { target: { value: '6' } });

    fireEvent.click(screen.getByText('Add Car'));

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/products', {
        model: 'GLA',
        description: 'test desc',
        year: '2021',
        gears: '6',
        tags: [],
      });
    });
  });

  it('displays error message when product creation fails', async () => {
    mockedAxios.post.mockRejectedValue({
      isAxiosError: true,
      response: { data: { error: 'Description does not match' } },
    });
    (axios.isAxiosError as unknown as jest.Mock) = jest.fn().mockReturnValue(true);

    renderComponent();
    await waitFor(() => screen.getByText('Add new Car'));

    fireEvent.click(screen.getByText('Add new Car'));
    fireEvent.change(screen.getByLabelText('Model'), { target: { value: 'GLA' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'bad' } });
    fireEvent.change(screen.getByLabelText('Year'), { target: { value: '2021' } });
    fireEvent.change(screen.getByLabelText('Gears'), { target: { value: '6' } });

    fireEvent.click(screen.getByText('Add Car'));

    await waitFor(() => {
      expect(screen.getByText('Description does not match')).toBeInTheDocument();
    });
  });

  it('shows loading spinner while fetching orders', () => {
    mockedAxios.get.mockReturnValue(new Promise(() => {}));
    renderComponent();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows error alert when fetching orders fails', async () => {
    mockedAxios.get.mockRejectedValue(new Error('Network error'));
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Error loading cars')).toBeInTheDocument();
    });
  });

  it('disables Next Step button for Cancelled orders', async () => {
    mockedAxios.get.mockResolvedValue({
      data: [
        { order_id: 3, user: 'Bob', model: 'AMG', tags: [], order_date: '2025-01-01T00:00:00.000Z', current_status_date: '2025-01-02T00:00:00.000Z', status: 'Cancelled' },
      ],
    });
    renderComponent();
    await waitFor(() => screen.getByText('Bob'));
    expect(screen.getByText('Next Step')).toBeDisabled();
  });

  it('adds and displays a tag in the dialog', async () => {
    renderComponent();
    await waitFor(() => screen.getByText('Add new Car'));
    fireEvent.click(screen.getByText('Add new Car'));

    fireEvent.change(screen.getByLabelText('Tags'), { target: { value: 'Luxury' } });
    fireEvent.click(screen.getByText('Add Tag'));

    expect(screen.getByText('Luxury')).toBeInTheDocument();
  });

  it('removes a tag when delete icon is clicked', async () => {
    renderComponent();
    await waitFor(() => screen.getByText('Add new Car'));
    fireEvent.click(screen.getByText('Add new Car'));

    fireEvent.change(screen.getByLabelText('Tags'), { target: { value: 'Luxury' } });
    fireEvent.click(screen.getByText('Add Tag'));
    expect(screen.getByText('Luxury')).toBeInTheDocument();

    const chip = screen.getByText('Luxury').closest('.MuiChip-root');
    const deleteButton = chip!.querySelector('[data-testid="CloseIcon"]')!;
    fireEvent.click(deleteButton);

    expect(screen.queryByText('Luxury')).not.toBeInTheDocument();
  });

  it('closes the dialog when Cancel is clicked', async () => {
    renderComponent();
    await waitFor(() => screen.getByText('Add new Car'));
    fireEvent.click(screen.getByText('Add new Car'));
    expect(screen.getByText('Add New Car')).toBeInTheDocument();

    const dialogButtons = screen.getAllByText('Cancel');
    const dialogCancel = dialogButtons.find(
      (btn) => btn.closest('.MuiDialogActions-root')
    )!;
    fireEvent.click(dialogCancel);

    await waitFor(() => {
      expect(screen.queryByText('Add New Car')).not.toBeInTheDocument();
    });
  });

  it('displays generic error when non-axios error occurs', async () => {
    mockedAxios.post.mockRejectedValue(new Error('unknown'));
    (axios.isAxiosError as unknown as jest.Mock) = jest.fn().mockReturnValue(false);

    renderComponent();
    await waitFor(() => screen.getByText('Add new Car'));

    fireEvent.click(screen.getByText('Add new Car'));
    fireEvent.change(screen.getByLabelText('Model'), { target: { value: 'X' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'x' } });
    fireEvent.change(screen.getByLabelText('Year'), { target: { value: '2021' } });
    fireEvent.change(screen.getByLabelText('Gears'), { target: { value: '6' } });

    fireEvent.click(screen.getByText('Add Car'));

    await waitFor(() => {
      expect(screen.getByText('Failed to add product')).toBeInTheDocument();
    });
  });

  it('renders orders with empty tags array', async () => {
    mockedAxios.get.mockResolvedValue({
      data: [
        { order_id: 5, user: 'Alice', model: 'EQS', tags: [], order_date: '2025-03-01T00:00:00.000Z', current_status_date: '2025-03-02T00:00:00.000Z', status: 'Pending' },
      ],
    });
    renderComponent();
    await waitFor(() => screen.getByText('Alice'));
    expect(screen.getByText('EQS')).toBeInTheDocument();
  });

  it('submits form with tags included in the request', async () => {
    mockedAxios.post.mockResolvedValue({ data: { product_id: 100 } });
    renderComponent();
    await waitFor(() => screen.getByText('Add new Car'));
    fireEvent.click(screen.getByText('Add new Car'));

    fireEvent.change(screen.getByLabelText('Model'), { target: { value: 'AMG' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'desc' } });
    fireEvent.change(screen.getByLabelText('Year'), { target: { value: '2023' } });
    fireEvent.change(screen.getByLabelText('Gears'), { target: { value: '7' } });

    fireEvent.change(screen.getByLabelText('Tags'), { target: { value: 'Sport' } });
    fireEvent.click(screen.getByText('Add Tag'));

    fireEvent.click(screen.getByText('Add Car'));

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith('/api/products', {
        model: 'AMG',
        description: 'desc',
        year: '2023',
        gears: '7',
        tags: ['Sport'],
      });
    });
  });
});
