/**
 * NIRANTAR — Razorpay Test Mode: Order Creation Handler
 * =======================================================
 * Endpoint: POST /api/payment/order
 * Creates a sandboxed test order for railway-specific assistance services.
 */

import crypto from 'crypto';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { serviceId, serviceName, amount, passengerName, stationCode } = req.body || {};
    const orderAmount = amount || 5000; // 5000 paise = ₹50
    const receipt = `rcpt_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const mockOrderId = `order_${crypto.randomBytes(8).toString('hex')}`;

    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_nirantarDemo2026';

    const orderPayload = {
      id: mockOrderId,
      orderId: mockOrderId,
      amount: orderAmount,
      currency: 'INR',
      receipt,
      status: 'created',
      serviceId: serviceId || 'srv_porter_assistance',
      serviceName: serviceName || 'Station Porter & Luggage Assistance',
      passengerName: passengerName || 'Pratay Karali',
      stationCode: stationCode || 'NDLS',
      keyId,
      createdAt: new Date().toISOString(),
      isSandbox: true,
    };

    return res.status(200).json(orderPayload);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create order', message: err.message });
  }
}
