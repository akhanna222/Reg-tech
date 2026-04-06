"use client";

import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Button,
  StatusBadge,
  Badge,
} from "@reg-tech/ui";
import type { FilingStatus } from "@reg-tech/ui";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { useState } from "react";

const validationErrors = [
  { severity: "error", code: "TIN-001", message: "Missing TIN for account holder: John Doe (Account #1234)", field: "TIN" },
  { severity: "error", code: "TIN-002", message: "Invalid TIN format for account holder: Jane Smith (Account #5678)", field: "TIN" },
  { severity: "warning", code: "ADDR-001", message: "Incomplete address for account holder: Bob Johnson (Account #9012)", field: "Address" },
  { severity: "error", code: "TIN-003", message: "Missing TIN for account holder: Alice Brown (Account #3456)", field: "TIN" },
];

export default function SubmissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const submissionId = params.id as string;
  const [currentStatus, setCurrentStatus] = useState<FilingStatus>("SUBMITTED");

  const handleApprove = () => {
    setCurrentStatus("VALIDATED");
  };

  const handleReject = () => {
    setCurrentStatus("REJECTED");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{submissionId}</h1>
            <StatusBadge status={currentStatus} />
          </div>
          <p className="text-sm text-slate-400">
            Acme Bank Ltd - CRS Filing - Period 2025
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Validation Errors */}
          <Card className="border-navy-700 bg-navy-900">
            <CardHeader>
              <CardTitle className="text-lg text-white">
                Validation Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {validationErrors.map((err, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 rounded-md border border-navy-700 bg-navy-800 p-3"
                  >
                    {err.severity === "error" ? (
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                    ) : (
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={err.severity === "error" ? "destructive" : "warning"}
                          className="text-[10px]"
                        >
                          {err.code}
                        </Badge>
                        <span className="text-xs text-slate-500">{err.field}</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-300">{err.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Approval Actions */}
          {currentStatus === "SUBMITTED" && (
            <Card className="border-navy-700 bg-navy-900">
              <CardHeader>
                <CardTitle className="text-lg text-white">
                  Review Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-slate-400">
                  Review the validation results above and choose an action for this submission.
                </p>
              </CardContent>
              <CardFooter className="gap-3">
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleApprove}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Approve & Validate
                </Button>
                <Button variant="destructive" onClick={handleReject}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="border-navy-700 bg-navy-900">
            <CardHeader>
              <CardTitle className="text-lg text-white">
                Submission Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                ["FI Name", "Acme Bank Ltd"],
                ["Type", "CRS"],
                ["Period", "2025"],
                ["Jurisdiction", "GB"],
                ["Accounts", "142"],
                ["Submitted", "2026-04-01"],
                ["GIIN", "A1B2C3.12345.LE.826"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-medium text-slate-200">{value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
