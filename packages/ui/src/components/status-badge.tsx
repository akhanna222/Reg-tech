"use client";

import * as React from "react";
import { Badge, type BadgeProps } from "./badge";
import { cn } from "../lib/utils";

export type FilingStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "VALIDATED"
  | "REJECTED"
  | "TRANSMITTED";

const statusConfig: Record<
  FilingStatus,
  { variant: BadgeProps["variant"]; label: string; dotColor: string }
> = {
  DRAFT: { variant: "secondary", label: "Draft", dotColor: "bg-slate-400" },
  SUBMITTED: { variant: "default", label: "Submitted", dotColor: "bg-blue-500" },
  VALIDATED: { variant: "success", label: "Validated", dotColor: "bg-emerald-500" },
  REJECTED: { variant: "destructive", label: "Rejected", dotColor: "bg-red-500" },
  TRANSMITTED: { variant: "success", label: "Transmitted", dotColor: "bg-green-700" },
};

export interface StatusBadgeProps extends Omit<BadgeProps, "variant"> {
  status: FilingStatus;
}

export function StatusBadge({ status, className, ...props }: StatusBadgeProps) {
  const config = statusConfig[status] ?? {
    variant: "outline" as const,
    label: status,
    dotColor: "bg-slate-400",
  };

  return (
    <Badge variant={config.variant} className={cn("gap-1.5", className)} {...props}>
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dotColor)} />
      {config.label}
    </Badge>
  );
}
