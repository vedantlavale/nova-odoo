import { Types } from "mongoose";

import { requireAuth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { ApiError, parseRequestBody, routeErrorHandler, successResponse } from "@/lib/http";
import { CompanyModel } from "@/lib/models/company";
import { UserModel } from "@/lib/models/user";
import { workflowConfigSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { company } = await requireAuth();

    return successResponse({
      workflowConfig: company.workflowConfig,
    });
  } catch (error) {
    return routeErrorHandler(error);
  }
}

export async function PUT(request: Request) {
  try {
    const { company, user } = await requireAuth(["admin"]);
    const body = await parseRequestBody(request, workflowConfigSchema);

    await connectToDatabase();

    const userStepIds = body.approverSteps
      .filter((step) => step.type === "user" && step.userId)
      .map((step) => step.userId as string);

    const uniqueUserStepIds = [...new Set(userStepIds)];

    if (uniqueUserStepIds.length) {
      const existingUsers = await UserModel.countDocuments({
        _id: { $in: uniqueUserStepIds.map((id) => new Types.ObjectId(id)) },
        companyId: user.companyId,
        isActive: true,
      });

      if (existingUsers !== uniqueUserStepIds.length) {
        throw new ApiError(422, "One or more approver users do not exist or are inactive.");
      }
    }

    if (body.conditionalRule.specificApproverUserId) {
      const specificApproverExists = await UserModel.exists({
        _id: new Types.ObjectId(body.conditionalRule.specificApproverUserId),
        companyId: user.companyId,
        isActive: true,
      });

      if (!specificApproverExists) {
        throw new ApiError(422, "Specific conditional approver user does not exist.");
      }
    }

    const workflowConfig = {
      isManagerApproverRequired: body.isManagerApproverRequired,
      approverSteps: body.approverSteps.map((step) => ({
        sequence: step.sequence,
        type: step.type,
        role: step.role,
        userId: step.userId ? new Types.ObjectId(step.userId) : undefined,
        label: step.label,
        required: step.required,
      })),
      conditionalRule: {
        enabled: body.conditionalRule.enabled,
        percentageThreshold: body.conditionalRule.percentageThreshold,
        specificApproverUserId: body.conditionalRule.specificApproverUserId
          ? new Types.ObjectId(body.conditionalRule.specificApproverUserId)
          : undefined,
        specificApproverTitle: body.conditionalRule.specificApproverTitle,
        operator: body.conditionalRule.operator,
      },
    };

    const updatedCompany = await CompanyModel.findOneAndUpdate(
      { _id: company._id },
      {
        $set: {
          workflowConfig,
        },
      },
      { new: true },
    ).lean();

    if (!updatedCompany) {
      throw new ApiError(404, "Company not found.");
    }

    return successResponse({
      workflowConfig: updatedCompany.workflowConfig,
    });
  } catch (error) {
    return routeErrorHandler(error);
  }
}
