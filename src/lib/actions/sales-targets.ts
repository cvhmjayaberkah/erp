"use server";

import db from "@/lib/db";
import { SalesTargets, TargetType } from "@prisma/client";
import { revalidatePath } from "next/cache";

export type SalesTargetFormData = {
  userId: string;
  targetType: TargetType;
  targetPeriod: string; // Format: YYYY-MM for monthly, YYYY-Q1 for quarterly, YYYY for yearly
  targetAmount: number;
  isActive: boolean;
};

export type SalesTargetWithUser = SalesTargets & {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
};

// Get all sales targets
export async function getSalesTargets(): Promise<SalesTargetWithUser[]> {
  try {
    const targets = await db.salesTargets.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return targets;
  } catch (error) {
    console.error("Error fetching sales targets:", error);
    throw new Error("Failed to fetch sales targets");
  }
}

// Get sales target by ID
export async function getSalesTargetById(
  id: string
): Promise<SalesTargets | null> {
  try {
    const target = await db.salesTargets.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    return target;
  } catch (error) {
    console.error("Error fetching sales target:", error);
    throw new Error("Failed to fetch sales target");
  }
}

// Get sales target for specific user and period
export async function getUserSalesTarget(
  userId: string,
  targetPeriod: string
): Promise<SalesTargets | null> {
  try {
    const target = await db.salesTargets.findFirst({
      where: {
        userId,
        targetPeriod,
        isActive: true,
      },
    });

    return target;
  } catch (error) {
    console.error("Error fetching user sales target:", error);
    return null;
  }
}

// Get current month target for user
export async function getCurrentMonthTarget(
  userId: string
): Promise<SalesTargets | null> {
  try {
    const currentDate = new Date();
    const targetPeriod = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}`;

    return await getUserSalesTarget(userId, targetPeriod);
  } catch (error) {
    console.error("Error fetching current month target:", error);
    return null;
  }
}

// Create new sales target
export async function createSalesTarget(data: SalesTargetFormData) {
  try {
    // First, check if the user exists
    const userExists = await db.users.findUnique({
      where: { id: data.userId },
      select: { id: true, name: true, email: true },
    });

    if (!userExists) {
      return {
        success: false,
        error:
          "User tidak ditemukan. Silakan login ulang atau hubungi administrator.",
      };
    }

    // Check if target already exists for this user and period
    const existingTarget = await db.salesTargets.findFirst({
      where: {
        userId: data.userId,
        targetPeriod: data.targetPeriod,
      },
    });

    if (existingTarget) {
      return {
        success: false,
        error:
          "Target untuk periode ini sudah ada. Silakan edit target yang sudah ada.",
      };
    }

    const target = await db.salesTargets.create({
      data: {
        userId: data.userId,
        targetType: data.targetType,
        targetPeriod: data.targetPeriod,
        targetAmount: data.targetAmount,
        isActive: data.isActive,
      },
    });

    revalidatePath("/management/sales-target");
    revalidatePath("/management/finance/revenue-analytics");
    return { success: true, data: target };
  } catch (error) {
    console.error("Error creating sales target:", error);

    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes("Foreign key constraint")) {
        return {
          success: false,
          error:
            "User tidak valid. Silakan login ulang atau hubungi administrator.",
        };
      }
    }

    return {
      success: false,
      error: `Failed to create sales target: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}

// Update sales target
export async function updateSalesTarget(id: string, data: SalesTargetFormData) {
  try {
    // Check if another target exists for the same user and period (excluding current target)
    const existingTarget = await db.salesTargets.findFirst({
      where: {
        userId: data.userId,
        targetPeriod: data.targetPeriod,
        id: { not: id },
      },
    });

    if (existingTarget) {
      return {
        success: false,
        error: "Target untuk periode ini sudah ada untuk user tersebut.",
      };
    }

    const target = await db.salesTargets.update({
      where: { id },
      data: {
        userId: data.userId,
        targetType: data.targetType,
        targetPeriod: data.targetPeriod,
        targetAmount: data.targetAmount,
        isActive: data.isActive,
      },
    });

    revalidatePath("/management/sales-target");
    revalidatePath(`/management/sales-target/edit/${id}`);
    return { success: true, data: target };
  } catch (error) {
    console.error("Error updating sales target:", error);
    return { success: false, error: "Failed to update sales target" };
  }
}

// Delete sales target
export async function deleteSalesTarget(id: string) {
  try {
    await db.salesTargets.delete({
      where: { id },
    });

    revalidatePath("/management/sales-target");
    return { success: true };
  } catch (error) {
    console.error("Error deleting sales target:", error);
    return { success: false, error: "Failed to delete sales target" };
  }
}

