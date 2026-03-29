import { randomBytes } from "node:crypto";

import { cookies } from "next/headers";
import { Types } from "mongoose";

import { connectToDatabase } from "@/lib/db";
import { ApiError } from "@/lib/http";
import { CompanyModel, type Company } from "@/lib/models/company";
import { SessionModel, type Session } from "@/lib/models/session";
import { UserModel, type User } from "@/lib/models/user";
import type { UserRole } from "@/lib/roles";

const SESSION_COOKIE_NAME = "rm_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

type AuthenticatedUser = Omit<User, "passwordHash"> & {
  _id: Types.ObjectId;
};

type AuthenticatedCompany = Company & {
  _id: Types.ObjectId;
};

type AuthenticatedSession = Session & {
  _id: Types.ObjectId;
};

export type AuthContext = {
  user: AuthenticatedUser;
  company: AuthenticatedCompany;
  session: AuthenticatedSession;
  token: string;
};

function getCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

function generateSessionToken() {
  return `${crypto.randomUUID()}_${randomBytes(24).toString("hex")}`;
}

export async function getAuthContext(): Promise<AuthContext | null> {
  await connectToDatabase();

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const session = await SessionModel.findOne({
    token,
    expiresAt: { $gt: new Date() },
  }).lean<AuthenticatedSession | null>();

  if (!session) {
    cookieStore.delete(SESSION_COOKIE_NAME);
    return null;
  }

  const user = await UserModel.findOne({
    _id: session.userId,
    companyId: session.companyId,
    isActive: true,
  })
    .select("-passwordHash")
    .lean<AuthenticatedUser | null>();

  if (!user) {
    await SessionModel.deleteOne({ _id: session._id });
    cookieStore.delete(SESSION_COOKIE_NAME);
    return null;
  }

  const company = await CompanyModel.findById(session.companyId).lean<AuthenticatedCompany | null>();

  if (!company) {
    await SessionModel.deleteOne({ _id: session._id });
    cookieStore.delete(SESSION_COOKIE_NAME);
    return null;
  }

  return {
    user,
    company,
    session,
    token,
  };
}

export async function requireAuth(allowedRoles?: UserRole[]) {
  const context = await getAuthContext();

  if (!context) {
    throw new ApiError(401, "Authentication required.");
  }

  if (allowedRoles && !allowedRoles.includes(context.user.role)) {
    throw new ApiError(403, "You do not have permission to perform this action.");
  }

  return context;
}

export async function createSessionForUser(userId: Types.ObjectId, companyId: Types.ObjectId) {
  await connectToDatabase();

  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

  await SessionModel.create({
    userId,
    companyId,
    token,
    expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, getCookieOptions());

  return token;
}

export async function destroyCurrentSession() {
  await connectToDatabase();

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await SessionModel.deleteOne({ token });
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function cleanupExpiredSessions() {
  await connectToDatabase();
  await SessionModel.deleteMany({ expiresAt: { $lte: new Date() } });
}
