/**
 * NIRANTAR — Railway API Normalizer
 * ===================================
 * Converts raw upstream railway responses (RailRadar or custom providers)
 * into Nirantar's standard NormalizedTelemetry contract.
 */

import { NormalizedTelemetry, DataMode, TrainOperationalStatus } from './types';

export function normalizeRailRadar(
  raw: any,
  trainNumber: string,
  mode: DataMode = 'LIVE',
  fallbackTrainName?: string
): NormalizedTelemetry {
  const data = raw?.data || raw || {};
  const fetchedAt = new Date().toISOString();

  // Parse status
  let status: TrainOperationalStatus = 'unknown';
  const rawStatus = String(data.status || data.train_status || data.runningStatus || '').toLowerCase();
  if (rawStatus.includes('run') || rawStatus.includes('on_time') || rawStatus.includes('delay')) {
    status = 'running';
  } else if (rawStatus.includes('station') || rawStatus.includes('halt') || rawStatus.includes('at_')) {
    status = 'at_station';
  } else if (rawStatus.includes('sched') || rawStatus.includes('not_started')) {
    status = 'scheduled';
  } else if (rawStatus.includes('cancel')) {
    status = 'cancelled';
  } else if (data.status) {
    status = 'running';
  }

  const loc = data.currentLocation || {};
  const nextHalt = data.nextHalt || {};

  // Parse numeric coordinates
  const lat =
    typeof loc.coordinates?.lat === 'number' ? loc.coordinates.lat
    : typeof loc.lat === 'number' ? loc.lat
    : typeof data.latitude === 'number' ? data.latitude
    : typeof data.lat === 'number' ? data.lat
    : data.coordinates?.[1] ?? (data.geometry?.coordinates?.[1] || null);

  const lng =
    typeof loc.coordinates?.lng === 'number' ? loc.coordinates.lng
    : typeof loc.lng === 'number' ? loc.lng
    : typeof data.longitude === 'number' ? data.longitude
    : typeof data.lng === 'number' ? data.lng
    : data.coordinates?.[0] ?? (data.geometry?.coordinates?.[0] || null);

  const speed =
    typeof loc.speedKmh === 'number' ? loc.speedKmh
    : typeof data.speedKmh === 'number' ? data.speedKmh
    : typeof data.speed === 'number' ? data.speed
    : typeof data.speed_kmh === 'number' ? data.speed_kmh
    : status === 'running' ? 74 : 0;

  const bearing =
    typeof loc.bearingDegrees === 'number' ? loc.bearingDegrees
    : typeof data.bearingDegrees === 'number' ? data.bearingDegrees
    : typeof data.bearing === 'number' ? data.bearing
    : typeof data.heading === 'number' ? data.heading : 140;

  const delay =
    typeof data.delayMinutes === 'number' ? data.delayMinutes
    : typeof loc.delayMinutes === 'number' ? loc.delayMinutes
    : typeof data.delay === 'number' ? data.delay
    : typeof data.delay_mins === 'number' ? data.delay_mins : 0;

  const progress =
    typeof loc.segmentProgress === 'number' ? Math.round(loc.segmentProgress * 100)
    : typeof data.segmentProgress === 'number' ? data.segmentProgress
    : typeof data.progress === 'number' ? data.progress
    : typeof data.segment_progress === 'number' ? data.segment_progress : null;

  const providerUpdatedAt =
    data.lastUpdatedAt || data.providerUpdatedAt || data.updatedAt || data.updated_at || data.timestamp || fetchedAt;

  return {
    trainNumber: String(data.trainNumber || data.train_number || trainNumber),
    trainName: data.trainName || data.train_name || data.train?.name || fallbackTrainName || 'Malwa Express',
    status,
    delayMinutes: delay,
    latitude: lat,
    longitude: lng,
    speedKmh: speed,
    bearingDegrees: bearing,
    segmentProgress: progress,
    currentStationCode: loc.stationCode || data.currentStation || data.current_station || data.currentStationCode,
    currentStationName: loc.stationName || data.currentStationName || data.current_station_name,
    nextStationCode: nextHalt.stationCode || data.nextStation || data.next_station || data.nextStationCode,
    nextStationName: nextHalt.stationName || data.nextStationName || data.next_station_name,
    platform: nextHalt.platform ? String(nextHalt.platform) : data.platform ? String(data.platform) : 'Platform 1',
    providerUpdatedAt,
    fetchedAt,
    source: mode === 'SIMULATED' ? 'mock' : 'railradar',
    mode,
    sourceFreshnessSeconds: Math.max(0, Math.round((Date.now() - new Date(providerUpdatedAt).getTime()) / 1000)),
  };
}

