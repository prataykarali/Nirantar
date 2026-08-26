// Vercel Serverless Function for Deepgram Speech-to-Text
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

  const { audio_base64, language } = req.body || {};
  if (!audio_base64 || !String(audio_base64).trim()) {
    return res.status(400).json({ error: 'Audio cannot be empty' });
  }

  const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY ? process.env.DEEPGRAM_API_KEY.trim() : '';

  if (DEEPGRAM_API_KEY) {
    try {
      const cleanB64 = audio_base64.includes(',') ? audio_base64.split(',')[1] : audio_base64;
      const audioBuffer = Buffer.from(cleanB64, 'base64');
      const lang = language === 'hi' ? 'hi' : language === 'ta' ? 'ta' : language === 'bn' ? 'bn' : 'en-IN';

      let contentType = 'audio/webm';
      if (audio_base64.includes('audio/wav')) contentType = 'audio/wav';
      else if (audio_base64.includes('audio/mp4')) contentType = 'audio/mp4';
      else if (audio_base64.includes('audio/ogg')) contentType = 'audio/ogg';

      const dgResponse = await fetch(`https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&language=${lang}`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${DEEPGRAM_API_KEY}`,
          'Content-Type': contentType,
        },
        body: audioBuffer,
      });

      if (dgResponse.ok) {
        const data = await dgResponse.json();
        const transcript = data?.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
        const confidence = data?.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0.95;
        return res.status(200).json({
          status: 200,
          transcript,
          confidence,
          source: 'deepgram_api',
        });
      }
    } catch (err) {
      console.error('Deepgram STT error on Vercel:', err);
    }
  }

  return res.status(200).json({
    status: 200,
    transcript: '',
    confidence: 0,
    source: 'fallback',
  });
}
