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
import { setToken } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!showTwoFactor) {
        // Step 1: Validate credentials, then show 2FA
        // In production this would call the auth API
        setShowTwoFactor(true);
        setLoading(false);
        return;
      }

      // Step 2: Verify 2FA and get token
      // Mock: set a placeholder token and redirect
      setToken("fi-portal-mock-jwt-token");
      router.push("/overview");
    } catch {
      setError("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">Reg-Tech</h1>
          <p className="mt-1 text-sm text-slate-500">
            Financial Institution Portal
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access the portal
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@institution.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {showTwoFactor && (
                <div className="space-y-2">
                  <Label htmlFor="twoFactor">Two-Factor Code</Label>
                  <Input
                    id="twoFactor"
                    type="text"
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    value={twoFactorCode}
                    onChange={(e) =>
                      setTwoFactorCode(e.target.value.replace(/\D/g, ""))
                    }
                    required
                  />
                  <p className="text-xs text-slate-500">
                    Enter the code from your authenticator app
                  </p>
                </div>
              )}

              {/* CAPTCHA placeholder */}
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-400">
                CAPTCHA verification will appear here
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? "Signing in..."
                  : showTwoFactor
                    ? "Verify & Sign In"
                    : "Continue"}
              </Button>
              <p className="text-center text-sm text-slate-500">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="font-medium text-primary-600 hover:underline"
                >
                  Register your institution
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
