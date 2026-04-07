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
});
