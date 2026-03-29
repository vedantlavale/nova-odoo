import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALLOWED_ORIGINS = new Set([
  "https://nova-odoo.vercel.app",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
]);

function applyCorsHeaders(response: NextResponse, origin: string | null) {
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Vary", "Origin");
  }

  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  return response;
}

export function proxy(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (request.method === "OPTIONS") {
    const preflightResponse = new NextResponse(null, { status: 204 });
    return applyCorsHeaders(preflightResponse, origin);
  }

  const response = NextResponse.next();
  return applyCorsHeaders(response, origin);
}

export const config = {
  matcher: "/api/:path*",
};
