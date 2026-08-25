/**
 * Vercel serverless proxy for NVIDIA NIM, Murf TTS, and Deepgram STT.
 * Serves /api/v1/nira/chat/stream, /api/v1/nira/intent, /api/v1/voice/speak, /api/v1/voice/transcribe.
 */
const NVIDIA_API_KEY = (
  process.env.NVIDIA_API_KEY ||
  process.env.VITE_NVIDIA_API_KEY ||
  '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'
).trim();
const NVIDIA_MODEL = process.env.NVIDIA_MODEL || 'meta/llama-3.1-70b-instruct';
const NVIDIA_API_BASE = (process.env.NVIDIA_API_BASE || 'https://integrate.api.nvidia.com/v1').replace(/\/$/, '');
const MURF_API_KEY = (process.env.MURF_API_KEY || 'ap2_e02822c1-60a7-4cb2-95cb-f7f60445cf92').trim();
const DEEPGRAM_API_KEY = (process.env.DEEPGRAM_API_KEY || 'd4ce071a8da028082bacade9f4708be3dfa7287f').trim();

const NIRA_SYSTEM_PROMPT = `You are Nira, a knowledgeable railway copilot on NIRANTAR for Indian train travel.

STRICT STYLE:
- NEVER introduce yourself. NEVER say "Hello! I'm Nira", "I am Nira", or "I'm Nira, your...".
- Speak like a helpful person: 2 to 4 short sentences, natural, clear English.
- Use plain words: "3-tier AC" not "3A", "2-tier AC" not "2A", "Sleeper" not "SL", "last-minute ticket" not "Tatkal" unless the user said Tatkal.

STATUTORY RAILWAY KNOWLEDGE (Scrapling Verified):
- Tatkal: Opens 10:00 AM for AC classes & 11:00 AM for Non-AC classes 1 day prior to departure. Max 4 passengers per PNR. No refund on confirmed Tatkal cancellation.
- Charting: Chart 1 is finalized 4 hours before departure; Chart 2 is finalized 30 minutes before departure.
- Cancellation Slabs: >48 hrs = flat clerkage (₹240 1A/EC, ₹200 2A, ₹125 3A/CC, ₹60 SL). 12-48 hrs = 25% fare. 4-12 hrs = 50% fare. After chart = 0% refund.
- Senior Citizens: Lower berth priority for men aged 60+ and women aged 45+ traveling alone.
- Luggage Limit: 70kg (1A), 50kg (2A), 40kg (3A/CC), 40kg (Sleeper).
- Food & Catering: Optional catering booking available on Rajdhani, Shatabdi, Duronto, and Vande Bharat.
- Boarding Station Change: Permitted up to 24 hours prior to scheduled departure via IRCTC without fee.

SCOPE:
- You ONLY help with Indian Railways: find trains, compare them, book, track, PNR, classes, last-minute tickets, platforms, and rules.
- If the user asks for out-of-scope topics (another country, Hawaii, flights, hotels, ice cream, coding, trivia):
  Acknowledge what they asked, then clearly say you are specialized in Indian train journeys, and invite an Indian route.

BOOKING:
- When a GROUNDING block lists trains: start with "I found these trains", rank them (fastest, cheapest, more comfortable), ask what they prefer, then match one.
- Do not invent train numbers, fares, or times. Use only the grounding data.
- If origin or destination is missing, ask for both Indian stations in one short question.

TRACKING:
- If they give a 5-digit train number, confirm you can open live tracking for that train.`;

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '8mb',
    },
  },
  maxDuration: 30,
};

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function routeKey(req) {
  const url = (req.url || '').split('?')[0];
  const parts = Array.isArray(req.query.path)
    ? req.query.path
    : req.query.path
      ? [req.query.path]
      : url.replace(/^\/api\/?/, '').split('/').filter(Boolean);
  return parts.join('/');
}

function nvidiaHeaders() {
  return {
    Authorization: `Bearer ${NVIDIA_API_KEY}`,
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
  };
}

