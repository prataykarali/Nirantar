/**
 * NIRANTAR — UI Event Bus
 * =======================
 * Lightweight, zero-dependency event bus to close the feedback loop:
 * UI Event -> State Transition -> Action -> UI Event -> Nira Context Updated.
 */

import { NirantarEventType, NirantarUiEvent } from './eventTypes';

type EventListener<T = any> = (event: NirantarUiEvent<T>) => void;

class UiEventBusClass {
  private listeners: Map<NirantarEventType | '*', Set<EventListener>> = new Map();
  private eventHistory: NirantarUiEvent[] = [];
  private readonly MAX_HISTORY = 50;

  public subscribe<T = any>(type: NirantarEventType | '*', listener: EventListener<T>): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener as EventListener);

    return () => {
      this.listeners.get(type)?.delete(listener as EventListener);
    };
  }

  public emit<T = any>(type: NirantarEventType, sourcePage: string, payload: T = {} as T): NirantarUiEvent<T> {
    const event: NirantarUiEvent<T> = {
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      eventType: type,
      timestamp: new Date().toISOString(),
      sourcePage,
      payload,
    };

    this.eventHistory.unshift(event);
    if (this.eventHistory.length > this.MAX_HISTORY) {
      this.eventHistory.pop();
    }

    // Specific listeners
    const specific = this.listeners.get(type);
    if (specific) {
      specific.forEach((fn) => {
        try {
          fn(event);
        } catch (e) {
          console.error(`[UiEventBus] Error in listener for ${type}:`, e);
        }
      });
    }

    // Wildcard listeners
    const wildcard = this.listeners.get('*');
    if (wildcard) {
      wildcard.forEach((fn) => {
        try {
          fn(event);
        } catch (e) {
          console.error(`[UiEventBus] Error in wildcard listener for ${type}:`, e);
        }
      });
    }

    return event;
  }

  public getHistory(): readonly NirantarUiEvent[] {
    return this.eventHistory;
  }

  public getLatestEvent(): NirantarUiEvent | null {
    return this.eventHistory[0] || null;
  }
}

export const UiEventBus = new UiEventBusClass();
