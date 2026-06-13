/**
 * Calls Groq API via Vite dev proxy (/ai-proxy).
 * Free tier: 14,400 requests/day, 6,000 tokens/min — plenty for this app.
 * Production uses Netlify Functions with the server-side GROQ_API_KEY.
 */

const MODEL = 'llama-3.3-70b-versatile';
const BASE = '/ai-proxy/openai/v1/chat/completions';

export async function callHFDev(messages, maxTokens = 3000) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      'VITE_GROQ_API_KEY not set in .env — get a free key at console.groq.com then restart the dev server.'
    );
  }

  const res = await fetch(BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Groq ${res.status}: ${text || 'no details'}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error(`Unexpected Groq response: ${JSON.stringify(data).slice(0, 200)}`);
  return text;
}