async function handleChatStream(req, res) {
  const body = req.body || {};
  const query = String(body.query || '').trim();
  const history = Array.isArray(body.history) ? body.history : [];
  const grounding = String(body.context || '').trim();

  if (!query) {
    res.status(400).json({ error: 'query is required' });
    return;
  }

  const messages = [{ role: 'system', content: NIRA_SYSTEM_PROMPT }];
  if (grounding) {
    messages.push({
      role: 'system',
      content: `GROUNDING (facts only, do not invent beyond this):\n${grounding}`,
    });
  }
  for (const item of history.slice(-6)) {
    const role = item.role === 'assistant' || item.role === 'nira' ? 'assistant' : 'user';
    const content = String(item.content || '').trim();
    if (content) messages.push({ role, content });
  }
  messages.push({ role: 'user', content: query });

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  setCors(res);

  const writeToken = (token) => {
    res.write(`data: ${JSON.stringify({ token })}\n\n`);
  };

  if (!NVIDIA_API_KEY) {
    writeToken(localNiraFallback(query, grounding));
    res.write('data: [DONE]\n\n');
    res.end();
    return;
  }

  try {
    const nvidiaRes = await fetch(`${NVIDIA_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${NVIDIA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: NVIDIA_MODEL,
        messages,
        max_tokens: 500,
        temperature: 0.35,
      }),
    });

    if (nvidiaRes.ok) {
      const data = await nvidiaRes.json();
      const content = data?.choices?.[0]?.message?.content || '';
      if (content) {
        const words = content.split(' ');
        for (let i = 0; i < words.length; i++) {
          const space = i < words.length - 1 ? ' ' : '';
          writeToken(words[i] + space);
        }
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      }
    }
    writeToken(localNiraFallback(query, grounding));
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('NVIDIA proxy error:', err);
    writeToken(localNiraFallback(query, grounding));
    res.write('data: [DONE]\n\n');
    res.end();
  }
}

function localNiraFallback(query, grounding) {
  const lower = query.toLowerCase();
  const foreign = /(hawaii|hawai|paris|london|dubai|new york|tokyo|flight|airplane|hotel|visa)/i.test(lower);
  if (foreign) {
    const want = query.replace(/hey[,!]?\s*/i, '').trim();
    return `I understand you want ${want}, but I can only help with Indian train travel. Tell me two Indian cities — for example Delhi to Mumbai — and I will find trains.`;
  }
  if (grounding) {
    return `I found these trains for your route. Tell me what you prefer — fastest, cheapest, or a more comfortable AC coach — and I will match one.`;
  }
  return `I can find Indian trains, compare them in plain language, or track a live train number. Where in India do you want to go?`;
}

async function handleIntent(req, res) {
  const query = String((req.body || {}).query || '').trim();
  if (!query) {
    res.status(400).json({ error: 'query is required' });
    return;
  }

  if (!NVIDIA_API_KEY) {
    res.status(200).json({
      intent: 'SEARCH_TRAINS',
      entities: {},
      confidence: 0.4,
      response: localNiraFallback(query, ''),
      source: 'safe_assist',
    });
    return;
  }

  try {
    const nvidiaRes = await fetch(`${NVIDIA_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${NVIDIA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: NVIDIA_MODEL,
        messages: [
          {
            role: 'system',
            content:
              'Extract railway intent as JSON with keys intent, from_station, to_station, date_label, train_number, passengers. intent one of SEARCH_TRAINS, TRACK_TRAIN, BOOK_TRAIN, OTHER. Reply JSON only.',
          },
          { role: 'user', content: query },
        ],
        max_tokens: 180,
        temperature: 0.1,
      }),
    });
    const data = await nvidiaRes.json();
    const raw = data?.choices?.[0]?.message?.content || '{}';
    const jsonText = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(jsonText);
    res.status(200).json({
      intent: parsed.intent || 'SEARCH_TRAINS',
      entities: parsed,
      confidence: 0.9,
      response: parsed.response || '',
      source: 'nvidia',
    });
  } catch {
    res.status(200).json({
      intent: 'SEARCH_TRAINS',
      entities: {},
      confidence: 0.4,
      response: localNiraFallback(query, ''),
      source: 'safe_assist',
    });
  }
}

async function handleSpeak(req, res) {
  const text = String((req.body || {}).text || '').trim();
  if (!text) {
    res.status(400).json({ error: 'text is required' });
    return;
  }

  if (MURF_API_KEY) {
    try {
      const murfRes = await fetch('https://api.murf.ai/v1/speech/generate', {
        method: 'POST',
        headers: {
          'api-key': MURF_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.slice(0, 500),
          voiceId: (req.body || {}).voice_id || 'en-IN-aarav',
          style: 'Conversational',
          format: 'MP3',
        }),
      });
      if (murfRes.ok) {
        const data = await murfRes.json();
        res.status(200).json({
          status: 200,
          audio_url: data.audioFile || data.audio_url || null,
          source: 'murf_api',
          text,
        });
        return;
      }
    } catch {
      /* fall through */
    }
  }

  res.status(200).json({
    status: 200,
    audio_url: null,
    source: 'web_speech_fallback',
    text,
  });
}

async function handleTranscribe(req, res) {
  const audioBase64 = String((req.body || {}).audio_base64 || '').trim();
  if (!audioBase64) {
    res.status(400).json({ error: 'audio_base64 is required' });
    return;
  }

  if (DEEPGRAM_API_KEY) {
    try {
      const clean = audioBase64.split(',').pop();
      const audioBytes = Buffer.from(clean, 'base64');
      const dgRes = await fetch(
        'https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&language=en-IN',
        {
          method: 'POST',
          headers: {
            Authorization: `Token ${DEEPGRAM_API_KEY}`,
            'Content-Type': 'audio/webm',
          },
          body: audioBytes,
        }
      );
      if (dgRes.ok) {
        const data = await dgRes.json();
        const transcript =
          data?.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
        res.status(200).json({
          status: 200,
          transcript,
          confidence: data?.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0.9,
          source: 'deepgram_api',
        });
        return;
      }
    } catch {
      /* fall through */
    }
  }

  res.status(200).json({
    status: 200,
    transcript: '',
    confidence: 0,
    source: 'fallback',
  });
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const key = routeKey(req);

  if (key.endsWith('nira/chat/stream') && req.method === 'POST') {
    await handleChatStream(req, res);
    return;
  }
  if (key.endsWith('nira/intent') && req.method === 'POST') {
    await handleIntent(req, res);
    return;
  }
  if (key.endsWith('voice/speak') && req.method === 'POST') {
    await handleSpeak(req, res);
    return;
  }
  if (key.endsWith('voice/transcribe') && req.method === 'POST') {
    await handleTranscribe(req, res);
    return;
  }
  if (key.endsWith('voice/status') || key === 'v1/status') {
    res.status(200).json({
      nvidia: Boolean(NVIDIA_API_KEY),
      murf: Boolean(MURF_API_KEY),
      deepgram: Boolean(DEEPGRAM_API_KEY),
    });
    return;
  }

  res.status(404).json({ error: 'not found', path: key });
}
