import { Request, Response, NextFunction } from "express";

export const AppResponse = (
  res: Response,
  statusCode: number,
  message?: string,
  data?: any,
) => {
  res.status(statusCode).json({ message, data });
};

export const errorMiddleware = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error("Request error:", err.message);
  const statusCode: number = err.statusCode || 500;
  const message =
    statusCode === 500
      ? "Internal server error"
      : getErrorMsg(err) || "Internal server error";

  res.status(statusCode).json({
    message,
  });
};

export function getErrorMsg(error: unknown) {
  let message: string = "";

  if (error) {
    if (error instanceof Error) {
      message = error.message;
    } else if (
      typeof error === "object" &&
      "message" in error &&
      typeof error.message === "string"
    ) {
      message = error.message;
    } else if (typeof error === "string") {
      message = error;
    } else {
      message = "Something went wrong!";
    }
  }

  return message;
}

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = "Bad Request") {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Not Found") {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Conflict") {
    super(message, 409);
  }
}
