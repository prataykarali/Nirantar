import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const root = dirname(fileURLToPath(import.meta.url));

const NVIDIA_KEY = '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';

function nvidiaDevMiddleware() {
  return {
    name: 'nvidia-dev-middleware',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (req.url === '/api/v1/nira/chat/stream' && req.method === 'POST') {
          let bodyStr = '';
          req.on('data', (chunk: any) => (bodyStr += chunk));
          req.on('end', async () => {
            try {
              const body = JSON.parse(bodyStr || '{}');
              const query = body.query || '';
              const context = body.context || '';
              const history = body.history || [];

              res.setHeader('Content-Type', 'text/event-stream');
              res.setHeader('Cache-Control', 'no-cache');
              res.setHeader('Connection', 'keep-alive');

              const systemPrompt = `You are Nira, an intelligent railway copilot for Indian train travel on NIRANTAR.
STYLE:
- NEVER introduce yourself with "Hello! I'm Nira" or "I am Nira".
- Speak like a friendly, knowledgeable human expert: natural, clear, concise (2 to 4 sentences).
- Simplify railway terms: "3-tier AC", "2-tier AC", "Sleeper", "Executive Chair Car".

STATUTORY RAILWAY KNOWLEDGE (Scrapling Verified):
- Tatkal: Opens at 10:00 AM for AC classes (1A, 2A, 3A, CC) and 11:00 AM for Non-AC classes (SL, 2S) one day prior to departure from origin station. Max 4 passengers per PNR. No refund on confirmed Tatkal cancellation.
- Charting: Chart 1 is finalized 4 hours before train departure; Chart 2 is finalized 30 minutes before departure for current booking.
- Cancellation Slabs: >48 hrs before departure = flat clerkage (₹240 for 1A/EC, ₹200 for 2A, ₹125 for 3A/CC, ₹60 for SL). 12 to 48 hrs = 25% fare deduction. 4 to 12 hrs = 50% fare deduction. After chart = 0% refund.
- Senior Citizens: Priority lower berth allocation for men aged 60+ and women aged 45+ traveling alone.
- Luggage Limit: 70kg for 1A, 50kg for 2A, 40kg for 3A/CC, and 40kg for Sleeper.
- Food & Catering: Optional catering booking available on Rajdhani, Shatabdi, Duronto, and Vande Bharat.
- Boarding Station Change: Permitted up to 24 hours prior to scheduled train departure via IRCTC without fee.

SCOPE & OUT-OF-SCOPE:
- You specialize strictly in Indian Railways.
- For out-of-scope queries (like other countries, Hawaii, flights, hotels, ice cream, coding, trivia):
  Acknowledge the user's intent politely, state clearly that you are specialized in Indian train travel, and invite an Indian railway query.
${context ? `\nGROUNDING TIMETABLE DATA:\n${context}` : ''}`;

              const messages = [
                { role: 'system', content: systemPrompt },
                ...history.slice(-4).map((h: any) => ({
                  role: h.role === 'nira' || h.role === 'assistant' ? 'assistant' : 'user',
                  content: h.content,
                })),
                { role: 'user', content: query },
              ];

              const nvidiaRes = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${NVIDIA_KEY}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  model: 'meta/llama-3.1-70b-instruct',
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
                    res.write(`data: ${JSON.stringify({ token: words[i] + space })}\n\n`);
                  }
                  res.write('data: [DONE]\n\n');
                  res.end();
                  return;
                }
              }
              res.write(`data: ${JSON.stringify({ token: "I can find Indian trains, compare them in plain language, track live running status, or guide your booking. Where in India do you want to travel?" })}\n\n`);
              res.write('data: [DONE]\n\n');
              res.end();
            } catch (err) {
              res.write(`data: ${JSON.stringify({ token: "I can find Indian trains, compare them in plain language, track live running status, or guide your booking. Where in India do you want to travel?" })}\n\n`);
              res.write('data: [DONE]\n\n');
              res.end();
            }
          });
        } else {
          next();
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), nvidiaDevMiddleware()],
  resolve: {
    alias: {
      '@': resolve(root, 'src'),
      '@app': resolve(root, 'src'),
      '@modules': resolve(root, '../modules'),
      'react': resolve(root, 'node_modules/react'),
      'react-dom': resolve(root, 'node_modules/react-dom'),
      'lucide-react': resolve(root, 'node_modules/lucide-react'),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    target: 'es2020',
    cssCodeSplit: true,
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
  },
});
