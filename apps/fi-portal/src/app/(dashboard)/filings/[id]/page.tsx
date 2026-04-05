"use client";

import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  StatusBadge,
  Badge,
} from "@reg-tech/ui";
import type { FilingStatus } from "@reg-tech/ui";
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
} from "lucide-react";

const timelineSteps: {
  status: FilingStatus;
  label: string;
  icon: typeof Clock;
  timestamp: string | null;
}[] = [
  { status: "DRAFT", label: "Created", icon: Clock, timestamp: "2026-03-20 09:15" },
  { status: "SUBMITTED", label: "Submitted", icon: Send, timestamp: "2026-04-01 14:32" },
  { status: "VALIDATED", label: "Validated", icon: CheckCircle2, timestamp: "2026-04-01 14:35" },
  { status: "REJECTED", label: "Rejected", icon: XCircle, timestamp: null },
  { status: "TRANSMITTED", label: "Transmitted", icon: Send, timestamp: null },
];

const validationResults = [
  { rule: "Schema Validation", passed: true, message: "XML conforms to CRS schema v2.0" },
  { rule: "GIIN Format", passed: true, message: "All GIINs are in valid format" },
  { rule: "Account Number Check", passed: true, message: "142 accounts validated" },
  { rule: "TIN Validation", passed: false, message: "3 accounts have missing or invalid TINs" },
  { rule: "Duplicate Check", passed: true, message: "No duplicate account records found" },
];

export default function FilingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const filingId = params.id as string;

  const currentStatus: FilingStatus = "VALIDATED";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{filingId}</h1>
            <StatusBadge status={currentStatus} />
          </div>
          <p className="text-sm text-slate-500">CRS Filing - Reporting Period 2025</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main info */}
        <div className="space-y-6 lg:col-span-2">
          {/* Status Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {timelineSteps.map((step, idx) => {
                  const Icon = step.icon;
                  const isCompleted = step.timestamp !== null;
                  return (
                    <div key={step.status} className="flex gap-4 pb-6 last:pb-0">
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full ${
                            isCompleted
                              ? "bg-primary-100 text-primary-700"
                              : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        {idx < timelineSteps.length - 1 && (
                          <div
                            className={`mt-1 h-full w-px ${
                              isCompleted ? "bg-primary-200" : "bg-slate-200"
                            }`}
                          />
                        )}
                      </div>
                      <div className="pb-2">
                        <p
                          className={`text-sm font-medium ${
                            isCompleted ? "text-slate-900" : "text-slate-400"
                          }`}
                        >
                          {step.label}
                        </p>
                        {step.timestamp && (
                          <p className="text-xs text-slate-500">{step.timestamp}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Validation Results */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Validation Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {validationResults.map((result, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 rounded-md border border-slate-100 p-3"
                  >
                    {result.passed ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
                    ) : (
                      <XCircle className="mt-0.5 h-4 w-4 text-red-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {result.rule}
                      </p>
                      <p className="text-sm text-slate-500">{result.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filing Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Type</span>
                <span className="font-medium">CRS</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Period</span>
                <span className="font-medium">2025</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Accounts</span>
                <span className="font-medium">142</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Jurisdiction</span>
                <span className="font-medium">GB</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Created</span>
                <span className="font-medium">2026-03-20</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 rounded-md border border-slate-100 p-3 hover:bg-slate-50">
                <FileText className="h-4 w-4 text-slate-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">CRS_2025_report.xml</p>
                  <p className="text-xs text-slate-400">2.4 MB</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-md border border-slate-100 p-3 hover:bg-slate-50">
                <FileText className="h-4 w-4 text-slate-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">validation_report.pdf</p>
                  <p className="text-xs text-slate-400">156 KB</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
