export interface Order {
  order_id: number;
  user: string;
  model: string;
  tags: string[];
  order_date: string;
  current_status_date: string;
  status: string;
}

export interface OrderSearchFilters {
  model?: string;
  description?: string;
  tags?: string;
  startDate?: string;
  endDate?: string;
  gears?: string;
}
