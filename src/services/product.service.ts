import { getDBConnection } from "@/database/database";
import * as productRepo from "@/repositories/product.repository";
import CustomError, { RESPONSE_CODES } from "@/types/api";
import { CreateProductInput, CreateProductResult } from "@/types/product";

interface Album {
  title: string;
}

async function validateDescription(description: string): Promise<boolean> {
  const response = await fetch("https://jsonplaceholder.typicode.com/albums");
  const albums: Album[] = await response.json();
  return albums.some((album) => album.title === description);
}

export async function createProduct(input: CreateProductInput): Promise<CreateProductResult> {
  const isValid = await validateDescription(input.description);
  if (!isValid) {
    throw new CustomError(
      RESPONSE_CODES.BAD_REQUEST,
      "Description does not match any album title from the external source"
    );
  }

  const pool = getDBConnection();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const productId = await productRepo.createProduct(
      client,
      input.model,
      input.description,
      Number(input.year),
      Number(input.gears)
    );

    if (Array.isArray(input.tags) && input.tags.length > 0) {
      for (const tagName of input.tags) {
        let tagId = await productRepo.findTagByName(client, tagName);
        if (tagId === null) {
          tagId = await productRepo.createTag(client, tagName);
        }
        await productRepo.linkProductTag(client, productId, tagId);
      }
    }

    await client.query("COMMIT");
    return {
      product_id: productId,
      model: input.model,
      description: input.description,
      year: Number(input.year),
      gears: Number(input.gears),
      tags: input.tags,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
