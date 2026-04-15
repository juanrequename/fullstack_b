export interface ReportRow {
  product_id: number;
  model: string;
  year: number;
  month: number;
  status: string | null;
  orders_count: number;
}
