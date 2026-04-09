import { getApiDocs } from "@/lib/swagger";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const spec = await getApiDocs();
  res.status(200).json(spec);
}
