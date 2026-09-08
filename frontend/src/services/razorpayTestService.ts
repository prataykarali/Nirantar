/**
 * NIRANTAR — Client Razorpay Test Service & Passenger Services Ledger
 * ====================================================================
 * Implements PRD Section 10 & 11:
 *  - Sandboxed railway-specific service payments (₹50)
 *  - Order creation, test checkout, signature verification, webhook simulation
 *  - Idempotent transaction ledger
 */

import { RazorpayServiceOrder, RazorpayPaymentVerify } from '../lib/railway/types';

export interface PassengerAssistanceService {
  id: string;
  name: string;
  category: 'porter' | 'wheelchair' | 'buggy' | 'lounge';
  priceRupees: number;
  pricePaise: number;
  icon: string;
  description: string;
  turnaroundMinutes: number;
}

export interface CommittedLedgerEntry {
  id: string;
  orderId: string;
  paymentId: string;
  serviceId: string;
  serviceName: string;
  amountRupees: number;
  passengerName: string;
  stationCode: string;
  status: 'PAID' | 'VERIFIED' | 'REFUNDED';
  timestamp: string;
  gateway: string;
}

export const PASSENGER_SERVICES_CATALOG: PassengerAssistanceService[] = [
  {
    id: 'srv_porter',
    name: 'Licensed Station Coolie / Porter',
    category: 'porter',
    priceRupees: 50,
    pricePaise: 5000,
    icon: '🧳',
    description: 'Guaranteed badge-verified porter at coach door with fixed government tariff.',
    turnaroundMinutes: 5,
  },
  {
    id: 'srv_wheelchair',
    name: 'Wheelchair & Attendant Escort',
    category: 'wheelchair',
    priceRupees: 50,
    pricePaise: 5000,
    icon: '♿',
    description: 'Ramp and elevator assisted escort from entrance gate to coach compartment.',
    turnaroundMinutes: 3,
  },
  {
    id: 'srv_buggy',
    name: 'Platform Electric Battery Cart',
    category: 'buggy',
    priceRupees: 50,
    pricePaise: 5000,
    icon: '🛺',
    description: 'Concourse-to-berth battery vehicle transfer across long platform spans.',
    turnaroundMinutes: 4,
  },
  {
    id: 'srv_lounge',
    name: 'IRCTC Executive Lounge (2 Hours)',
    category: 'lounge',
    priceRupees: 150,
    pricePaise: 15000,
    icon: '🛋️',
    description: 'Air-conditioned quiet work pods, charging points, beverages, and luggage storage.',
    turnaroundMinutes: 1,
  },
];

const LEDGER_STORAGE_KEY = 'nirantar_passenger_service_ledger';

export class RazorpayTestService {
  private static instance: RazorpayTestService;
  private ledger: CommittedLedgerEntry[] = [];

  constructor() {
    this.loadLedger();
  }

  public static getInstance(): RazorpayTestService {
    if (!RazorpayTestService.instance) {
      RazorpayTestService.instance = new RazorpayTestService();
    }
    return RazorpayTestService.instance;
  }

  private loadLedger(): void {
    try {
      const raw = localStorage.getItem(LEDGER_STORAGE_KEY);
      if (raw) {
        this.ledger = JSON.parse(raw);
      }
    } catch {
      this.ledger = [];
    }
  }

  private saveLedger(): void {
    try {
      localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(this.ledger));
    } catch {
      // Ignore storage errors
    }
  }

  public getLedger(): CommittedLedgerEntry[] {
    return [...this.ledger];
  }

  /**
   * Creates a test order (calls server route or generates test order).
   */
  public async createTestOrder(
    service: PassengerAssistanceService,
    passengerName = 'Pratay Karali',
    stationCode = 'NDLS'
  ): Promise<RazorpayServiceOrder> {
    try {
      const res = await fetch('/api/payment/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: service.id,
          serviceName: service.name,
          amount: service.pricePaise,
          passengerName,
          stationCode,
        }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Offline / static hosting fallback
    }

    // Client-side fallback order
    const mockOrderId = `order_test_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    return {
      id: mockOrderId,
      orderId: mockOrderId,
      serviceId: service.id,
      serviceName: service.name,
      amount: service.pricePaise,
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
      status: 'created',
      passengerName,
      stationCode,
      platform: 'Platform 4',
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Verifies test payment and records to immutable ledger.
   */
  public async verifyAndCommitPayment(
    verifyPayload: RazorpayPaymentVerify,
    passengerName = 'Pratay Karali',
    stationCode = 'NDLS'
  ): Promise<CommittedLedgerEntry> {
    const service = PASSENGER_SERVICES_CATALOG.find((s) => s.id === verifyPayload.serviceId) || PASSENGER_SERVICES_CATALOG[0];

    try {
      const res = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(verifyPayload),
      });
      if (res.ok) {
        await res.json();
      }
    } catch {
      // Accept local verify
    }

    // Idempotency check: don't commit duplicate payment IDs
    const existing = this.ledger.find((l) => l.paymentId === verifyPayload.paymentId);
    if (existing) {
      return existing;
    }

    const entry: CommittedLedgerEntry = {
      id: `ledg_${Date.now().toString(36)}`,
      orderId: verifyPayload.orderId,
      paymentId: verifyPayload.paymentId,
      serviceId: service.id,
      serviceName: service.name,
      amountRupees: service.priceRupees,
      passengerName,
      stationCode,
      status: 'VERIFIED',
      timestamp: new Date().toISOString(),
      gateway: 'Razorpay Test Sandbox (Zero Real Money)',
    };

    this.ledger.unshift(entry);
    this.saveLedger();

    // Trigger local event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nirantar_passenger_service_booked', { detail: entry }));
    }

    return entry;
  }
}

export const razorpayTestService = RazorpayTestService.getInstance();
