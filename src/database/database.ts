import { Pool, PoolConfig } from "pg";
import _once from "lodash/once";

export const _getDBConnection = () => {
  const poolConfig: PoolConfig = {
    host: "localhost",
    port: 5432,
    user: "postgres",
    password: "postgres",
    database: "backend",
    ssl: false,
  };

  return new Pool(poolConfig);
};

export const getDBConnection = _once(_getDBConnection);
