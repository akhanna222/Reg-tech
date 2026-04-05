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
  Input,
} from "@reg-tech/ui";
import type { ColumnDef, FilingStatus } from "@reg-tech/ui";
import { Search } from "lucide-react";

interface Submission {
  id: string;
  fiName: string;
  type: string;
  jurisdiction: string;
  status: FilingStatus;
  accountCount: number;
  submittedAt: string;
  [key: string]: unknown;
}

const mockSubmissions: Submission[] = [
  { id: "SUB-2026-001", fiName: "Acme Bank Ltd", type: "CRS", jurisdiction: "GB", status: "SUBMITTED", accountCount: 142, submittedAt: "2026-04-01" },
  { id: "SUB-2026-002", fiName: "Global Trust Corp", type: "FATCA", jurisdiction: "US", status: "VALIDATED", accountCount: 89, submittedAt: "2026-03-30" },
  { id: "SUB-2026-003", fiName: "Pacific Finance Inc", type: "CRS", jurisdiction: "SG", status: "REJECTED", accountCount: 56, submittedAt: "2026-03-28" },
  { id: "SUB-2026-004", fiName: "Euro Capital AG", type: "CRS", jurisdiction: "DE", status: "TRANSMITTED", accountCount: 320, submittedAt: "2026-03-25" },
  { id: "SUB-2026-005", fiName: "Acme Bank Ltd", type: "FATCA", jurisdiction: "GB", status: "SUBMITTED", accountCount: 67, submittedAt: "2026-04-02" },
  { id: "SUB-2026-006", fiName: "Nordic Invest AS", type: "CRS", jurisdiction: "NO", status: "VALIDATED", accountCount: 210, submittedAt: "2026-03-22" },
  { id: "SUB-2026-007", fiName: "Asia Pacific Holdings", type: "FATCA", jurisdiction: "HK", status: "SUBMITTED", accountCount: 445, submittedAt: "2026-04-03" },
];

const allStatuses: FilingStatus[] = ["SUBMITTED", "VALIDATED", "REJECTED", "TRANSMITTED"];

export default function SubmissionsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilingStatus | "ALL">("ALL");
  const [jurisdictionFilter, setJurisdictionFilter] = useState<string>("ALL");

  const jurisdictions = Array.from(new Set(mockSubmissions.map((s) => s.jurisdiction))).sort();

  const columns: ColumnDef<Submission>[] = [
    { key: "id", header: "Submission ID", sortable: true },
    { key: "fiName", header: "FI Name", sortable: true },
    { key: "type", header: "Type", sortable: true },
    { key: "jurisdiction", header: "Jurisdiction", sortable: true },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (value) => <StatusBadge status={value as FilingStatus} />,
    },
    { key: "accountCount", header: "Accounts", sortable: true },
    { key: "submittedAt", header: "Submitted", sortable: true },
  ];

  const filtered = mockSubmissions.filter((s) => {
    const matchesSearch =
      search === "" ||
      s.id.toLowerCase().includes(search.toLowerCase()) ||
      s.fiName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || s.status === statusFilter;
    const matchesJurisdiction =
      jurisdictionFilter === "ALL" || s.jurisdiction === jurisdictionFilter;
    return matchesSearch && matchesStatus && matchesJurisdiction;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Submissions</h1>
        <p className="text-sm text-slate-400">
          Review and manage incoming FI regulatory submissions
        </p>
      </div>

      <Card className="border-navy-700 bg-navy-900">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg text-white">All Submissions</CardTitle>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  placeholder="Search..."
                  className="border-navy-600 bg-navy-800 pl-9 text-white placeholder:text-slate-500 w-52"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                className="h-10 rounded-md border border-navy-600 bg-navy-800 px-3 text-sm text-slate-300"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as FilingStatus | "ALL")}
              >
                <option value="ALL">All Statuses</option>
                {allStatuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select
                className="h-10 rounded-md border border-navy-600 bg-navy-800 px-3 text-sm text-slate-300"
                value={jurisdictionFilter}
                onChange={(e) => setJurisdictionFilter(e.target.value)}
              >
                <option value="ALL">All Jurisdictions</option>
                {jurisdictions.map((j) => (
                  <option key={j} value={j}>{j}</option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filtered}
            emptyMessage="No submissions match your criteria."
            onRowClick={(row) => router.push(`/submissions/${row.id}`)}
            className="border-navy-700"
          />
        </CardContent>
      </Card>
    </div>
  );
}
