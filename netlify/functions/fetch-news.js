/**
 * fetch-news.js — Netlify serverless function
 *
 * Pipeline:
 *  1. Fetch RSS feeds from top 5 Bangladeshi newspapers
 *  2. Parse articles, extract titles + links
 *  3. Deduplicate across sources
 *  4. Send to Groq for BCS relevance scoring, Bengali/English summary, key facts, MCQ
 *  5. Store in Supabase news_articles table with actual source URLs
 *
 * Trigger: GET /.netlify/functions/fetch-news
 * Can also be called via Netlify Scheduled Functions (see netlify.toml)
 */

import { createClient } from '@supabase/supabase-js';

const GROQ_URL   = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── RSS sources ──────────────────────────────────────────────────────────────
const SOURCES = [
  {
    name:  'prothom_alo',
    label: 'প্রথম আলো',
    feeds: [
      'https://www.prothomalo.com/feed/',
      'https://www.prothomalo.com/politics/feed/',
      'https://www.prothomalo.com/economy/feed/',
    ],
  },
  {
    name:  'daily_star',
    label: 'The Daily Star',
    feeds: [
      'https://www.thedailystar.net/frontpage/rss.xml',
      'https://www.thedailystar.net/news/bangladesh/rss.xml',
    ],
  },
  {
    name:  'jugantor',
    label: 'যুগান্তর',
    feeds: [
      'https://www.jugantor.com/feed/',
    ],
  },
  {
    name:  'bd_pratidin',
    label: 'বাংলাদেশ প্রতিদিন',
    feeds: [
      'https://www.bd-pratidin.com/feed/',
    ],
  },
  {
    name:  'kaler_kantho',
    label: 'কালের কণ্ঠ',
    feeds: [
      'https://www.kalerkantho.com/feed/',
    ],
  },
];

// ── Simple RSS XML parser (no external deps) ─────────────────────────────────
function parseRSS(xml) {
  const items = [];
  const itemPattern = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemPattern.exec(xml)) !== null) {
    const block = match[1];
    const title = stripCDATA(extractTag(block, 'title'));
    const link  = stripCDATA(extractTag(block, 'link'))
                  || extractTag(block, 'guid')?.replace(/^<!\[CDATA\[|\]\]>$/g, '');
    const pubDate = extractTag(block, 'pubDate');
    const description = stripCDATA(extractTag(block, 'description'));

    if (title && link) {
      items.push({ title, link: link.trim(), pubDate, description });
    }
  }
  return items;
}

function extractTag(text, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = re.exec(text);
  return m ? m[1].trim() : '';
}

function stripCDATA(str) {
  return str.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim();
}

