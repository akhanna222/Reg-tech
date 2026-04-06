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
  Label,
  FileUpload,
} from "@reg-tech/ui";

export default function UploadPage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [filingType, setFilingType] = useState("");
  const [reportingPeriod, setReportingPeriod] = useState("");

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) return;

    setUploading(true);
    // Mock upload - in production this calls the upload API
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setUploading(false);
    router.push("/filings");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Upload Filing</h1>
        <p className="text-sm text-slate-500">
          Upload an XML, CSV, or JSON file for automatic processing
        </p>
      </div>

      <Card>
        <form onSubmit={handleUpload}>
          <CardHeader>
            <CardTitle className="text-lg">File Upload</CardTitle>
            <CardDescription>
              Upload your regulatory report file. Supported formats: XML (CRS/FATCA schema), CSV, JSON.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="uploadFilingType">Filing Type</Label>
                <select
                  id="uploadFilingType"
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
                  value={filingType}
                  onChange={(e) => setFilingType(e.target.value)}
                  required
                >
                  <option value="">Select type</option>
                  <option value="CRS">CRS</option>
                  <option value="FATCA">FATCA</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="uploadPeriod">Reporting Period</Label>
                <select
                  id="uploadPeriod"
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
                  value={reportingPeriod}
                  onChange={(e) => setReportingPeriod(e.target.value)}
                  required
                >
                  <option value="">Select period</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Report File</Label>
              <FileUpload onFilesChange={setFiles} maxSizeMB={50} />
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
            <Button
              type="submit"
              disabled={uploading || files.length === 0}
            >
              {uploading ? "Uploading..." : "Upload & Process"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