// Toggle sales target active status
export async function toggleSalesTargetStatus(id: string) {
  try {
    const target = await db.salesTargets.findUnique({
      where: { id },
    });

    if (!target) {
      return { success: false, error: "Sales target not found" };
    }

    const updatedTarget = await db.salesTargets.update({
      where: { id },
      data: {
        isActive: !target.isActive,
      },
    });

    revalidatePath("/management/sales-target");
    return { success: true, data: updatedTarget };
  } catch (error) {
    console.error("Error toggling sales target status:", error);
    return { success: false, error: "Failed to toggle sales target status" };
  }
}

// Update achieved amount (called when orders are created/updated)
export async function updateAchievedAmount(
  userId: string,
  targetPeriod: string,
  newAmount: number
) {
  try {
    const target = await db.salesTargets.findFirst({
      where: {
        userId,
        targetPeriod,
        isActive: true,
      },
    });

    if (!target) {
      return {
        success: false,
        error: "No active target found for this period",
      };
    }

    const updatedTarget = await db.salesTargets.update({
      where: { id: target.id },
      data: {
        achievedAmount: newAmount,
      },
    });

    return { success: true, data: updatedTarget };
  } catch (error) {
    console.error("Error updating achieved amount:", error);
    return { success: false, error: "Failed to update achieved amount" };
  }
}

// Generate target period string
export async function generateTargetPeriod(
  targetType: TargetType,
  date: Date = new Date()
): Promise<string> {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  switch (targetType) {
    case "MONTHLY":
      return `${year}-${String(month).padStart(2, "0")}`;
    case "QUARTERLY":
      const quarter = Math.ceil(month / 3);
      return `${year}-Q${quarter}`;
    case "YEARLY":
      return `${year}`;
    default:
      return `${year}-${String(month).padStart(2, "0")}`;
  }
}

// Get all sales users for dropdown
export async function getSalesUsers() {
  try {
    const users = await db.users.findMany({
      where: {
        role: "SALES",
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return users;
  } catch (error) {
    console.error("Error fetching sales users:", error);
    throw new Error("Failed to fetch sales users");
  }
}

// Get targets for chart display
export async function getTargetsForChart(
  userId?: string,
  targetType: TargetType = "MONTHLY"
) {
  try {
    const where = userId ? { userId } : {};

    const targets = await db.salesTargets.findMany({
      where: {
        ...where,
        targetType,
        isActive: true,
      },
      orderBy: {
        targetPeriod: "asc",
      },
    });

    // Calculate achieved amounts from actual invoice data
    const targetsWithAchieved = await Promise.all(
      targets.map(async (target) => {
        const achievedAmount = await calculateAchievedAmount(
          target.userId,
          target.targetPeriod,
          target.targetType
        );

        return {
          id: target.id,
          period: target.targetPeriod,
          target: target.targetAmount,
          achieved: achievedAmount,
          percentage:
            target.targetAmount > 0
              ? (achievedAmount / target.targetAmount) * 100
              : 0,
        };
      })
    );

    return targetsWithAchieved;
  } catch (error) {
    console.error("Error fetching targets for chart:", error);
    throw new Error("Failed to fetch chart data");
  }
}

// Calculate achieved amount from actual invoice data
async function calculateAchievedAmount(
  userId: string,
  targetPeriod: string,
  targetType: TargetType
): Promise<number> {
  try {
    let startDate: Date;
    let endDate: Date;

    // Parse the target period and create date range
    if (targetType === "MONTHLY") {
      // targetPeriod format: "2025-01"
      const [year, month] = targetPeriod.split("-").map(Number);
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0); // Last day of the month
    } else if (targetType === "QUARTERLY") {
      // targetPeriod format: "2025-Q1"
      const [year, quarterStr] = targetPeriod.split("-");
      const quarter = parseInt(quarterStr.replace("Q", ""));
      const startMonth = (quarter - 1) * 3;
      startDate = new Date(parseInt(year), startMonth, 1);
      endDate = new Date(parseInt(year), startMonth + 3, 0); // Last day of the quarter
    } else if (targetType === "YEARLY") {
      // targetPeriod format: "2025"
      const year = parseInt(targetPeriod);
      startDate = new Date(year, 0, 1); // Jan 1
      endDate = new Date(year, 11, 31); // Dec 31
    } else {
      return 0;
    }

    // Calculate achieved revenue from invoices through orders
    const result = await db.invoices.aggregate({
      where: {
        invoiceDate: {
          gte: startDate,
          lte: endDate,
        },
        status: "PAID",
        order: {
          salesId: userId,
        },
      },
      _sum: {
        totalAmount: true,
      },
    });

    return result._sum?.totalAmount || 0;
  } catch (error) {
    console.error("Error calculating achieved amount:", error);
    return 0;
  }
}
