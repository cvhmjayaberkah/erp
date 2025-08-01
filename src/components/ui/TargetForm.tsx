"use client";

import React, { useState, useEffect } from "react";
import { Input, FormField } from "@/components/ui";
import { createSalesTarget } from "@/lib/actions/sales-targets";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";

interface TargetFormProps {
  userId?: string;
  onSuccess?: () => void;
}

export function TargetForm({ userId, onSuccess }: TargetFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    targetType: "MONTHLY" as "MONTHLY" | "QUARTERLY" | "YEARLY",
    targetPeriod: "",
    targetAmount: "",
  });

  // Debug: Log when component receives userId
  useEffect(() => {
    console.log("TargetForm rendered with userId:", userId);
  }, [userId]);

  const generatePeriodPlaceholder = () => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");

    switch (formData.targetType) {
      case "MONTHLY":
        return `e.g., ${year}-${month}`;
      case "QUARTERLY":
        return `e.g., ${year}-Q1`;
      case "YEARLY":
        return `e.g., ${year}`;
      default:
        return "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.targetPeriod || !formData.targetAmount) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!userId) {
      toast.error("User ID is required");
      return;
    }

    // Validate period format
    const isValidPeriod = validatePeriodFormat(
      formData.targetPeriod,
      formData.targetType
    );
    if (!isValidPeriod) {
      toast.error("Invalid period format. Please check the example format.");
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("Submitting target:", {
        targetType: formData.targetType,
        targetPeriod: formData.targetPeriod,
        targetAmount: parseFloat(formData.targetAmount),
        userId,
        isActive: true,
      });

      const result = await createSalesTarget({
        targetType: formData.targetType,
        targetPeriod: formData.targetPeriod,
        targetAmount: parseFloat(formData.targetAmount),
        userId,
        isActive: true,
      });

      console.log("Create result:", result);

      if (result.success) {
        toast.success("Target created successfully!");
        console.log("✅ Target created successfully:", result);
        setFormData({
          targetType: "MONTHLY",
          targetPeriod: "",
          targetAmount: "",
        });
        setIsOpen(false);

        // Call onSuccess callback to refresh parent component
        console.log("🔄 Calling onSuccess callback to refresh targets...");
        onSuccess?.();
      } else {
        console.error("❌ Target creation failed:", result);
        toast.error(result.error || "Failed to create target");
      }
    } catch (error) {
      console.error("Error creating target:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const validatePeriodFormat = (period: string, type: string): boolean => {
    switch (type) {
      case "MONTHLY":
        return /^\d{4}-(0[1-9]|1[0-2])$/.test(period);
      case "QUARTERLY":
        return /^\d{4}-Q[1-4]$/.test(period);
      case "YEARLY":
        return /^\d{4}$/.test(period);
      default:
        return false;
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors duration-200 text-sm font-medium"
      >
        <Plus className="h-4 w-4" />
        Add Target
      </button>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Add New Target
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField label="Target Type" htmlFor="targetType" required>
            <select
              name="targetType"
              value={formData.targetType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  targetType: e.target.value as
                    | "MONTHLY"
                    | "QUARTERLY"
                    | "YEARLY",
                })
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="YEARLY">Yearly</option>
            </select>
          </FormField>

          <FormField label="Period" htmlFor="targetPeriod" required>
            <Input
              type="text"
              name="targetPeriod"
              placeholder={generatePeriodPlaceholder()}
              value={formData.targetPeriod}
              onChange={(e) =>
                setFormData({ ...formData, targetPeriod: e.target.value })
              }
              className={`${
                formData.targetPeriod &&
                !validatePeriodFormat(
                  formData.targetPeriod,
                  formData.targetType
                )
                  ? "border-red-500 focus:ring-red-500"
                  : ""
              }`}
            />
            {formData.targetPeriod &&
              !validatePeriodFormat(
                formData.targetPeriod,
                formData.targetType
              ) && (
                <p className="text-red-500 text-xs mt-1">
                  Invalid format. Use: {generatePeriodPlaceholder()}
                </p>
              )}
          </FormField>

          <FormField label="Target Amount" htmlFor="targetAmount" required>
            <Input
              type="number"
              name="targetAmount"
              placeholder="0"
              min="0"
              step="1000"
              value={formData.targetAmount}
              onChange={(e) =>
                setFormData({ ...formData, targetAmount: e.target.value })
              }
            />
          </FormField>
        </div>

        <div className="flex items-center gap-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
          >
            {isSubmitting ? "Creating..." : "Create Target"}
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="px-6 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors duration-200 font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
