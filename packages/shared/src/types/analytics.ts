export interface DashboardMetrics {
  totalFilings: number;
  validatedCount: number;
  rejectedCount: number;
  transmittedCount: number;
  pendingCount: number;
  errorRate: number;
  avgValidationTime: number;
}

export interface AnomalyAlert {
  id: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  filingId: string | null;
  jurisdiction: string;
  detectedAt: string;
}

export interface CountryComparison {
  jurisdiction: string;
  totalFilings: number;
  validatedCount: number;
  rejectedCount: number;
  transmittedCount: number;
  avgValidationTime: number;
  errorRate: number;
  reportingPeriod: string;
}
