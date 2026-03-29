import bcrypt from "bcryptjs";

import { createSessionForUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { ApiError, parseRequestBody, routeErrorHandler, successResponse } from "@/lib/http";
import { CompanyModel } from "@/lib/models/company";
import { UserModel } from "@/lib/models/user";
import { serializeCompany, serializeUser } from "@/lib/serializers";
import { loginSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await parseRequestBody(request, loginSchema);

    await connectToDatabase();

    const user = await UserModel.findOne({
      email: body.email,
      isActive: true,
    });

    if (!user) {
      throw new ApiError(401, "Invalid email or password.");
    }

    const passwordMatches = await bcrypt.compare(body.password, user.passwordHash);
    if (!passwordMatches) {
      throw new ApiError(401, "Invalid email or password.");
    }

    const company = await CompanyModel.findById(user.companyId);
    if (!company) {
      throw new ApiError(404, "Associated company not found.");
    }

    await createSessionForUser(user._id, company._id);

    return successResponse({
      user: serializeUser(user.toObject()),
      company: serializeCompany(company.toObject()),
    });
  } catch (error) {
    return routeErrorHandler(error);
  }
}
