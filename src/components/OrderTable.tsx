import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Box,
  CircularProgress,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Chip
} from '@mui/material';
import { Order } from '@/types/order';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';

export const OrderTable = () => {
  const queryClient = useQueryClient();
  const { data: orders = [], isLoading, error } = useQuery<Order[]>(
    'orders',
    async () => {
      const response = await axios.get('/api/orders');
      return response.data;
    }
  );

  const nextStepMutation = useMutation(
    (orderId: number) => axios.patch(`/api/orders/${orderId}/next-status`),
    { onSuccess: () => queryClient.invalidateQueries('orders') }
  );

  const cancelMutation = useMutation(
    (orderId: number) => axios.patch(`/api/orders/${orderId}/cancel`),
    { onSuccess: () => queryClient.invalidateQueries('orders') }
  );

  const addProductMutation = useMutation(
    (data: { model: string; description: string; year: string; gears: string; tags: string[] }) =>
      axios.post('/api/products', data),
    { onSuccess: () => queryClient.invalidateQueries('orders') }
  );

  const handleNextStep = (orderId: number) => {
    nextStepMutation.mutate(orderId);
  };

  const handleCancel = (orderId: number) => {
    cancelMutation.mutate(orderId);
  };

  const [open, setOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    model: '',
    description: '',
    year: '',
    gears: '',
    tags: [] as string[],
    tagInput: ''
  });

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, tagInput: e.target.value });
  };

  const handleAddTag = () => {
    if (formData.tagInput.trim() !== '') {
      setFormData({
        ...formData,
        tags: [...formData.tags, formData.tagInput.trim()],
        tagInput: ''
      });
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove)
    });
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    try {
      await addProductMutation.mutateAsync({
        model: formData.model,
        description: formData.description,
        year: formData.year,
        gears: formData.gears,
        tags: formData.tags,
      });
      handleClose();
      setFormData({ model: '', description: '', year: '', gears: '', tags: [], tagInput: '' });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setSubmitError(err.response.data.error);
      } else {
        setSubmitError('Failed to add product');
      }
    }
  };

  if (isLoading) return <CircularProgress />;
  if (error) return <Alert severity="error">Error loading cars</Alert>;

  return (
    <Box p={3}>
      <Button variant="contained" onClick={handleClickOpen}>
        Add new Car
      </Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Add New Car</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="model"
            label="Model"
            type="text"
            fullWidth
            value={formData.model}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            name="description"
            label="Description"
            type="text"
            fullWidth
            value={formData.description}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            name="year"
            label="Year"
            type="number"
            fullWidth
            value={formData.year}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            name="gears"
            label="Gears"
            type="number"
            fullWidth
            value={formData.gears}
            onChange={handleInputChange}
          />
          <Box mt={2}>
            <TextField
              margin="dense"
              name="tagInput"
              label="Tags"
              type="text"
              fullWidth
              value={formData.tagInput}
              onChange={handleTagInputChange}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleAddTag}
              startIcon={<AddIcon />}
            >
              Add Tag
            </Button>
            <Box mt={2}>
              {formData.tags.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  onDelete={() => handleRemoveTag(tag)}
                  deleteIcon={<CloseIcon />}
                  style={{ margin: '4px' }}
                />
              ))}
            </Box>
          </Box>
          {submitError && <Alert severity="error" sx={{ mt: 2 }}>{submitError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleSubmit} color="primary">
            Add Car
          </Button>
        </DialogActions>
      </Dialog>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order ID</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Model</TableCell>
              <TableCell>Tags</TableCell>
              <TableCell>Order Date</TableCell>
              <TableCell>Current Status Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Cancel</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.order_id}>
                <TableCell>{order.order_id}</TableCell>
                <TableCell>{order.user}</TableCell>
                <TableCell>{order.model}</TableCell>
                <TableCell>
                  {order.tags?.map((tag, i) => (
                    <Chip key={i} label={tag} size="small" style={{ margin: '2px' }} />
                  ))}
                </TableCell>
                <TableCell>{order.order_date ? new Date(order.order_date).toLocaleDateString() : ''}</TableCell>
                <TableCell>{order.current_status_date ? new Date(order.current_status_date).toLocaleDateString() : ''}</TableCell>
                <TableCell>{order.status}</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    disabled={order.status === 'Delivered' || order.status === 'Cancelled'}
                    onClick={() => handleNextStep(order.order_id)}
                  >
                    Next Step
                  </Button>
                </TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    color="primary"
                    disabled={order.status === 'Delivered' || order.status === 'Cancelled'}
                    onClick={() => handleCancel(order.order_id)}
                  >
                    Cancel
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};