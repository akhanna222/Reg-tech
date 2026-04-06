"use client";

import { Card, CardHeader, CardTitle, CardContent, StatusBadge } from "@reg-tech/ui";
import type { FilingStatus } from "@reg-tech/ui";

const statusCounts: { status: FilingStatus; count: number; label: string }[] = [
  { status: "DRAFT", count: 5, label: "Drafts" },
  { status: "SUBMITTED", count: 12, label: "Submitted" },
  { status: "VALIDATED", count: 28, label: "Validated" },
  { status: "REJECTED", count: 2, label: "Rejected" },
  { status: "TRANSMITTED", count: 45, label: "Transmitted" },
];

const recentFilings = [
  { id: "FIL-2026-001", type: "CRS", status: "SUBMITTED" as FilingStatus, date: "2026-04-01" },
  { id: "FIL-2026-002", type: "FATCA", status: "VALIDATED" as FilingStatus, date: "2026-03-28" },
  { id: "FIL-2026-003", type: "CRS", status: "REJECTED" as FilingStatus, date: "2026-03-25" },
  { id: "FIL-2026-004", type: "FATCA", status: "DRAFT" as FilingStatus, date: "2026-03-20" },
];

export default function OverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
        <p className="text-sm text-slate-500">
          Summary of your regulatory filing activity
        </p>
      </div>

      {/* Status count cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statusCounts.map(({ status, count, label }) => (
          <Card key={status}>
            <CardHeader className="pb-2">
              <p className="text-sm font-medium text-slate-500">{label}</p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-slate-900">{count}</span>
                <StatusBadge status={status} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent filings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Filings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentFilings.map((filing) => (
              <div
                key={filing.id}
                className="flex items-center justify-between rounded-md border border-slate-100 p-4 hover:bg-slate-50"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-medium text-slate-900">{filing.id}</p>
                    <p className="text-sm text-slate-500">{filing.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-500">{filing.date}</span>
                  <StatusBadge status={filing.status} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
