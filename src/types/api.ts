export enum METHOD {
  GET = "GET",
  POST = "POST",
  PATCH = "PATCH",
  DELETE = "DELETE",
}

export default class CustomError extends Error {
  constructor(
    public code: ValueOf<typeof RESPONSE_CODES>,
    public message: string
  ) {
    super();
  }
}

export const RESPONSE_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export type ValueOf<T> = T[keyof T];
