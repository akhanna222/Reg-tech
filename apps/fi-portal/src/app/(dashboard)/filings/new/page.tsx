"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Input,
  Label,
} from "@reg-tech/ui";

export default function NewFilingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    filingType: "",
    reportingPeriod: "",
    jurisdiction: "",
    notes: "",
  });

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Mock creation - in production this calls the filing API
    await new Promise((resolve) => setTimeout(resolve, 800));
    setLoading(false);
    router.push("/filings");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Create New Filing</h1>
        <p className="text-sm text-slate-500">
          Start a new regulatory report manually
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="text-lg">Filing Details</CardTitle>
            <CardDescription>
              Provide the basic information for this filing
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="filingType">Filing Type</Label>
              <select
                id="filingType"
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
                value={formData.filingType}
                onChange={(e) => updateField("filingType", e.target.value)}
                required
              >
                <option value="">Select filing type</option>
                <option value="CRS">CRS (Common Reporting Standard)</option>
                <option value="FATCA">FATCA (Foreign Account Tax Compliance Act)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reportingPeriod">Reporting Period</Label>
                <select
                  id="reportingPeriod"
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
                  value={formData.reportingPeriod}
                  onChange={(e) => updateField("reportingPeriod", e.target.value)}
                  required
                >
                  <option value="">Select period</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="jurisdiction">Reporting Jurisdiction</Label>
                <Input
                  id="jurisdiction"
                  placeholder="e.g. US, GB, SG"
                  value={formData.jurisdiction}
                  onChange={(e) => updateField("jurisdiction", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <textarea
                id="notes"
                rows={3}
                className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
                placeholder="Any additional notes for this filing..."
                value={formData.notes}
                onChange={(e) => updateField("notes", e.target.value)}
              />
            </div>
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Filing"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
