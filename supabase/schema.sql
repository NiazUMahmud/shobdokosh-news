-- ============================================================
-- Shobdokosh News — BCS Exam Prep Platform
-- Supabase Schema v1.0
--
-- HOW TO USE:
--   1. Open your Supabase project → SQL Editor
--   2. Paste this entire file and click "Run"
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. USER PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT,
  avatar_url    TEXT,
  exam_targets  TEXT[] DEFAULT ARRAY['bcs'],
  daily_goal    INT DEFAULT 60,
  streak        INT DEFAULT 0,
  last_active   DATE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- 2. NEWS ARTICLES (real RSS-sourced news with actual URLs)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.news_articles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_bn         TEXT NOT NULL,
  title_en         TEXT,
  summary_bn       TEXT NOT NULL,
  summary_en       TEXT,
  source_url       TEXT,            -- actual newspaper article link
  source_name      TEXT NOT NULL,   -- 'prothom_alo', 'daily_star', etc.
  source_label     TEXT,            -- 'প্রথম আলো', 'The Daily Star', etc.
  category         TEXT NOT NULL,
  published_at     TIMESTAMPTZ,
  fetched_at       TIMESTAMPTZ DEFAULT NOW(),
  news_date        DATE NOT NULL DEFAULT CURRENT_DATE,
  bcs_relevance    BOOLEAN DEFAULT FALSE,
  relevance_score  INT DEFAULT 0 CHECK (relevance_score BETWEEN 0 AND 100),
  importance       TEXT DEFAULT 'medium' CHECK (importance IN ('low','medium','high','critical')),
  key_facts        JSONB DEFAULT '[]',
  exam_tags        TEXT[] DEFAULT '{}',
  mcq_questions    JSONB DEFAULT '[]',
  is_active        BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_news_date       ON public.news_articles (news_date DESC);
CREATE INDEX IF NOT EXISTS idx_news_category   ON public.news_articles (category);
CREATE INDEX IF NOT EXISTS idx_news_relevance  ON public.news_articles (relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_news_bcs        ON public.news_articles (bcs_relevance);
CREATE INDEX IF NOT EXISTS idx_news_source     ON public.news_articles (source_name);

ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "News articles are publicly readable"
  ON public.news_articles FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Only service role can write news"
  ON public.news_articles FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- 3. SAVED ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.saved_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type   TEXT NOT NULL CHECK (item_type IN ('news','question','flashcard')),
  item_id     UUID NOT NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, item_type, item_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_user ON public.saved_items (user_id, item_type);

ALTER TABLE public.saved_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own saved items"
  ON public.saved_items FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 4. MCQ QUESTIONS BANK
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mcq_questions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_bn     TEXT NOT NULL,
  question_en     TEXT,
  options         JSONB NOT NULL,
  -- Format: [{"key":"a","text_bn":"...","text_en":"..."},...]
  correct_answer  TEXT NOT NULL,
  explanation_bn  TEXT,
  explanation_en  TEXT,
  subject         TEXT NOT NULL,
  -- 'bangla','english','math','bangladesh_affairs','international_affairs',
  -- 'general_science','ict','mental_ability','ethics','geography'
  topic           TEXT,
  exam_name       TEXT,
  exam_year       INT,
  difficulty      TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  source          TEXT DEFAULT 'ai_generated'
                   CHECK (source IN ('previous_exam','ai_generated','news_based')),
  news_article_id UUID REFERENCES public.news_articles(id) ON DELETE SET NULL,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mcq_subject    ON public.mcq_questions (subject);
CREATE INDEX IF NOT EXISTS idx_mcq_difficulty ON public.mcq_questions (difficulty);
CREATE INDEX IF NOT EXISTS idx_mcq_source     ON public.mcq_questions (source);

ALTER TABLE public.mcq_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "MCQ questions are publicly readable"
  ON public.mcq_questions FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Only service role can manage MCQ"
  ON public.mcq_questions FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- 5. USER QUESTION ATTEMPTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_question_attempts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id      UUID NOT NULL REFERENCES public.mcq_questions(id) ON DELETE CASCADE,
  selected_answer  TEXT,
  is_correct       BOOLEAN,
  time_taken_secs  INT,
  attempted_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attempts_user ON public.user_question_attempts (user_id, attempted_at DESC);

ALTER TABLE public.user_question_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own question attempts"
  ON public.user_question_attempts FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 6. MOCK TESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mock_tests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title             TEXT NOT NULL,
  title_bn          TEXT,
  exam_type         TEXT NOT NULL
                     CHECK (exam_type IN ('bcs-preliminary','bcs-written','bank','ntrca','custom')),
  subject           TEXT,
  duration_minutes  INT NOT NULL DEFAULT 60,
  total_questions   INT NOT NULL,
  question_ids      UUID[] NOT NULL,
  passing_score     INT DEFAULT 50,
  is_active         BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.mock_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mock tests are publicly readable"
  ON public.mock_tests FOR SELECT USING (is_active = TRUE);

-- ============================================================
-- 7. MOCK TEST ATTEMPTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mock_test_attempts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_id          UUID NOT NULL REFERENCES public.mock_tests(id) ON DELETE CASCADE,
  answers          JSONB DEFAULT '{}',
  score            NUMERIC(5,2),
  total_correct    INT,
  total_wrong      INT,
  time_taken_mins  INT,
  is_completed     BOOLEAN DEFAULT FALSE,
  started_at       TIMESTAMPTZ DEFAULT NOW(),
  completed_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_test_attempts_user ON public.mock_test_attempts (user_id, started_at DESC);

ALTER TABLE public.mock_test_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own test attempts"
  ON public.mock_test_attempts FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 8. AI TUTOR SESSIONS & MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tutor_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT DEFAULT 'নতুন আলোচনা',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tutor_sessions_user ON public.tutor_sessions (user_id, updated_at DESC);

ALTER TABLE public.tutor_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own tutor sessions"
  ON public.tutor_sessions FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.tutor_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES public.tutor_sessions(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tutor_messages_session ON public.tutor_messages (session_id, created_at ASC);

ALTER TABLE public.tutor_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access messages in their sessions"
  ON public.tutor_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tutor_sessions
      WHERE id = session_id AND user_id = auth.uid()
    )
  );

-- ============================================================
-- 9. SYLLABUS PROGRESS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.syllabus_progress (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_key   TEXT NOT NULL,
  status      TEXT DEFAULT 'not_started'
               CHECK (status IN ('not_started','in_progress','completed')),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, topic_key)
);

ALTER TABLE public.syllabus_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own syllabus progress"
  ON public.syllabus_progress FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- DONE — Schema ready. Next: add your environment variables
-- in Netlify and run npm install.
-- ============================================================
