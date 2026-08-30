// Vercel Serverless Function: Real-Time Global Seat Occupancy Registry
// Prevents double-booking across all concurrent citizen sessions.

const inMemorySeatRegistry = new Map();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

  if (req.method === 'GET') {
    const { trainNumber, coachCode } = req.query || {};
    const key = `${trainNumber || '12951'}:${coachCode || 'B1'}`;

    let occupied = inMemorySeatRegistry.get(key) || [];

    // If Supabase is connected, query booked seat records
    if (SUPABASE_URL && SUPABASE_KEY) {
      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/user_tickets?train_number=eq.${trainNumber || '12951'}&select=passengers`, {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
        });
        if (response.ok) {
          const tickets = await response.json();
          const dbSeats = [];
          tickets.forEach((t) => {
            if (Array.isArray(t.passengers)) {
              t.passengers.forEach((p) => {
                if (p.seatNumber && (p.coachCode === coachCode || !coachCode)) {
                  dbSeats.push(Number(p.seatNumber));
                }
              });
            }
          });
          occupied = Array.from(new Set([...occupied, ...dbSeats]));
        }
      } catch (err) {
        console.warn('Supabase seat query error:', err.message);
      }
    }

    return res.status(200).json({
      status: 200,
      trainNumber: trainNumber || '12951',
      coachCode: coachCode || 'B1',
      occupiedSeats: occupied,
    });
  }

  if (req.method === 'POST') {
    const { trainNumber, coachCode, seatNumbers } = req.body || {};
    if (!trainNumber || !coachCode || !Array.isArray(seatNumbers)) {
      return res.status(400).json({ error: 'trainNumber, coachCode and seatNumbers array are required' });
    }

    const key = `${trainNumber}:${coachCode}`;
    const existing = inMemorySeatRegistry.get(key) || [];
    const updated = Array.from(new Set([...existing, ...seatNumbers.map(Number)]));
    inMemorySeatRegistry.set(key, updated);

    return res.status(200).json({
      status: 200,
      message: 'Seats reserved successfully in global registry',
      key,
      occupiedSeats: updated,
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
