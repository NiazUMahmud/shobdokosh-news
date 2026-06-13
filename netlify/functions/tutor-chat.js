/**
 * tutor-chat.js — AI tutor Netlify function
 * Accepts: POST { sessionId, message, history: [{role, content}] }
 * Returns:  { reply: string }
 */

import { createClient } from '@supabase/supabase-js';

const GROQ_URL   = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: HEADERS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: HEADERS, body: 'Method Not Allowed' };

  try {
    const { message, history = [] } = JSON.parse(event.body || '{}');
    if (!message?.trim()) return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Message required' }) };

    // Pull recent BCS-relevant news for context (from new table)
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const { data: recentNews } = await supabase
      .from('news_articles')
      .select('title_bn, title_en, summary_en, category, key_facts, bcs_relevance, news_date, source_label, source_url')
      .gte('news_date', since)
      .eq('bcs_relevance', true)
      .order('relevance_score', { ascending: false })
      .limit(15);

    const newsContext = recentNews?.length > 0
      ? '\n\nসাম্প্রতিক BCS-প্রাসঙ্গিক সংবাদ:\n' +
        recentNews.map(n =>
          `[${n.news_date}] ${n.category} (${n.source_label}): ${n.title_bn}` +
          (n.summary_en ? ` — ${n.summary_en}` : '') +
          (n.key_facts?.length ? ` | Key facts: ${n.key_facts.join('; ')}` : '')
        ).join('\n')
      : '';

    const systemPrompt =
      `You are an expert BCS and Bangladesh government job exam preparation tutor. ` +
      `Help students prepare for BCS Preliminary, Written, Viva, bank exams, and NTRCA. ` +
      `Always reply in the same language the student uses (Bengali or English). ` +
      `For Bengali questions, reply in fluent Bengali. ` +
      `Focus on: correct facts, exam relevance, memorization tips, previous question patterns, and current affairs. ` +
      `Be concise, accurate, and encouraging.` +
      newsContext;

    const groqMessages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-8).map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: message },
    ];

    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model:       GROQ_MODEL,
        messages:    groqMessages,
        max_tokens:  1024,
        temperature: 0.6,
      }),
    });

    if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);
    const data  = await res.json();
    const reply = data?.choices?.[0]?.message?.content;
    if (!reply) throw new Error('Empty Groq response');

    return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ reply }) };
  } catch (err) {
    console.error('tutor-chat error:', err);
    return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: err.message }) };
  }
};
