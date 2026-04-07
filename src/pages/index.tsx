import { Box, Typography } from '@mui/material';
import { OrderTable } from '@/components/OrderTable';

export default function HomePage() {
  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Mercedes-Benz Orders
      </Typography>
      <OrderTable />
    </Box>
  );
}
