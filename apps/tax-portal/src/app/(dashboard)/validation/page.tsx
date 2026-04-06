"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@reg-tech/ui";
import { CheckCircle2, XCircle, AlertTriangle, Clock } from "lucide-react";

const summaryCards = [
  {
    title: "Passed",
    count: 156,
    icon: CheckCircle2,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    description: "Submissions passed all validation rules",
  },
  {
    title: "Failed",
    count: 23,
    icon: XCircle,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    description: "Submissions with critical validation errors",
  },
  {
    title: "Warnings",
    count: 45,
    icon: AlertTriangle,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    description: "Submissions with non-critical warnings",
  },
  {
    title: "Pending",
    count: 12,
    icon: Clock,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    description: "Awaiting validation processing",
  },
];

const recentValidations = [
  { id: "VAL-001", submission: "SUB-2026-007", fi: "Asia Pacific Holdings", result: "passed", errors: 0, warnings: 2, time: "2 min ago" },
  { id: "VAL-002", submission: "SUB-2026-005", fi: "Acme Bank Ltd", result: "failed", errors: 3, warnings: 1, time: "15 min ago" },
  { id: "VAL-003", submission: "SUB-2026-006", fi: "Nordic Invest AS", result: "passed", errors: 0, warnings: 0, time: "1 hr ago" },
  { id: "VAL-004", submission: "SUB-2026-004", fi: "Euro Capital AG", result: "passed", errors: 0, warnings: 5, time: "2 hr ago" },
  { id: "VAL-005", submission: "SUB-2026-003", fi: "Pacific Finance Inc", result: "failed", errors: 8, warnings: 3, time: "3 hr ago" },
];

export default function ValidationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Validation Dashboard</h1>
        <p className="text-sm text-slate-400">
          Overview of schema and business rule validation results
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="border-navy-700 bg-navy-900">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className={`rounded-lg p-2.5 ${card.bgColor}`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{card.count}</p>
                    <p className="text-sm text-slate-400">{card.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-navy-700 bg-navy-900">
        <CardHeader>
          <CardTitle className="text-lg text-white">Recent Validations</CardTitle>
          <CardDescription className="text-slate-400">
            Latest validation processing results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentValidations.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between rounded-md border border-navy-700 bg-navy-800 p-4"
              >
                <div className="flex items-center gap-4">
                  {v.result === "passed" ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-400" />
                  )}
                  <div>
                    <p className="font-medium text-slate-200">{v.fi}</p>
                    <p className="text-xs text-slate-500">{v.submission}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  {v.errors > 0 && (
                    <span className="text-red-400">{v.errors} errors</span>
                  )}
                  {v.warnings > 0 && (
                    <span className="text-amber-400">{v.warnings} warnings</span>
                  )}
                  {v.errors === 0 && v.warnings === 0 && (
                    <span className="text-emerald-400">Clean</span>
                  )}
                  <span className="text-slate-500">{v.time}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
