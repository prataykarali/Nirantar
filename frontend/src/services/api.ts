import { TelemetrySnapshot, CapacityAssessment, DemandForecast, ShapFactor, BenchmarkModel, TrainOption, CommandCenterSnapshot } from '../types';

const API_BASE = (import.meta as any).env?.VITE_API_URL || '/api/v1';

export async function fetchTelemetrySnapshot(): Promise<TelemetrySnapshot> {
  const res = await fetch(`${API_BASE}/telemetry/snapshot`);
  if (!res.ok) throw new Error('Failed to fetch telemetry');
  const data = await res.json();
  if (Array.isArray(data.data)) {
    return data.data[0];
  }
  return data.data || data;
}

export async function fetchSafeCapacity(telemetry: TelemetrySnapshot): Promise<CapacityAssessment> {
  const payload = {
    service_name: telemetry.service_name || 'BookingEngine',
    timestamp: telemetry.timestamp || new Date().toISOString(),
    requests_per_sec: telemetry.requests_per_sec ?? 820,
    concurrent_users: telemetry.concurrent_users ?? 9000,
    cpu_percent: telemetry.cpu_percent ?? 72.0,
    ram_percent: telemetry.ram_percent ?? 68.0,
    network_mbps: telemetry.network_mbps ?? 1.2,
    latency_p50_ms: telemetry.latency_p50_ms ?? 120.0,
    latency_p99_ms: telemetry.latency_p99_ms ?? 1800.0,
    error_rate: telemetry.error_rate ?? 0.002,
    queue_length: telemetry.queue_length ?? 45,
    throughput_rps: telemetry.throughput_rps ?? 810.0,
  };

  const res = await fetch(`${API_BASE}/predictions/capacity`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to calculate capacity');
  const data = await res.json();
  return data.capacity_assessment;
}

export async function fetchDemandForecast(telemetry: TelemetrySnapshot, isTatkal: boolean = false): Promise<DemandForecast> {
  const payload = {
    service_name: telemetry.service_name || 'BookingEngine',
    timestamp: telemetry.timestamp || new Date().toISOString(),
    requests_per_sec: telemetry.requests_per_sec ?? 820,
    concurrent_users: telemetry.concurrent_users ?? 9000,
    cpu_percent: telemetry.cpu_percent ?? 72.0,
    ram_percent: telemetry.ram_percent ?? 68.0,
    network_mbps: telemetry.network_mbps ?? 1.2,
    latency_p50_ms: telemetry.latency_p50_ms ?? 120.0,
    latency_p99_ms: telemetry.latency_p99_ms ?? 1800.0,
    error_rate: telemetry.error_rate ?? 0.002,
    queue_length: telemetry.queue_length ?? 45,
    throughput_rps: telemetry.throughput_rps ?? 810.0,
  };

  const res = await fetch(`${API_BASE}/predictions/demand?is_tatkal=${isTatkal}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to forecast demand');
  const data = await res.json();
  return data.demand_forecast;
}

export async function fetchExplainability(telemetry: TelemetrySnapshot): Promise<{ factors: ShapFactor[]; bar_chart: string }> {
  const payload = {
    service_name: telemetry.service_name || 'BookingEngine',
    timestamp: telemetry.timestamp || new Date().toISOString(),
    requests_per_sec: telemetry.requests_per_sec ?? 820,
    concurrent_users: telemetry.concurrent_users ?? 9000,
    cpu_percent: telemetry.cpu_percent ?? 72.0,
    ram_percent: telemetry.ram_percent ?? 68.0,
    network_mbps: telemetry.network_mbps ?? 1.2,
    latency_p50_ms: telemetry.latency_p50_ms ?? 120.0,
    latency_p99_ms: telemetry.latency_p99_ms ?? 1800.0,
    error_rate: telemetry.error_rate ?? 0.002,
    queue_length: telemetry.queue_length ?? 45,
    throughput_rps: telemetry.throughput_rps ?? 810.0,
  };

  const res = await fetch(`${API_BASE}/predictions/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to fetch explainability');
  const data = await res.json();
  return {
    factors: data.explainability?.top_factors || [],
    bar_chart: data.explainability?.bar_chart_visualization || '',
  };
}

export async function fetchModelBenchmarks(): Promise<BenchmarkModel[]> {
  const res = await fetch(`${API_BASE}/predictions/benchmark`);
  if (!res.ok) throw new Error('Failed to fetch benchmarks');
  const data = await res.json();
  return data.benchmark_summary || [];
}

export async function fetchCriticalRegionCurve(): Promise<any> {
  const res = await fetch(`${API_BASE}/predictions/critical-region`);
  if (!res.ok) throw new Error('Failed to fetch critical region curve');
  const data = await res.json();
  return data.critical_region_validation;
}

export async function parseCitizenIntent(query: string, language: string = 'hi'): Promise<any> {
  const res = await fetch(`${API_BASE}/citizen/intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, language }),
  });
  if (!res.ok) throw new Error('Failed to extract intent');
  return res.json();
}

export async function advanceCitizenJourney(
  intent: any,
  session: any,
  stage: string = 'INTENT',
  selection: Record<string, unknown> = {},
): Promise<any> {
  const res = await fetch(`${API_BASE}/citizen/journey/step`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ intent, session, current_stage: stage, selection }),
  });
  if (!res.ok) throw new Error('Failed to advance journey');
  return res.json();
}

/** Submit one citizen turn atomically so extracted route fields cannot be lost between requests. */
export async function sendCitizenQuery(
  query: string,
  language: string,
  session?: any,
  stage: string = 'INTENT',
  selection: Record<string, unknown> = {},
): Promise<any> {
  const res = await fetch(`${API_BASE}/citizen/journey/step`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, language, session, current_stage: stage, selection }),
  });
  if (!res.ok) throw new Error(`Journey request failed (${res.status})`);
  return res.json();
}

export async function simulateScenario(scenario: string): Promise<any> {
  const res = await fetch(`${API_BASE}/simulation/scenario`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario }),
  });
  if (!res.ok) throw new Error('Failed to inject scenario');
  return res.json();
}

export async function fetchCommandSnapshot(): Promise<CommandCenterSnapshot> {
  const res = await fetch(`${API_BASE}/command-center/snapshot`);
  if (!res.ok) throw new Error('Failed to fetch command-center snapshot');
  const data = await res.json();
  return data.snapshot;
}

export async function runCommandScenario(
  scenario: string,
  population: number = 120,
): Promise<CommandCenterSnapshot> {
  const res = await fetch(`${API_BASE}/command-center/scenario`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario, population }),
  });
  if (!res.ok) throw new Error('Failed to run operator scenario');
  const data = await res.json();
  return data.snapshot;
}