function stripHTML(str) {
  return str.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

// ── Fetch one RSS feed with timeout ─────────────────────────────────────────
async function fetchFeed(url, timeout = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'ShobdokoshNews/1.0 (exam prep aggregator)' },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRSS(xml);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

// ── Collect articles from all sources ───────────────────────────────────────
async function collectArticles() {
  const all = [];
  for (const source of SOURCES) {
    for (const feedUrl of source.feeds) {
      const items = await fetchFeed(feedUrl);
      for (const item of items) {
        all.push({ ...item, source_name: source.name, source_label: source.label });
      }
    }
  }
  return all;
}

// ── Deduplicate by normalised title ─────────────────────────────────────────
function deduplicateArticles(articles) {
  const seen = new Set();
  return articles.filter(a => {
    const key = a.title.toLowerCase().replace(/[^ঀ-৿a-z0-9 ]/g, '').slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── Groq call ────────────────────────────────────────────────────────────────
async function callGroq(systemPrompt, userPrompt, maxTokens = 4000) {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt   },
      ],
      max_tokens:  maxTokens,
      temperature: 0.4,
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty Groq response');
  return text;
}

function parseJsonArray(text) {
  const start = text.indexOf('[');
  if (start === -1) return null;
  const slice = text.slice(start);
  try { return JSON.parse(slice.slice(0, slice.lastIndexOf(']') + 1)); } catch {}
  const lastClose = slice.lastIndexOf('},');
  if (lastClose === -1) return null;
  try { return JSON.parse(slice.slice(0, lastClose + 1) + ']'); } catch { return null; }
}

// ── Analyse articles for BCS relevance via Groq ──────────────────────────────
async function analyseWithGroq(articles, today) {
  const MAX_BATCH = 15;
  const batch = articles.slice(0, MAX_BATCH);

  const input = batch.map((a, i) => ({
    idx:     i,
    title:   a.title,
    snippet: stripHTML(a.description || '').slice(0, 300),
    source:  a.source_label,
    link:    a.link,
  }));

  const system = `You are a Bangladesh exam content analyst.
Output ONLY valid JSON arrays — no markdown, no code fences, no explanation.
Subjects for BCS: বাংলা, ইংরেজি, বাংলাদেশ বিষয়াবলী, আন্তর্জাতিক বিষয়াবলী, সাধারণ বিজ্ঞান, গণিত, মানসিক দক্ষতা, নৈতিকতা, তথ্যপ্রযুক্তি, ভূগোল।`;

  const user = `Analyse these ${batch.length} Bangladesh newspaper articles for BCS and government job exam relevance.

Articles:
${JSON.stringify(input, null, 2)}

Return a JSON array with exactly ${batch.length} objects in the same order (matching idx):

[
  {
    "idx": 0,
    "title_bn": "Bengali title (keep original if already Bengali, translate if English)",
    "title_en": "English title",
    "summary_bn": "1-2 sentence Bengali exam-focused summary",
    "summary_en": "1-2 sentence English exam-focused summary",
    "category": "one of: রাজনীতি|অর্থনীতি|আন্তর্জাতিক|খেলাধুলা|বিজ্ঞান ও প্রযুক্তি|শিক্ষা|আইন-শৃঙ্খলা|পরিবেশ|স্বাস্থ্য|সংস্কৃতি",
    "bcs_relevance": true or false,
    "relevance_score": 0-100 (how exam-important is this story),
    "importance": "low|medium|high|critical",
    "key_facts": ["3 short Bengali fact strings exam candidates should know"],
    "exam_tags": ["bcs-preliminary", "bcs-written", "bank", "ntrca"] (only applicable ones),
    "mcq_questions": [
      {
        "question_bn": "MCQ question in Bengali",
        "options": [{"key":"a","text_bn":"..."},{"key":"b","text_bn":"..."},{"key":"c","text_bn":"..."},{"key":"d","text_bn":"..."}],
        "correct_answer": "a",
        "explanation_bn": "Brief explanation why"
      }
    ]
  }
]

Rules:
- relevance_score > 60 means bcs_relevance = true
- Include mcq_questions only when relevance_score > 50 (1 question per article max)
- National policy, appointments, international events, science news → high relevance
- Sports, entertainment, crime → low relevance unless nationally significant`;

  const raw = await callGroq(system, user, 5000);
  return parseJsonArray(raw);
}

// ── Main handler ─────────────────────────────────────────────────────────────
export const handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  const today = new Date().toISOString().split('T')[0];

  // Return cached data if today's articles already exist
  const { data: existing } = await supabase
    .from('news_articles')
    .select('id')
    .eq('news_date', today)
    .eq('is_active', true)
    .limit(1);

  if (existing?.length > 0) {
    const { data: cached } = await supabase
      .from('news_articles')
      .select('*')
      .eq('news_date', today)
      .eq('is_active', true)
      .order('relevance_score', { ascending: false })
      .limit(30);

    return { statusCode: 200, headers, body: JSON.stringify({ articles: cached, cached: true }) };
  }

  try {
    // 1. Collect from RSS feeds
    const raw = await collectArticles();

    // 2. Deduplicate
    const unique = deduplicateArticles(raw);

    // 3. Analyse with Groq
    const analysed = await analyseWithGroq(unique, today);
    if (!analysed) throw new Error('Failed to parse Groq response');

    // 4. Merge RSS metadata with Groq analysis
    const records = analysed.map((a) => {
      const original = unique[a.idx] || {};
      return {
        title_bn:        a.title_bn,
        title_en:        a.title_en,
        summary_bn:      a.summary_bn,
        summary_en:      a.summary_en,
        source_url:      original.link || null,         // ← actual newspaper URL
        source_name:     original.source_name || 'unknown',
        source_label:    original.source_label || '',
        category:        a.category,
        published_at:    original.pubDate ? new Date(original.pubDate).toISOString() : null,
        news_date:       today,
        bcs_relevance:   a.bcs_relevance,
        relevance_score: a.relevance_score,
        importance:      a.importance,
        key_facts:       a.key_facts || [],
        exam_tags:       a.exam_tags || [],
        mcq_questions:   a.mcq_questions || [],
        is_active:       true,
      };
    });

    // 5. Insert into Supabase
    const { data: inserted, error } = await supabase
      .from('news_articles')
      .insert(records)
      .select();

    if (error) throw new Error(error.message);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ articles: inserted, cached: false, count: inserted.length }),
    };
  } catch (err) {
    console.error('fetch-news error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
