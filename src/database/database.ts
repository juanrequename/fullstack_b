import { Pool, PoolConfig } from "pg";
import _once from "lodash/once";
import { environment } from "@/config/environment";

export const _getDBConnection = () => {
  const poolConfig: PoolConfig = {
    host: environment.dbHost,
    port: environment.dbPort,
    user: environment.dbUser,
    password: environment.dbPassword,
    database: environment.dbName,
    ssl: environment.dbSsl,
  };

  return new Pool(poolConfig);
};

export const getDBConnection = _once(_getDBConnection);
