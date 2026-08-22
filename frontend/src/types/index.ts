export interface TelemetrySnapshot {
  service_name?: string;
  timestamp: string;
  requests_per_sec: number;
  concurrent_users: number;
  cpu_percent: number;
  ram_percent: number;
  latency_p50_ms: number;
  latency_p99_ms: number;
  error_rate: number;
  queue_length: number;
  throughput_rps: number;
  network_mbps?: number;
}

export interface CapacityAssessment {
  predicted_safe_capacity_users: number;
  current_users: number;
  capacity_headroom_percent: number;
  is_capacity_exceeded: boolean;
  bottleneck_resource: string;
}

export interface DemandForecast {
  current_users: number;
  forecast_horizons: {
    plus_5_min_users: number;
    plus_10_min_users: number;
    plus_15_min_users: number;
    plus_30_min_users: number;
  };
  forecast_rps: {
    plus_5_min_rps: number;
    plus_10_min_rps: number;
    plus_30_min_rps: number;
  };
  will_overload_in_30m: boolean;
  time_to_overload_minutes: number | null;
  recommended_proactive_action: string;
}

export interface ShapFactor {
  feature_name: string;
  shap_value: number;
  percentage_contribution: number;
  direction: string;
}

export interface BenchmarkModel {
  model_name: string;
  family: string;
  test_mae: number;
  test_rmse: number;
  test_r2: number;
  training_time_ms: number;
  inference_latency_ms: number;
  critical_region_mae: number;
  status: string;
  critical_verdict: string;
}

export interface TrainOption {
  train_no: string;
  train_name: string;
  source: string;
  destination: string;
  departure_time: string;
  arrival_time: string;
  duration?: string;
  duration_hours?: string;
  distance_km?: number | string;
  class_type: string;
  quota: string;
  available_seats?: number | string;
  fare_inr?: number | string;
  is_available: boolean;
  status?: string;
}

export interface LiveSystemState {
  concurrent_users: number;
  requests_per_sec: number;
  cpu_percent: number;
  latency_ms: number;
  error_rate_pct: number;
}

export interface ForecastState {
  current_users: number;
  plus_5_min_users: number;
  plus_10_min_users: number;
  safe_capacity_users: number;
  overload_predicted: boolean;
  overload_in_seconds: number | null;
}

export interface SecurityState {
  legitimate: number;
  suspicious: number;
  blocked: number;
  throttled: number;
}

export interface GraphNodeState {
  id: string;
  label: string;
  health: number;
  status: string;
}

export interface RecommendedAction {
  id: string;
  label: string;
  active: boolean;
}

export interface TimelineEvent {
  at: string;
  label: string;
  kind: string;
}

export interface CommandCenterSnapshot {
  live: LiveSystemState;
  forecast: ForecastState;
  security: SecurityState;
  nodes: GraphNodeState[];
  bottleneck: string;
  bottleneck_detail: string;
  actions: RecommendedAction[];
  timeline: TimelineEvent[];
  dhara_state: string;
  scenario: string;
  prayog_users: number;
}
