export const environment = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  logLevel: process.env.LOG_LEVEL,
  port: Number(process.env.PORT ?? 3000),
  dbHost: process.env.DB_HOST ?? "localhost",
  dbPort: Number(process.env.DB_PORT ?? 5432),
  dbUser: process.env.DB_USER ?? "postgres",
  dbPassword: process.env.DB_PASSWORD ?? "postgres",
  dbName: process.env.DB_NAME ?? "backend",
  dbSsl: process.env.DB_SSL === "true",
  albumsApiUrl: process.env.ALBUMS_API_URL ?? "https://jsonplaceholder.typicode.com/albums",
  albumsApiTimeoutMs: Number(process.env.ALBUMS_API_TIMEOUT_MS ?? 5000),
};
