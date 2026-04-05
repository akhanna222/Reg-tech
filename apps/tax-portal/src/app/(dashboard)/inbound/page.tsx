"use client";

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
import { Inbox } from "lucide-react";

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

export default function InboundPage() {
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
