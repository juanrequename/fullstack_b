import { getDBConnection } from "@/database/database";
import { NextApiRequest, NextApiResponse } from "next";

interface Album {
  title: string;
}

async function validateDescription(description: string): Promise<boolean> {
  const response = await fetch("https://jsonplaceholder.typicode.com/albums");
  const albums: Album[] = await response.json();
  return albums.some((album) => album.title === description);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { model, description, year, gears, tags } = req.body;

  if (!model || !description || !year || !gears) {
    return res.status(400).json({ error: "Missing required fields: model, description, year, gears" });
  }

  const isValid = await validateDescription(description);
  if (!isValid) {
    return res.status(400).json({
      error: "Description does not match any album title from the external source",
    });
  }

  const pool = getDBConnection();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const productResult = await client.query(
      "INSERT INTO products (model, description, year, gears) VALUES ($1, $2, $3, $4) RETURNING product_id",
      [model, description, Number(year), Number(gears)]
    );
    const productId = productResult.rows[0].product_id;

    if (Array.isArray(tags) && tags.length > 0) {
      for (const tagName of tags) {
        const existing = await client.query("SELECT tag_id FROM tags WHERE name = $1", [tagName]);
        let tagId: number;
        if (existing.rows.length > 0) {
          tagId = existing.rows[0].tag_id;
        } else {
          const inserted = await client.query(
            "INSERT INTO tags (name) VALUES ($1) RETURNING tag_id",
            [tagName]
          );
          tagId = inserted.rows[0].tag_id;
        }
        await client.query(
          "INSERT INTO products_tags (product_id, tag_id) VALUES ($1, $2)",
          [productId, tagId]
        );
      }
    }

    await client.query("COMMIT");
    res.status(201).json({ product_id: productId, model, description, year: Number(year), gears: Number(gears), tags });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creating product:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
}
