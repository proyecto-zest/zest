export interface KpiDefinition {
  id: string;
  kind: 'business' | 'technical' | 'health';
  unit: string;
}

// The 10 KPIs the platform expects for Zest, in the order of the team guide.
export const KPI_CATALOG: readonly KpiDefinition[] = [
  { id: 'platform_managed_users', kind: 'business', unit: '{usuario}' },
  { id: 'platform_managed_rate', kind: 'business', unit: '%' },
  { id: 'active_users_30d', kind: 'business', unit: '{usuario}' },
  { id: 'health_latency_p95', kind: 'technical', unit: 'ms' },
  { id: 'health_error_rate', kind: 'technical', unit: '%' },
  { id: 'db_query_latency', kind: 'technical', unit: 'ms' },
  { id: 'health_up', kind: 'health', unit: '1' },
  { id: 'db_connected', kind: 'health', unit: '1' },
  { id: 'db_storage_used', kind: 'health', unit: '%' },
  { id: 'ci_last_run_ok', kind: 'health', unit: '1' },
];

export const KPI_IDS: readonly string[] = KPI_CATALOG.map((kpi) => kpi.id);

export type KpiValues = Record<string, number>;

export interface KpiFailure {
  id: string;
  reason: string;
}
