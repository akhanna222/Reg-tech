"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Badge,
  DataTable,
} from "@reg-tech/ui";
import type { ColumnDef } from "@reg-tech/ui";
import { Send, RefreshCw, CheckCircle2, Clock, XCircle } from "lucide-react";

type TransmissionStatus = "QUEUED" | "IN_PROGRESS" | "COMPLETED" | "FAILED";

interface Transmission {
  id: string;
  destination: string;
  submissionCount: number;
  status: TransmissionStatus;
  initiatedAt: string;
  completedAt: string | null;
  [key: string]: unknown;
}

const mockTransmissions: Transmission[] = [
  { id: "TXN-001", destination: "IRS (United States)", submissionCount: 45, status: "COMPLETED", initiatedAt: "2026-03-28 10:00", completedAt: "2026-03-28 10:12" },
  { id: "TXN-002", destination: "HMRC (United Kingdom)", submissionCount: 32, status: "COMPLETED", initiatedAt: "2026-03-28 11:00", completedAt: "2026-03-28 11:08" },
  { id: "TXN-003", destination: "BZSt (Germany)", submissionCount: 18, status: "IN_PROGRESS", initiatedAt: "2026-04-05 09:00", completedAt: null },
  { id: "TXN-004", destination: "IRAS (Singapore)", submissionCount: 8, status: "QUEUED", initiatedAt: "2026-04-05 09:15", completedAt: null },
  { id: "TXN-005", destination: "ATO (Australia)", submissionCount: 12, status: "FAILED", initiatedAt: "2026-04-04 14:00", completedAt: null },
];

const statusIcon: Record<TransmissionStatus, typeof Clock> = {
  QUEUED: Clock,
  IN_PROGRESS: RefreshCw,
  COMPLETED: CheckCircle2,
  FAILED: XCircle,
};

const statusVariant: Record<TransmissionStatus, "secondary" | "default" | "success" | "destructive"> = {
  QUEUED: "secondary",
  IN_PROGRESS: "default",
  COMPLETED: "success",
  FAILED: "destructive",
};

export default function TransmissionPage() {
  const [transmissions] = useState(mockTransmissions);

  const columns: ColumnDef<Transmission>[] = [
    { key: "id", header: "Transmission ID", sortable: true },
    { key: "destination", header: "Destination", sortable: true },
    { key: "submissionCount", header: "Submissions", sortable: true },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (value) => {
        const status = value as TransmissionStatus;
        return <Badge variant={statusVariant[status]}>{status.replace("_", " ")}</Badge>;
      },
    },
    { key: "initiatedAt", header: "Initiated", sortable: true },
    {
      key: "completedAt",
      header: "Completed",
      render: (value) => (value as string) || "—",
    },
  ];

  const queued = transmissions.filter((t) => t.status === "QUEUED").length;
  const inProgress = transmissions.filter((t) => t.status === "IN_PROGRESS").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Transmission Management
          </h1>
          <p className="text-sm text-slate-400">
            Manage outbound CRS/FATCA transmissions to partner jurisdictions
          </p>
        </div>
        <Button className="bg-primary-600 hover:bg-primary-700">
          <Send className="mr-2 h-4 w-4" />
          New Transmission
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {[
          { label: "Queued", count: queued, color: "text-slate-400" },
          { label: "In Progress", count: inProgress, color: "text-blue-400" },
          { label: "Completed", count: transmissions.filter((t) => t.status === "COMPLETED").length, color: "text-emerald-400" },
          { label: "Failed", count: transmissions.filter((t) => t.status === "FAILED").length, color: "text-red-400" },
        ].map((stat) => (
          <Card key={stat.label} className="border-navy-700 bg-navy-900">
            <CardContent className="pt-6">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.count}</p>
              <p className="text-sm text-slate-500">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-navy-700 bg-navy-900">
        <CardHeader>
          <CardTitle className="text-lg text-white">
            Transmission History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={transmissions}
            emptyMessage="No transmissions found."
            className="border-navy-700"
          />
        </CardContent>
      </Card>
    </div>
  );
}
