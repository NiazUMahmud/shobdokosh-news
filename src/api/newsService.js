import { supabase } from './supabase';
import { supabaseAdmin } from './supabaseAdmin';
import { callHFDev } from './hfDev';
import { format } from 'date-fns';

function parseJsonArray(text) {
  const start = text.indexOf('[');
  if (start === -1) return null;
  const slice = text.slice(start);
  try { return JSON.parse(slice.slice(0, slice.lastIndexOf(']') + 1)); } catch {}
  // Truncated response: salvage complete objects before the last full closing brace
  const lastClose = slice.lastIndexOf('},');
  if (lastClose === -1) return null;
  try { return JSON.parse(slice.slice(0, lastClose + 1) + ']'); } catch { return null; }
}

// ─── Read queries (same in dev and prod) ────────────────────────────────────

export async function getNewsByDate(date) {
  const { data, error } = await supabase
    .from('news_summaries')
    .select('*')
    .eq('news_date', format(date, 'yyyy-MM-dd'))
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function searchNews({ query = '', category = 'সব', date = null } = {}) {
  let q = supabase
    .from('news_summaries')
    .select('*')
    .order('news_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (query) q = q.or(`title_bn.ilike.%${query}%,title_en.ilike.%${query}%,summary_en.ilike.%${query}%`);
  if (category && category !== 'সব') q = q.eq('category', category);
  if (date) q = q.eq('news_date', format(date, 'yyyy-MM-dd'));

  const { data, error } = await q.limit(100);
  if (error) throw error;
  return data ?? [];
}

export async function getAllBcsNews() {
  const { data, error } = await supabase
    .from('news_summaries')
    .select('*')
    .order('news_date', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ─── Fetch today's news ───────────────────────────────────────────────────────

export async function fetchTodaysNews() {
  if (import.meta.env.DEV) {
    return fetchTodaysNewsDev();
  }
  const res = await fetch('/.netlify/functions/fetch-news');
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

async function fetchTodaysNewsDev() {
  const today = format(new Date(), 'yyyy-MM-dd');

  // Return cached if it already exists
  const { data: existing } = await supabaseAdmin
    .from('news_summaries')
    .select('id')
    .eq('news_date', today)
    .limit(1);

  if (existing?.length > 0) {
    const { data: cached } = await supabaseAdmin
      .from('news_summaries')
      .select('*')
      .eq('news_date', today)
      .order('created_at', { ascending: false });
    return { news: cached, cached: true };
  }

  const systemPrompt = `You are a Bangladesh news editor. Output ONLY valid JSON arrays — no markdown, no code fences, no explanation.`;

  const userPrompt = `Generate exactly 10 Bangladesh news summaries for ${today}.

Return ONLY a raw JSON array starting with [ and ending with ].

Each object: title_bn, title_en, summary_bn (1-2 sentences), summary_en (1-2 sentences), category (one of: রাজনীতি|অর্থনীতি|আন্তর্জাতিক|খেলাধুলা|বিজ্ঞান ও প্রযুক্তি|শিক্ষা|আইন-শৃঙ্খলা|পরিবেশ|স্বাস্থ্য|সংস্কৃতি), source (one of: প্রথম আলো|The Daily Star|কালের কণ্ঠ|যুগান্তর|Bangladesh Pratidin|Ittefaq), importance (high|medium|low), bcs_relevance (true|false), key_facts (array of 3 short strings).

Rules: ≥2 high importance, ≥6 bcs_relevance true, ≥5 different categories, proper Unicode Bengali.`;

  const rawText = await callHFDev(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    4000
  );

  const items = parseJsonArray(rawText);
  if (!items) throw new Error('Model did not return valid JSON. Please try again.');
  const toInsert = items.map((item) => ({ ...item, news_date: today }));

  const { data: inserted, error } = await supabaseAdmin
    .from('news_summaries')
    .insert(toInsert)
    .select();

  if (error) throw new Error(error.message);
  return { news: inserted, cached: false };
}

// ─── Tutor chat ──────────────────────────────────────────────────────────────

export async function tutorChat(message, history = []) {
  if (import.meta.env.DEV) {
    return tutorChatDev(message, history);
  }
  const res = await fetch('/.netlify/functions/tutor-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.response;
}

async function tutorChatDev(message, history) {
  const since = format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
  const { data: recentNews } = await supabase
    .from('news_summaries')
    .select('title_en, summary_en, category, key_facts, bcs_relevance, news_date')
    .gte('news_date', since)
    .order('news_date', { ascending: false })
    .limit(20);

  const newsContext = recentNews?.length > 0
    ? '\n\nRecent Bangladesh news:\n' +
      recentNews.map((n) =>
        `[${n.news_date}] ${n.category}${n.bcs_relevance ? ' [BCS]' : ''}: ${n.title_en}. ${n.summary_en}` +
        (n.key_facts?.length ? ` Key facts: ${n.key_facts.join('; ')}` : '')
      ).join('\n')
    : '';

  const systemPrompt =
    `You are an exam preparation tutor for Bangladesh Civil Service (BCS) and competitive exams. ` +
    `Explain news clearly for exam preparation. Reply in the same language the user writes (Bengali or English). ` +
    `Focus on key facts, dates, numbers, and exam relevance.` +
    newsContext;

  const messages = [
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: 'user', content: message },
  ];

  return callHFDev([{ role: 'system', content: systemPrompt }, ...messages], 1024);
}
