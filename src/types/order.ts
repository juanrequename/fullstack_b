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
  model?: string | string[];
  description?: string | string[];
  tags?: string | string[];
  startDate?: string | string[];
  endDate?: string | string[];
  gears?: string | string[];
}
