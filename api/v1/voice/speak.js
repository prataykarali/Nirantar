// Vercel Serverless Function for Murf AI Text-to-Speech
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, voice_id, language } = req.body || {};
  if (!text || !String(text).trim()) {
    return res.status(400).json({ error: 'Text cannot be empty' });
  }

  const MURF_API_KEY = process.env.MURF_API_KEY ? process.env.MURF_API_KEY.trim() : '';

  if (MURF_API_KEY) {
    try {
      const cleanText = String(text)
        .replace(/[*_#~`]/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/[\u{1F600}-\u{1F6FF}|\u{2600}-\u{26FF}|\u{2700}-\u{27BF}]/gu, '')
        .replace(/\s+/g, ' ')
        .trim();

      const murfResponse = await fetch('https://api.murf.ai/v1/speech/generate', {
        method: 'POST',
        headers: {
          'api-key': MURF_API_KEY,
          'token': MURF_API_KEY,
          'Authorization': `Bearer ${MURF_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: cleanText.slice(0, 500),
          voiceId: voice_id || 'en-IN-aarav',
          style: 'Conversational',
          format: 'MP3',
          sampleRate: 24000,
        }),
      });

      if (murfResponse.ok) {
        const data = await murfResponse.json();
        const audioUrl = data.audioFile || data.audio_url || (data.encodedAudio ? `data:audio/mp3;base64,${data.encodedAudio}` : null);
        if (audioUrl) {
          return res.status(200).json({
            status: 200,
            audio_url: audioUrl,
            source: 'murf_api',
            text: cleanText,
          });
        }
      }
    } catch (err) {
      console.error('Murf AI generation error on Vercel:', err);
    }
  }

  return res.status(200).json({
    status: 200,
    audio_url: null,
    source: 'web_speech_fallback',
    text,
  });
}
