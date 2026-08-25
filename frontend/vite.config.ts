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

              const systemPrompt = `You are Nira, an intelligent railway copilot for Indian train travel.
STYLE:
- NEVER introduce yourself with "Hello! I'm Nira" or "I am Nira".
- Speak like a friendly human expert: natural, clear, concise (2 to 4 sentences).
- Simplify railway terms: "3-tier AC", "2-tier AC", "Sleeper", "Executive Chair Car".
SCOPE:
- You specialize in Indian Railways: booking, train discovery, fares, live GPS running status, PNR, tatkal rules, platform details.
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
