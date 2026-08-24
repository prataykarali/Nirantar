import {
  TelemetrySnapshot,
  CapacityAssessment,
  DemandForecast,
  ShapFactor,
  BenchmarkModel,
  CommandCenterSnapshot,
} from '../types';

import { apiBase } from '../lib/apiBase';

const API_BASE = apiBase();

// ============================================================================
// 1. PREDICTIONS & TELEMETRY REST ENDPOINTS (/api/v1/predictions/*, /api/v1/telemetry/*)
// ============================================================================

export async function fetchTelemetrySnapshot(): Promise<TelemetrySnapshot> {
  const res = await fetch(`${API_BASE}/telemetry/snapshot`);
  if (!res.ok) throw new Error('Failed to fetch telemetry snapshot');
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

export async function fetchDemandForecast(
  telemetry: TelemetrySnapshot,
  isTatkal: boolean = false
): Promise<DemandForecast> {
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

export async function fetchExplainability(
  telemetry: TelemetrySnapshot
): Promise<{ factors: ShapFactor[]; bar_chart: string }> {
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

// ============================================================================
// 2. CITIZEN JOURNEY REST ENDPOINTS (/api/v1/citizen/*)
// ============================================================================

export async function parseCitizenIntent(
  query: string,
  language: string = 'hi',
  voice_audio_base64?: string
): Promise<any> {
  const payload: any = { query, language };
  if (voice_audio_base64) {
    payload.voice_audio_base64 = voice_audio_base64;
  }

  const res = await fetch(`${API_BASE}/citizen/intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to extract intent');
  return res.json();
}

export async function advanceCitizenJourney(
  intent?: any,
  session?: any,
  stage: string = 'INTENT',
  selection: Record<string, unknown> = {},
  query?: string,
  language: string = 'hi'
): Promise<any> {
  const res = await fetch(`${API_BASE}/citizen/journey/step`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ intent, query, language, session, current_stage: stage, selection }),
  });
  if (!res.ok) throw new Error('Failed to advance journey');
  return res.json();
}

export async function sendCitizenQuery(
  query: string,
  language: string = 'hi',
  session?: any,
  stage: string = 'INTENT',
  selection: Record<string, unknown> = {}
): Promise<any> {
  const res = await fetch(`${API_BASE}/citizen/journey/step`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, language, session, current_stage: stage, selection }),
  });
  if (!res.ok) throw new Error(`Journey request failed (${res.status})`);
  return res.json();
}

export async function fetchSafeAutofillFields(userData?: Record<string, any>): Promise<any> {
  const res = await fetch(`${API_BASE}/citizen/autofill/safe-fields`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_data: userData || null }),
  });
  if (!res.ok) throw new Error('Failed to fetch safe autofill fields');
  return res.json();
}

export async function fetchFailureRecovery(
  errorCode: string,
  language: string = 'en',
  context: Record<string, any> = {}
): Promise<any> {
  const res = await fetch(`${API_BASE}/citizen/failure-recovery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error_code: errorCode, language, context }),
  });
  if (!res.ok) throw new Error('Failed to fetch failure recovery info');
  return res.json();
}

export async function explainTerm(
  termOrField: string,
  language: string = 'en',
  context: Record<string, any> = {}
): Promise<any> {
  const res = await fetch(`${API_BASE}/citizen/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ term_or_field: termOrField, language, context }),
  });
  if (!res.ok) throw new Error('Failed to explain civic term');
  return res.json();
}

// ============================================================================
// 3. REAL WEB SEARCH & GROUNDING CORE (/api/v1/search/*)
// ============================================================================

export async function searchRealWeb(query: string, maxResults: number = 3): Promise<any> {
  const res = await fetch(`${API_BASE}/search/web`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, max_results: maxResults }),
  });
  if (!res.ok) throw new Error('Failed to execute real web search');
  return res.json();
}

export async function searchScraplingWeb(query: string, maxResults: number = 3): Promise<any> {
  const res = await fetch(`${API_BASE}/search/scrapling`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, max_results: maxResults }),
  });
  if (!res.ok) throw new Error('Failed to scrape statutory web search');
  return res.json();
}

export async function verifyLLMGrounding(
  llmOutput: string,
  query?: string,
  additionalFacts?: any[]
): Promise<any> {
  const res = await fetch(`${API_BASE}/search/ground-verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ llm_output: llmOutput, query, additional_facts: additionalFacts }),
  });
  if (!res.ok) throw new Error('Failed to verify grounding');
  return res.json();
}

export async function getHybridGroundedContext(
  query: string,
  sourceStation?: string,
  destinationStation?: string,
  topK: number = 3,
  useScrapling: boolean = true
): Promise<any> {
  const res = await fetch(`${API_BASE}/search/hybrid-context`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      source_station: sourceStation,
      destination_station: destinationStation,
      top_k: topK,
      use_scrapling: useScrapling,
    }),
  });
  if (!res.ok) throw new Error('Failed to retrieve hybrid grounded context');
  return res.json();
}

export async function getSearchCacheStats(): Promise<any> {
  const res = await fetch(`${API_BASE}/search/cache/stats`);
  if (!res.ok) throw new Error('Failed to fetch search cache stats');
  return res.json();
}

// ============================================================================
// 4. SECURITY & KAVACH REST ENDPOINTS (/api/v1/security/*)
// ============================================================================

export async function evaluateSecuritySession(
  sessionId: string,
  endpoint: string = '/api/v1/booking/initiate',
  ipHash: string = 'ip_hash_local',
  isRetry: boolean = false
): Promise<any> {
  const res = await fetch(`${API_BASE}/security/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, endpoint, ip_hash: ipHash, is_retry: isRetry }),
  });
  if (!res.ok) throw new Error('Failed to evaluate security session');
  return res.json();
}

export async function sanitizePayload(payload: Record<string, any>): Promise<any> {
  const res = await fetch(`${API_BASE}/security/sanitize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payload }),
  });
  if (!res.ok) throw new Error('Failed to sanitize payload');
  return res.json();
}

export async function maskPIIFields(fields: {
  name?: string;
  phone?: string;
  card?: string;
  aadhaar?: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/security/mask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  });
  if (!res.ok) throw new Error('Failed to mask PII fields');
  return res.json();
}

export async function getSecurityAuditLogs(limit: number = 50, sessionId?: string): Promise<any> {
  const url = sessionId
    ? `${API_BASE}/security/audit-logs?limit=${limit}&session_id=${encodeURIComponent(sessionId)}`
    : `${API_BASE}/security/audit-logs?limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch security audit logs');
  return res.json();
}

export async function getSecurityStatus(): Promise<any> {
  const res = await fetch(`${API_BASE}/security/status`);
  if (!res.ok) throw new Error('Failed to fetch security status');
  return res.json();
}

// ============================================================================
// 5. COMMAND CENTER & SIMULATION ENDPOINTS (/api/v1/command-center/*, /api/v1/simulation/*)
// ============================================================================

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
  population: number = 120
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
