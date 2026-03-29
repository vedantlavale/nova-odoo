import { NextResponse } from "next/server";
import type { z } from "zod";

export class ApiError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function successResponse(data: unknown, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status },
  );
}

export function errorResponse(statusCode: number, message: string, details?: unknown) {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        details,
      },
    },
    { status: statusCode },
  );
}

export async function parseRequestBody<T>(request: Request, schema: z.ZodType<T>) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new ApiError(400, "Invalid JSON body.");
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    throw new ApiError(422, "Request validation failed.", result.error.flatten());
  }

  return result.data;
}

export function routeErrorHandler(error: unknown) {
  if (error instanceof ApiError) {
    return errorResponse(error.statusCode, error.message, error.details);
  }

  console.error("Unhandled API error", error);
  return errorResponse(500, "Something went wrong.");
}
