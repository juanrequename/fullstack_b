export interface CreateProductInput {
  model: string;
  description: string;
  year: string | number;
  gears: string | number;
  tags?: string[];
}

export interface CreateProductResult {
  product_id: number;
  model: string;
  description: string;
  year: number;
  gears: number;
  tags?: string[];
}
