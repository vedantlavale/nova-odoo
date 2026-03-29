import bcrypt from "bcryptjs";

import { createSessionForUser } from "@/lib/auth";
import { resolveCurrencyByCountry } from "@/lib/currency";
import { connectToDatabase } from "@/lib/db";
import { ApiError, parseRequestBody, routeErrorHandler, successResponse } from "@/lib/http";
import { CompanyModel } from "@/lib/models/company";
import { UserModel } from "@/lib/models/user";
import { serializeCompany, serializeUser } from "@/lib/serializers";
import { signupSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await parseRequestBody(request, signupSchema);

    await connectToDatabase();

    const hasAdmin = await UserModel.exists({ role: "admin" });
    if (hasAdmin) {
      throw new ApiError(
        409,
        "Initial setup has already been completed. Login with an existing account.",
      );
    }

    const currency = await resolveCurrencyByCountry(body.country);

    const company = await CompanyModel.create({
      name: body.companyName,
      country: body.country,
      baseCurrency: currency.currencyCode,
      workflowConfig: {
        isManagerApproverRequired: true,
        approverSteps: [],
        conditionalRule: {
          enabled: false,
          operator: "OR",
        },
      },
    });

    const passwordHash = await bcrypt.hash(body.password, 12);

    const adminUser = await UserModel.create({
      companyId: company._id,
      name: body.name,
      email: body.email,
      passwordHash,
      role: "admin",
      title: body.title,
      managerId: null,
      isActive: true,
    });

    await createSessionForUser(adminUser._id, company._id);

    return successResponse(
      {
        user: serializeUser(adminUser.toObject()),
        company: serializeCompany(company.toObject()),
      },
      201,
    );
  } catch (error) {
    return routeErrorHandler(error);
  }
}
