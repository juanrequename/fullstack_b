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

export async function findTagByName(client: PoolClient, name: string): Promise<number | null> {
  const result = await client.query("SELECT tag_id FROM tags WHERE name = $1", [name]);
  return result.rows.length > 0 ? result.rows[0].tag_id : null;
}

export async function createTag(client: PoolClient, name: string): Promise<number> {
  const result = await client.query(
    "INSERT INTO tags (name) VALUES ($1) RETURNING tag_id",
    [name]
  );
  return result.rows[0].tag_id;
}

export async function linkProductTag(client: PoolClient, productId: number, tagId: number) {
  await client.query(
    "INSERT INTO products_tags (product_id, tag_id) VALUES ($1, $2)",
    [productId, tagId]
  );
}
