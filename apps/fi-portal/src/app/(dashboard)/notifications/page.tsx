"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from "@reg-tech/ui";
import { Bell, Check, CheckCheck, FileText, AlertTriangle, Info } from "lucide-react";

interface Notification {
  id: string;
  type: "info" | "warning" | "success" | "error";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  filingId?: string;
}

const mockNotifications: Notification[] = [
  {
    id: "n1",
    type: "success",
    title: "Filing Validated",
    message: "Your CRS filing FIL-2026-002 has passed all validation checks.",
    timestamp: "2026-04-01 14:35",
    read: false,
    filingId: "FIL-2026-002",
  },
  {
    id: "n2",
    type: "error",
    title: "Filing Rejected",
    message: "Filing FIL-2026-003 was rejected: 3 TIN validation errors found.",
    timestamp: "2026-03-25 10:12",
    read: false,
    filingId: "FIL-2026-003",
  },
  {
    id: "n3",
    type: "info",
    title: "Submission Received",
    message: "Your filing FIL-2026-001 has been received and is being processed.",
    timestamp: "2026-04-01 14:32",
    read: true,
    filingId: "FIL-2026-001",
  },
  {
    id: "n4",
    type: "warning",
    title: "Deadline Approaching",
    message: "CRS reporting deadline for 2025 period is in 30 days (May 5, 2026).",
    timestamp: "2026-03-20 08:00",
    read: true,
  },
  {
    id: "n5",
    type: "info",
    title: "System Maintenance",
    message: "Scheduled maintenance on April 10, 2026 from 02:00-04:00 UTC.",
    timestamp: "2026-03-18 12:00",
    read: true,
  },
];

const iconMap = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCheck,
  error: AlertTriangle,
};

const colorMap = {
  info: "text-blue-500 bg-blue-50",
  warning: "text-amber-500 bg-amber-50",
  success: "text-emerald-500 bg-emerald-50",
  error: "text-red-500 bg-red-50",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(mockNotifications);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-500">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
              : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <Check className="mr-2 h-3 w-3" />
            Mark all read
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="divide-y divide-slate-100 p-0">
          {notifications.map((notification) => {
            const Icon = iconMap[notification.type];
            const colors = colorMap[notification.type];
            return (
              <div
                key={notification.id}
                className={`flex gap-4 p-4 ${!notification.read ? "bg-blue-50/30" : ""}`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${colors}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900">
                      {notification.title}
                    </p>
                    {!notification.read && (
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                  <p className="text-sm text-slate-600">{notification.message}</p>
                  <p className="text-xs text-slate-400">{notification.timestamp}</p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
