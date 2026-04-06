"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  DataTable,
  Badge,
} from "@reg-tech/ui";
import type { ColumnDef } from "@reg-tech/ui";
import { Inbox, RefreshCw, Activity, CheckCircle, XCircle } from "lucide-react";

type InboundStatus = "RECEIVED" | "PROCESSING" | "IMPORTED" | "ERROR";

interface InboundTransmission {
  id: string;
  sourceJurisdiction: string;
  type: string;
  recordCount: number;
  receivedAt: string;
  status: InboundStatus;
  [key: string]: unknown;
}

const mockInbound: InboundTransmission[] = [
  { id: "INB-001", sourceJurisdiction: "United States (IRS)", type: "FATCA", recordCount: 1240, receivedAt: "2026-04-04 08:30", status: "IMPORTED" },
  { id: "INB-002", sourceJurisdiction: "Germany (BZSt)", type: "CRS", recordCount: 856, receivedAt: "2026-04-03 14:15", status: "IMPORTED" },
  { id: "INB-003", sourceJurisdiction: "Singapore (IRAS)", type: "CRS", recordCount: 432, receivedAt: "2026-04-05 06:00", status: "PROCESSING" },
  { id: "INB-004", sourceJurisdiction: "Australia (ATO)", type: "CRS", recordCount: 298, receivedAt: "2026-04-05 07:45", status: "RECEIVED" },
  { id: "INB-005", sourceJurisdiction: "Switzerland (FTA)", type: "CRS", recordCount: 0, receivedAt: "2026-04-02 11:00", status: "ERROR" },
];

const statusVariant: Record<InboundStatus, "secondary" | "default" | "success" | "destructive"> = {
  RECEIVED: "secondary",
  PROCESSING: "default",
  IMPORTED: "success",
  ERROR: "destructive",
};

interface PollStatus {
  enabled: boolean;
  jurisdictions: string[];
  lastPollTimestamp: string | null;
  cronExpression: string;
}

interface HealthResult {
  jurisdiction: string;
  reachable: boolean;
  latencyMs: number;
  error?: string;
}

function cronToNextRun(cron: string): string {
  // Simple human-readable display for common cron patterns
  if (cron === "0 */4 * * *") return "Every 4 hours";
  if (cron === "0 */1 * * *") return "Every hour";
  return cron;
}

export default function InboundPage() {
  const [pollStatus, setPollStatus] = useState<PollStatus | null>(null);
  const [healthResults, setHealthResults] = useState<HealthResult[]>([]);
  const [polling, setPolling] = useState(false);
  const [checkingHealth, setCheckingHealth] = useState(false);

  const fetchPollStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/cts/poll/status", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPollStatus(data);
      }
    } catch {
      // Silently fail — status card will show "unavailable"
    }
  }, []);

  const fetchHealth = useCallback(async () => {
    setCheckingHealth(true);
    try {
      const res = await fetch("/api/cts/health", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) {
        const data = await res.json();
        setHealthResults(data.jurisdictions ?? []);
      }
    } catch {
      // Silently fail
    } finally {
      setCheckingHealth(false);
    }
  }, []);

  useEffect(() => {
    fetchPollStatus();
    fetchHealth();
  }, [fetchPollStatus, fetchHealth]);

  const handlePollNow = async () => {
    setPolling(true);
    try {
      await fetch("/api/cts/poll", {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      await fetchPollStatus();
    } catch {
      // Error handled by UI
    } finally {
      setPolling(false);
    }
  };

  const columns: ColumnDef<InboundTransmission>[] = [
    { key: "id", header: "ID", sortable: true },
    { key: "sourceJurisdiction", header: "Source Jurisdiction", sortable: true },
    { key: "type", header: "Type", sortable: true },
    { key: "recordCount", header: "Records", sortable: true },
    { key: "receivedAt", header: "Received At", sortable: true },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (value) => {
        const status = value as InboundStatus;
        return <Badge variant={statusVariant[status]}>{status}</Badge>;
      },
    },
  ];

  const imported = mockInbound.filter((i) => i.status === "IMPORTED").length;
  const processing = mockInbound.filter((i) => i.status === "PROCESSING" || i.status === "RECEIVED").length;
  const errors = mockInbound.filter((i) => i.status === "ERROR").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Inbound Transmissions</h1>
        <p className="text-sm text-slate-400">
          Data received from partner jurisdictions (Layer 5 - inbound exchange)
        </p>
      </div>

      {/* Poll Status & CTS Health */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="border-navy-700 bg-navy-900">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-white">
              <RefreshCw className="h-5 w-5 text-blue-400" />
              Poll Status
            </CardTitle>
            <CardDescription className="text-slate-400">
              Scheduled CTS inbox polling
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Status</span>
                <Badge variant={pollStatus?.enabled ? "success" : "secondary"}>
                  {pollStatus?.enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Schedule</span>
                <span className="text-white">
                  {pollStatus ? cronToNextRun(pollStatus.cronExpression) : "--"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Last Poll</span>
                <span className="text-white">
                  {pollStatus?.lastPollTimestamp
                    ? new Date(pollStatus.lastPollTimestamp).toLocaleString()
                    : "Never"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Jurisdictions</span>
                <span className="text-white">
                  {pollStatus?.jurisdictions?.join(", ") || "--"}
                </span>
              </div>
              <button
                onClick={handlePollNow}
                disabled={polling}
                className="mt-3 w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {polling ? "Polling..." : "Poll Now"}
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-navy-700 bg-navy-900">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-white">
              <Activity className="h-5 w-5 text-emerald-400" />
              CTS Health
            </CardTitle>
            <CardDescription className="text-slate-400">
              SFTP connectivity per jurisdiction
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {healthResults.length === 0 && (
                <p className="text-slate-500">No jurisdictions configured</p>
              )}
              {healthResults.map((h) => (
                <div key={h.jurisdiction} className="flex items-center justify-between">
                  <span className="text-white">{h.jurisdiction}</span>
                  <div className="flex items-center gap-2">
                    {h.reachable ? (
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                    <span className={h.reachable ? "text-emerald-400" : "text-red-400"}>
                      {h.reachable ? `${h.latencyMs}ms` : h.error || "Unreachable"}
                    </span>
                  </div>
                </div>
              ))}
              <button
                onClick={fetchHealth}
                disabled={checkingHealth}
                className="mt-3 w-full rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600 disabled:opacity-50"
              >
                {checkingHealth ? "Checking..." : "Check All"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-navy-700 bg-navy-900">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Inbox className="h-5 w-5 text-emerald-400" />
              <div>
                <p className="text-2xl font-bold text-white">{imported}</p>
                <p className="text-sm text-slate-400">Successfully Imported</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-navy-700 bg-navy-900">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Inbox className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-white">{processing}</p>
                <p className="text-sm text-slate-400">Pending / Processing</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-navy-700 bg-navy-900">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Inbox className="h-5 w-5 text-red-400" />
              <div>
                <p className="text-2xl font-bold text-white">{errors}</p>
                <p className="text-sm text-slate-400">Errors</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-navy-700 bg-navy-900">
        <CardHeader>
          <CardTitle className="text-lg text-white">
            Recent Inbound Data
          </CardTitle>
          <CardDescription className="text-slate-400">
            Transmissions received from foreign tax authorities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={mockInbound}
            emptyMessage="No inbound transmissions received."
            className="border-navy-700"
          />
        </CardContent>
      </Card>
    </div>
  );
}
