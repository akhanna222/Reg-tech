"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    orgName: "",
    orgType: "",
    giin: "",
    jurisdiction: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    password: "",
    confirmPassword: "",
  });

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Mock registration - in production this calls the enrolment API
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLoading(false);
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">Reg-Tech</h1>
          <p className="mt-1 text-sm text-slate-500">
            Institution Enrolment
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Register Your Institution</CardTitle>
            <CardDescription>
              Submit your details for enrolment approval by the Tax Authority
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-700">
                  Organisation Details
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="orgName">Organisation Name</Label>
                  <Input
                    id="orgName"
                    placeholder="Acme Financial Services Ltd"
                    value={formData.orgName}
                    onChange={(e) => updateField("orgName", e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="orgType">Organisation Type</Label>
                    <select
                      id="orgType"
                      className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
                      value={formData.orgType}
                      onChange={(e) => updateField("orgType", e.target.value)}
                      required
                    >
                      <option value="">Select type</option>
                      <option value="bank">Bank</option>
                      <option value="custodial">Custodial Institution</option>
                      <option value="depository">Depository Institution</option>
                      <option value="investment">Investment Entity</option>
                      <option value="insurance">Insurance Company</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="jurisdiction">Jurisdiction</Label>
                    <Input
                      id="jurisdiction"
                      placeholder="e.g. US, GB, SG"
                      value={formData.jurisdiction}
                      onChange={(e) =>
                        updateField("jurisdiction", e.target.value)
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="giin">GIIN (Global Intermediary Identification Number)</Label>
                  <Input
                    id="giin"
                    placeholder="XXXXXX.XXXXX.XX.XXX"
                    value={formData.giin}
                    onChange={(e) => updateField("giin", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-700">
                  Primary Contact
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="contactName">Full Name</Label>
                  <Input
                    id="contactName"
                    placeholder="Jane Smith"
                    value={formData.contactName}
                    onChange={(e) => updateField("contactName", e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="jane@institution.com"
                      value={formData.contactEmail}
                      onChange={(e) =>
                        updateField("contactEmail", e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Phone</Label>
                    <Input
                      id="contactPhone"
                      type="tel"
                      placeholder="+1 555 000 0000"
                      value={formData.contactPhone}
                      onChange={(e) =>
                        updateField("contactPhone", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-700">
                  Account Security
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min 12 characters"
                    value={formData.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    required
                    minLength={12}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Repeat your password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      updateField("confirmPassword", e.target.value)
                    }
                    required
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Submitting..." : "Submit Enrolment Request"}
              </Button>
              <p className="text-center text-sm text-slate-500">
                Already registered?{" "}
                <Link
                  href="/login"
                  className="font-medium text-primary-600 hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
