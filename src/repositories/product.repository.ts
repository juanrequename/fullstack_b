import { PoolClient } from "pg";

export async function createProduct(
  client: PoolClient,
  model: string,
  description: string,
  year: number,
  gears: number
): Promise<number> {
  const result = await client.query(
    "INSERT INTO products (model, description, year, gears) VALUES ($1, $2, $3, $4) RETURNING product_id",
    [model, description, year, gears]
  );
  return result.rows[0].product_id;
}

export async function upsertTags(client: PoolClient, names: string[]): Promise<number[]> {
  const result = await client.query(
    `INSERT INTO tags (name)
     SELECT DISTINCT UNNEST($1::text[])
     ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
     RETURNING tag_id`,
    [names]
  );
  return result.rows.map((row: { tag_id: number }) => row.tag_id);
}

export async function linkProductTags(
  client: PoolClient,
  productId: number,
  tagIds: number[]
): Promise<void> {
  await client.query(
    `INSERT INTO products_tags (product_id, tag_id)
     SELECT $1, UNNEST($2::int[])
     ON CONFLICT (product_id, tag_id) DO NOTHING`,
    [productId, tagIds]
  );
}
