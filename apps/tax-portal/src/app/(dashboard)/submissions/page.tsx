"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  DataTable,
  StatusBadge,
  Input,
} from "@reg-tech/ui";
import type { ColumnDef, FilingStatus } from "@reg-tech/ui";
import { Search, Send, X, AlertTriangle, CheckCircle2 } from "lucide-react";

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

const JURISDICTIONS_MAP: Record<string, string> = {
  GB: "United Kingdom",
  US: "United States",
  SG: "Singapore",
  DE: "Germany",
  NO: "Norway",
  HK: "Hong Kong",
  AU: "Australia",
  FR: "France",
  JP: "Japan",
};

export default function SubmissionsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilingStatus | "ALL">("ALL");
  const [jurisdictionFilter, setJurisdictionFilter] = useState<string>("ALL");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [batchDestination, setBatchDestination] = useState("");
  const [transmitting, setTransmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const jurisdictions = Array.from(new Set(mockSubmissions.map((s) => s.jurisdiction))).sort();

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

  const validatedFiltered = filtered.filter((s) => s.status === "VALIDATED");
  const allValidatedSelected =
    validatedFiltered.length > 0 &&
    validatedFiltered.every((s) => selectedIds.has(s.id));

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (allValidatedSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        validatedFiltered.forEach((s) => next.delete(s.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        validatedFiltered.forEach((s) => next.add(s.id));
        return next;
      });
    }
  }, [allValidatedSelected, validatedFiltered]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleTransmitSelected = () => {
    setBatchDestination("");
    setShowConfirmDialog(true);
  };

  const handleConfirmTransmit = async () => {
    if (!batchDestination || batchDestination.length !== 2) return;

    setTransmitting(true);
    try {
      const res = await fetch("/api/ta/submissions/batch/transmit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filingIds: Array.from(selectedIds),
          destination: batchDestination.toUpperCase(),
        }),
      });

      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }

      const result: { queued: number; errors: Array<{ filingId: string; error: string }> } =
        await res.json();

      if (result.errors.length > 0) {
        setToast({
          type: "error",
          message: `${result.queued} filing(s) queued. ${result.errors.length} failed: ${result.errors.map((e) => `${e.filingId}: ${e.error}`).join("; ")}`,
        });
      } else {
        setToast({
          type: "success",
          message: `${result.queued} filing(s) successfully queued for transmission to ${batchDestination.toUpperCase()}.`,
        });
      }

      setSelectedIds(new Set());
      setShowConfirmDialog(false);
    } catch (err) {
      setToast({
        type: "error",
        message: err instanceof Error ? err.message : "Batch transmission failed",
      });
    } finally {
      setTransmitting(false);
    }
  };

  // Auto-dismiss toast
  if (toast) {
    setTimeout(() => setToast(null), 6000);
  }

  const columns: ColumnDef<Submission>[] = [
    {
      key: "id" as keyof Submission,
      header: "",
      render: (_value, row) => {
        if (!row || row.status !== "VALIDATED") {
          return <div className="w-5" />;
        }
        return (
          <input
            type="checkbox"
            checked={selectedIds.has(row.id)}
            onChange={(e) => {
              e.stopPropagation();
              toggleSelect(row.id);
            }}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4 rounded border-navy-600 bg-navy-800 text-primary-600 focus:ring-primary-500 cursor-pointer"
          />
        );
      },
    },
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Submissions</h1>
        <p className="text-sm text-slate-400">
          Review and manage incoming FI regulatory submissions
        </p>
      </div>

      {/* Toast notification */}
      {toast && (
        <div
          className={`flex items-center gap-3 rounded-md border px-4 py-3 text-sm ${
            toast.type === "success"
              ? "border-emerald-700 bg-emerald-900/50 text-emerald-300"
              : "border-red-700 bg-red-900/50 text-red-300"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0" />
          )}
          <span className="flex-1">{toast.message}</span>
          <button onClick={() => setToast(null)} className="shrink-0 hover:opacity-75">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

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
              {/* Select All toggle for validated filings */}
              {validatedFiltered.length > 0 && (
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allValidatedSelected}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-navy-600 bg-navy-800 text-primary-600 focus:ring-primary-500"
                  />
                  Select All Validated
                </label>
              )}
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

      {/* Floating action bar for batch operations */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
          <div className="flex items-center gap-4 rounded-lg border border-navy-600 bg-navy-800 px-6 py-3 shadow-xl">
            <span className="text-sm font-medium text-white">
              {selectedIds.size} filing{selectedIds.size !== 1 ? "s" : ""} selected
            </span>
            <Button
              onClick={handleTransmitSelected}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              <Send className="mr-2 h-4 w-4" />
              Transmit Selected
            </Button>
            <Button
              onClick={clearSelection}
              variant="ghost"
              className="text-slate-400 hover:text-white"
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* Confirmation dialog overlay */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-lg border border-navy-600 bg-navy-900 p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-white mb-2">
              Confirm Batch Transmission
            </h2>
            <p className="text-sm text-slate-400 mb-4">
              You are about to transmit{" "}
              <span className="font-semibold text-white">{selectedIds.size}</span>{" "}
              filing{selectedIds.size !== 1 ? "s" : ""}. Select the destination
              jurisdiction to continue.
            </p>

            <label className="block text-sm font-medium text-slate-300 mb-1">
              Destination Jurisdiction
            </label>
            <select
              value={batchDestination}
              onChange={(e) => setBatchDestination(e.target.value)}
              className="mb-4 h-10 w-full rounded-md border border-navy-600 bg-navy-800 px-3 text-sm text-slate-300"
            >
              <option value="">Select jurisdiction...</option>
              {Object.entries(JURISDICTIONS_MAP).map(([code, name]) => (
                <option key={code} value={code}>
                  {code} - {name}
                </option>
              ))}
            </select>

            {batchDestination && (
              <div className="mb-4 rounded-md border border-navy-600 bg-navy-800/50 px-3 py-2">
                <p className="text-sm text-slate-300">
                  <AlertTriangle className="mr-1 inline h-4 w-4 text-amber-400" />
                  This will transmit {selectedIds.size} filing
                  {selectedIds.size !== 1 ? "s" : ""} to{" "}
                  <span className="font-semibold text-white">
                    {batchDestination} - {JURISDICTIONS_MAP[batchDestination] ?? batchDestination}
                  </span>
                  . This action cannot be undone.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => setShowConfirmDialog(false)}
                className="text-slate-400 hover:text-white"
                disabled={transmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmTransmit}
                disabled={!batchDestination || transmitting}
                className="bg-primary-600 hover:bg-primary-700 text-white disabled:opacity-50"
              >
                {transmitting ? "Transmitting..." : "Confirm Transmission"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
