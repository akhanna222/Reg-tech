"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  DataTable,
  StatusBadge,
  Button,
  Input,
} from "@reg-tech/ui";
import type { ColumnDef, FilingStatus } from "@reg-tech/ui";
import { Plus, Search, Filter } from "lucide-react";

interface Filing {
  id: string;
  type: string;
  reportingPeriod: string;
  status: FilingStatus;
  accountCount: number;
  submittedAt: string;
  [key: string]: unknown;
}

const mockFilings: Filing[] = [
  { id: "FIL-2026-001", type: "CRS", reportingPeriod: "2025", status: "SUBMITTED", accountCount: 142, submittedAt: "2026-04-01" },
  { id: "FIL-2026-002", type: "FATCA", reportingPeriod: "2025", status: "VALIDATED", accountCount: 89, submittedAt: "2026-03-28" },
  { id: "FIL-2026-003", type: "CRS", reportingPeriod: "2025", status: "REJECTED", accountCount: 56, submittedAt: "2026-03-25" },
  { id: "FIL-2026-004", type: "FATCA", reportingPeriod: "2025", status: "DRAFT", accountCount: 0, submittedAt: "" },
  { id: "FIL-2026-005", type: "CRS", reportingPeriod: "2024", status: "TRANSMITTED", accountCount: 210, submittedAt: "2025-06-15" },
  { id: "FIL-2025-042", type: "FATCA", reportingPeriod: "2024", status: "TRANSMITTED", accountCount: 175, submittedAt: "2025-06-10" },
  { id: "FIL-2025-041", type: "CRS", reportingPeriod: "2024", status: "TRANSMITTED", accountCount: 320, submittedAt: "2025-05-20" },
];

const allStatuses: FilingStatus[] = ["DRAFT", "SUBMITTED", "VALIDATED", "REJECTED", "TRANSMITTED"];

export default function FilingsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilingStatus | "ALL">("ALL");

  const columns: ColumnDef<Filing>[] = [
    { key: "id", header: "Filing ID", sortable: true },
    { key: "type", header: "Type", sortable: true },
    { key: "reportingPeriod", header: "Period", sortable: true },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (value) => <StatusBadge status={value as FilingStatus} />,
    },
    { key: "accountCount", header: "Accounts", sortable: true },
    { key: "submittedAt", header: "Submitted", sortable: true },
  ];

  const filtered = mockFilings.filter((f) => {
    const matchesSearch =
      search === "" ||
      f.id.toLowerCase().includes(search.toLowerCase()) ||
      f.type.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || f.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Filings</h1>
          <p className="text-sm text-slate-500">
            Manage your regulatory filings and submissions
          </p>
        </div>
        <Button onClick={() => router.push("/filings/new")}>
          <Plus className="mr-2 h-4 w-4" />
          New Filing
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg">All Filings</CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search filings..."
                  className="pl-9 w-60"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as FilingStatus | "ALL")
                }
              >
                <option value="ALL">All Statuses</option>
                {allStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filtered}
            emptyMessage="No filings match your search criteria."
            onRowClick={(row) => router.push(`/filings/${row.id}`)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
