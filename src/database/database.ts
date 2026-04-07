import { Pool, PoolConfig } from "pg";
import _once from "lodash/once";

export const _getDBConnection = () => {
  const poolConfig: PoolConfig = {
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USER ?? "postgres",
    password: process.env.DB_PASSWORD ?? "postgres",
    database: process.env.DB_NAME ?? "backend",
    ssl: process.env.DB_SSL === "true",
  };

  return new Pool(poolConfig);
};

export const getDBConnection = _once(_getDBConnection);
