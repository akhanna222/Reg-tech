"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FileText,
  ShieldCheck,
  Users,
  Send,
  BarChart3,
  Inbox,
  LogOut,
  Menu,
  X,
  Shield,
} from "lucide-react";
import { useState } from "react";
import { Button, NotificationBell } from "@reg-tech/ui";
import { removeToken } from "@/lib/auth";

const navItems = [
  { href: "/submissions", label: "Submissions", icon: FileText },
  { href: "/validation", label: "Validation", icon: ShieldCheck },
  { href: "/enrolments", label: "Enrolments", icon: Users },
  { href: "/transmission", label: "Transmission", icon: Send },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/inbound", label: "Inbound Data", icon: Inbox },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    removeToken();
    router.push("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-navy-950">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-navy-900 border-r border-navy-700 transition-transform duration-200 lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-navy-700 px-6">
          <Link href="/submissions" className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary-400" />
            <span className="text-lg font-bold text-white">
              Reg-Tech <span className="text-xs font-normal text-slate-400">TA</span>
            </span>
          </Link>
          <button
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <nav className="flex flex-col gap-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary-600/20 text-primary-300"
                    : "text-slate-400 hover:bg-navy-800 hover:text-slate-200"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-navy-700 p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-navy-800 hover:text-slate-200"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-navy-700 bg-navy-900 px-6">
          <button
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5 text-slate-400" />
          </button>

          <div className="hidden lg:block" />

          <div className="flex items-center gap-3">
            <NotificationBell count={5} onClick={() => {}} />
            <div className="flex items-center gap-2 rounded-md border border-navy-600 px-3 py-1.5">
              <div className="h-7 w-7 rounded-full bg-primary-700 flex items-center justify-center text-xs font-semibold text-primary-200">
                TA
              </div>
              <span className="text-sm font-medium text-slate-300">
                Admin
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
