"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Input,
} from "@reg-tech/ui";
import { Search, CheckCircle2, XCircle } from "lucide-react";

type EnrolmentStatus = "PENDING" | "APPROVED" | "REJECTED";

interface Enrolment {
  id: string;
  orgName: string;
  orgType: string;
  giin: string;
  jurisdiction: string;
  contactEmail: string;
  submittedAt: string;
  status: EnrolmentStatus;
}

const mockEnrolments: Enrolment[] = [
  { id: "ENR-001", orgName: "Nova Financial Group", orgType: "Bank", giin: "X1Y2Z3.00001.LE.826", jurisdiction: "GB", contactEmail: "admin@novafinancial.com", submittedAt: "2026-04-03", status: "PENDING" },
  { id: "ENR-002", orgName: "Sunrise Capital Ltd", orgType: "Investment Entity", giin: "A1B2C3.00002.LE.840", jurisdiction: "US", contactEmail: "ops@sunrisecap.com", submittedAt: "2026-04-02", status: "PENDING" },
  { id: "ENR-003", orgName: "Alpine Trust SA", orgType: "Custodial Institution", giin: "D4E5F6.00003.LE.756", jurisdiction: "CH", contactEmail: "compliance@alpinetrust.ch", submittedAt: "2026-03-28", status: "APPROVED" },
  { id: "ENR-004", orgName: "Oceanic Finance Pty", orgType: "Depository Institution", giin: "G7H8I9.00004.LE.036", jurisdiction: "AU", contactEmail: "reg@oceanicfin.com.au", submittedAt: "2026-03-25", status: "REJECTED" },
];

const statusColors: Record<EnrolmentStatus, "warning" | "success" | "destructive"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
};

export default function EnrolmentsPage() {
  const [enrolments, setEnrolments] = useState(mockEnrolments);
  const [search, setSearch] = useState("");

  const handleApprove = (id: string) => {
    setEnrolments((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: "APPROVED" as EnrolmentStatus } : e))
    );
  };

  const handleReject = (id: string) => {
    setEnrolments((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: "REJECTED" as EnrolmentStatus } : e))
    );
  };

  const filtered = enrolments.filter(
    (e) =>
      search === "" ||
      e.orgName.toLowerCase().includes(search.toLowerCase()) ||
      e.giin.toLowerCase().includes(search.toLowerCase())
  );

  const pending = filtered.filter((e) => e.status === "PENDING");
  const processed = filtered.filter((e) => e.status !== "PENDING");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">FI Enrolment Queue</h1>
        <p className="text-sm text-slate-400">
          Review and approve Financial Institution enrolment requests
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <Input
          placeholder="Search by name or GIIN..."
          className="border-navy-600 bg-navy-800 pl-9 text-white placeholder:text-slate-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Pending */}
      <Card className="border-navy-700 bg-navy-900">
        <CardHeader>
          <CardTitle className="text-lg text-white">
            Pending Approvals ({pending.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No pending enrolment requests
            </p>
          ) : (
            <div className="space-y-4">
              {pending.map((enrolment) => (
                <div
                  key={enrolment.id}
                  className="rounded-md border border-navy-700 bg-navy-800 p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">{enrolment.orgName}</p>
                        <Badge variant="warning" className="text-[10px]">Pending</Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-400">
                        <span>Type: {enrolment.orgType}</span>
                        <span>GIIN: {enrolment.giin}</span>
                        <span>Jurisdiction: {enrolment.jurisdiction}</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {enrolment.contactEmail} - Submitted {enrolment.submittedAt}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => handleApprove(enrolment.id)}
                      >
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(enrolment.id)}
                      >
                        <XCircle className="mr-1 h-3 w-3" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processed */}
      <Card className="border-navy-700 bg-navy-900">
        <CardHeader>
          <CardTitle className="text-lg text-white">
            Processed ({processed.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {processed.map((enrolment) => (
              <div
                key={enrolment.id}
                className="flex items-center justify-between rounded-md border border-navy-700 bg-navy-800 p-3"
              >
                <div>
                  <p className="font-medium text-slate-200">{enrolment.orgName}</p>
                  <p className="text-xs text-slate-500">
                    {enrolment.giin} - {enrolment.jurisdiction}
                  </p>
                </div>
                <Badge variant={statusColors[enrolment.status]}>
                  {enrolment.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
