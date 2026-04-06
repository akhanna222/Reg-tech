"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@reg-tech/ui";
import { BarChart3, TrendingUp, Globe, Users } from "lucide-react";

const kpis = [
  { label: "Total Submissions", value: "1,247", change: "+12%", icon: BarChart3, color: "text-blue-400", bgColor: "bg-blue-500/10" },
  { label: "Compliance Rate", value: "94.2%", change: "+2.1%", icon: TrendingUp, color: "text-emerald-400", bgColor: "bg-emerald-500/10" },
  { label: "Active Jurisdictions", value: "38", change: "+3", icon: Globe, color: "text-purple-400", bgColor: "bg-purple-500/10" },
  { label: "Enrolled FIs", value: "562", change: "+18", icon: Users, color: "text-amber-400", bgColor: "bg-amber-500/10" },
];

const monthlyData = [
  { month: "Jan", submissions: 98, validated: 92 },
  { month: "Feb", submissions: 112, validated: 105 },
  { month: "Mar", submissions: 145, validated: 138 },
  { month: "Apr", submissions: 89, validated: 82 },
];

const jurisdictionBreakdown = [
  { jurisdiction: "United States", filings: 312, percentage: 25 },
  { jurisdiction: "United Kingdom", filings: 198, percentage: 16 },
  { jurisdiction: "Germany", filings: 156, percentage: 12 },
  { jurisdiction: "Singapore", filings: 134, percentage: 11 },
  { jurisdiction: "Australia", filings: 112, percentage: 9 },
  { jurisdiction: "Switzerland", filings: 98, percentage: 8 },
  { jurisdiction: "Others", filings: 237, percentage: 19 },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
        <p className="text-sm text-slate-400">
          Reporting and compliance analytics overview
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className="border-navy-700 bg-navy-900">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">{kpi.label}</p>
                    <p className="mt-1 text-2xl font-bold text-white">{kpi.value}</p>
                    <p className="mt-1 text-xs text-emerald-400">{kpi.change} vs last period</p>
                  </div>
                  <div className={`rounded-lg p-3 ${kpi.bgColor}`}>
                    <Icon className={`h-5 w-5 ${kpi.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Monthly Submissions Chart Area */}
        <Card className="border-navy-700 bg-navy-900">
          <CardHeader>
            <CardTitle className="text-lg text-white">
              Monthly Submissions
            </CardTitle>
            <CardDescription className="text-slate-400">
              Submissions vs validated filings by month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {monthlyData.map((d) => (
                <div key={d.month} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">{d.month} 2026</span>
                    <span className="text-slate-400">
                      {d.validated}/{d.submissions}
                    </span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-navy-800">
                    <div
                      className="relative h-3 rounded-full bg-primary-600"
                      style={{ width: `${(d.submissions / 150) * 100}%` }}
                    >
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-emerald-500"
                        style={{ width: `${(d.validated / d.submissions) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <div className="mt-4 flex gap-6 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-primary-600" /> Submitted
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Validated
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Jurisdiction Breakdown */}
        <Card className="border-navy-700 bg-navy-900">
          <CardHeader>
            <CardTitle className="text-lg text-white">
              Jurisdiction Breakdown
            </CardTitle>
            <CardDescription className="text-slate-400">
              Filing distribution by reporting jurisdiction
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {jurisdictionBreakdown.map((j) => (
                <div key={j.jurisdiction} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">{j.jurisdiction}</span>
                    <span className="text-slate-400">
                      {j.filings} ({j.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-navy-800">
                    <div
                      className="h-2 rounded-full bg-primary-500"
                      style={{ width: `${j.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
