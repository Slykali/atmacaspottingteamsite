-- ============================================
-- YARIŞMA VE AKTİF SPOTTER TAKİP SİSTEMİ
-- ============================================
-- Bu SQL dosyası yarışma ve aktif spotter takibi için gerekli tabloları oluşturur
-- Supabase Dashboard -> SQL Editor'da çalıştırın
-- ============================================

-- ============================================
-- 1. SPOTTER ACTIVITY TABLOSU (AKTİF SPOTTER TAKİBİ)
-- ============================================

CREATE TABLE IF NOT EXISTS public.spotter_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'photo_upload',
    'photo_approved',
    'comment',
    'like',
    'announcement_view',
    'message_sent',
    'profile_update'
  )),
  activity_points INTEGER DEFAULT 0,
  related_id UUID NULL, -- İlgili kayıt ID'si (photo_id, announcement_id, etc.)
  related_type TEXT NULL, -- İlgili kayıt tipi
  month_year TEXT NOT NULL, -- Format: 'YYYY-MM' (örn: '2025-11')
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  details JSONB NULL -- Ekstra detaylar
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_spotter_activity_user_id ON public.spotter_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_spotter_activity_month_year ON public.spotter_activity(month_year);
CREATE INDEX IF NOT EXISTS idx_spotter_activity_type ON public.spotter_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_spotter_activity_user_month ON public.spotter_activity(user_id, month_year);

-- RLS aktifleştir
ALTER TABLE public.spotter_activity ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own activity" ON public.spotter_activity;
CREATE POLICY "Users can view their own activity"
ON public.spotter_activity
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all activity" ON public.spotter_activity;
CREATE POLICY "Admins can view all activity"
ON public.spotter_activity
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'developer')
  )
);

DROP POLICY IF EXISTS "System can insert activity" ON public.spotter_activity;
CREATE POLICY "System can insert activity"
ON public.spotter_activity
FOR INSERT
TO authenticated
WITH CHECK (true);

-- ============================================
-- 2. COMPETITIONS TABLOSU (YARIŞMALAR)
-- ============================================

CREATE TABLE IF NOT EXISTS public.competitions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'ended', 'cancelled')),
  prize_description TEXT,
  rules TEXT,
  winner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_competitions_status ON public.competitions(status);
CREATE INDEX IF NOT EXISTS idx_competitions_dates ON public.competitions(start_date, end_date);

-- RLS aktifleştir
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Public can view active competitions" ON public.competitions;
CREATE POLICY "Public can view active competitions"
ON public.competitions
FOR SELECT
TO public
USING (status IN ('active', 'ended'));

DROP POLICY IF EXISTS "Authenticated can view all competitions" ON public.competitions;
CREATE POLICY "Authenticated can view all competitions"
ON public.competitions
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Admins can manage competitions" ON public.competitions;
CREATE POLICY "Admins can manage competitions"
ON public.competitions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'developer')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'developer')
  )
);

-- ============================================
-- 3. COMPETITION PARTICIPANTS TABLOSU
-- ============================================

CREATE TABLE IF NOT EXISTS public.competition_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  competition_id UUID NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  rank INTEGER NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(competition_id, user_id)
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_competition_participants_competition ON public.competition_participants(competition_id);
CREATE INDEX IF NOT EXISTS idx_competition_participants_user ON public.competition_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_competition_participants_points ON public.competition_participants(competition_id, total_points DESC);

-- RLS aktifleştir
ALTER TABLE public.competition_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their participation" ON public.competition_participants;
CREATE POLICY "Users can view their participation"
ON public.competition_participants
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public can view competition results" ON public.competition_participants;
CREATE POLICY "Public can view competition results"
ON public.competition_participants
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.competitions
    WHERE competitions.id = competition_participants.competition_id
    AND competitions.status = 'ended'
  )
);

DROP POLICY IF EXISTS "Admins can view all participants" ON public.competition_participants;
CREATE POLICY "Admins can view all participants"
ON public.competition_participants
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'developer')
  )
);

DROP POLICY IF EXISTS "Users can join competitions" ON public.competition_participants;
CREATE POLICY "Users can join competitions"
ON public.competition_participants
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.competitions
    WHERE competitions.id = competition_id
    AND competitions.status = 'active'
  )
);

DROP POLICY IF EXISTS "System can update points" ON public.competition_participants;
CREATE POLICY "System can update points"
ON public.competition_participants
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- 4. HELPER FUNCTIONS
-- ============================================

-- Bu ayın aktif spotterlarını getiren fonksiyon
CREATE OR REPLACE FUNCTION get_monthly_active_spotters(month_year_param TEXT DEFAULT NULL)
RETURNS TABLE (
  user_id UUID,
  user_name TEXT,
  user_avatar TEXT,
  total_points BIGINT,
  photo_uploads BIGINT,
  comments BIGINT,
  likes_given BIGINT
) AS $$
DECLARE
  target_month TEXT;
BEGIN
  -- Eğer ay belirtilmemişse, bu ayı kullan
  IF month_year_param IS NULL THEN
    target_month := TO_CHAR(CURRENT_DATE, 'YYYY-MM');
  ELSE
    target_month := month_year_param;
  END IF;

  RETURN QUERY
  WITH user_stats AS (
    SELECT 
      sa.user_id,
      SUM(sa.activity_points) as total_points,
      COUNT(*) FILTER (WHERE sa.activity_type = 'photo_upload') as photo_uploads,
      COUNT(*) FILTER (WHERE sa.activity_type = 'comment') as comments,
      COUNT(*) FILTER (WHERE sa.activity_type = 'like') as likes_given
    FROM public.spotter_activity sa
    WHERE sa.month_year = target_month
    GROUP BY sa.user_id
  )
  SELECT 
    us.user_id,
    p.full_name::TEXT,
    p.avatar_url::TEXT,
    us.total_points,
    us.photo_uploads,
    us.comments,
    us.likes_given
  FROM user_stats us
  JOIN public.profiles p ON p.id = us.user_id
  ORDER BY us.total_points DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Yarışma sonuçlarını getiren fonksiyon
CREATE OR REPLACE FUNCTION get_competition_results(competition_id_param UUID)
RETURNS TABLE (
  user_id UUID,
  user_name TEXT,
  user_avatar TEXT,
  total_points INTEGER,
  rank INTEGER,
  photo_uploads BIGINT,
  comments BIGINT,
  likes_given BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cp.user_id,
    p.full_name::TEXT,
    p.avatar_url::TEXT,
    cp.total_points,
    cp.rank,
    COUNT(*) FILTER (WHERE sa.activity_type = 'photo_upload') as photo_uploads,
    COUNT(*) FILTER (WHERE sa.activity_type = 'comment') as comments,
    COUNT(*) FILTER (WHERE sa.activity_type = 'like') as likes_given
  FROM public.competition_participants cp
  JOIN public.profiles p ON p.id = cp.user_id
  LEFT JOIN public.spotter_activity sa ON sa.user_id = cp.user_id
    AND sa.created_at >= (SELECT start_date FROM public.competitions WHERE id = competition_id_param)
    AND sa.created_at <= (SELECT end_date FROM public.competitions WHERE id = competition_id_param)
  WHERE cp.competition_id = competition_id_param
  GROUP BY cp.user_id, p.full_name, p.avatar_url, cp.total_points, cp.rank
  ORDER BY cp.total_points DESC, cp.rank ASC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aktivite puanı ekleme fonksiyonu
CREATE OR REPLACE FUNCTION add_spotter_activity(
  p_user_id UUID,
  p_activity_type TEXT,
  p_points INTEGER DEFAULT 0,
  p_related_id UUID DEFAULT NULL,
  p_related_type TEXT DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  activity_id UUID;
  current_month TEXT;
BEGIN
  current_month := TO_CHAR(CURRENT_DATE, 'YYYY-MM');
  
  INSERT INTO public.spotter_activity (
    user_id,
    activity_type,
    activity_points,
    related_id,
    related_type,
    month_year,
    details
  )
  VALUES (
    p_user_id,
    p_activity_type,
    p_points,
    p_related_id,
    p_related_type,
    current_month,
    p_details
  )
  RETURNING id INTO activity_id;

  -- Eğer aktif bir yarışma varsa, puanları güncelle
  UPDATE public.competition_participants cp
  SET total_points = total_points + p_points
  FROM public.competitions c
  WHERE cp.competition_id = c.id
    AND cp.user_id = p_user_id
    AND c.status = 'active'
    AND CURRENT_DATE BETWEEN c.start_date AND c.end_date;

  RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Yarışma puanlarını hesapla ve sırala
CREATE OR REPLACE FUNCTION calculate_competition_ranks(competition_id_param UUID)
RETURNS VOID AS $$
BEGIN
  WITH ranked_participants AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY total_points DESC, joined_at ASC) as new_rank
    FROM public.competition_participants
    WHERE competition_id = competition_id_param
  )
  UPDATE public.competition_participants cp
  SET rank = rp.new_rank
  FROM ranked_participants rp
  WHERE cp.id = rp.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. TRIGGERS
-- ============================================

-- Fotoğraf onaylandığında aktivite ekle
CREATE OR REPLACE FUNCTION trigger_photo_approved_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    PERFORM add_spotter_activity(
      NEW.user_id,
      'photo_approved',
      10, -- 10 puan
      NEW.id,
      'gallery_image',
      jsonb_build_object('photo_alt', NEW.alt)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_photo_approved_activity ON public.gallery_images;
CREATE TRIGGER trigger_photo_approved_activity
  AFTER UPDATE OF status ON public.gallery_images
  FOR EACH ROW
  WHEN (NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved'))
  EXECUTE FUNCTION trigger_photo_approved_activity();

-- Yorum yapıldığında aktivite ekle
CREATE OR REPLACE FUNCTION trigger_comment_activity()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM add_spotter_activity(
    NEW.user_id,
    'comment',
    2, -- 2 puan
    NEW.image_id,
    'gallery_image',
    jsonb_build_object('comment', LEFT(NEW.comment, 50))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_comment_activity ON public.gallery_comments;
CREATE TRIGGER trigger_comment_activity
  AFTER INSERT ON public.gallery_comments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_comment_activity();

-- Beğeni yapıldığında aktivite ekle
CREATE OR REPLACE FUNCTION trigger_like_activity()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM add_spotter_activity(
    NEW.user_id,
    'like',
    1, -- 1 puan
    NEW.image_id,
    'gallery_image',
    NULL
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_like_activity ON public.gallery_likes;
CREATE TRIGGER trigger_like_activity
  AFTER INSERT ON public.gallery_likes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_like_activity();

-- updated_at trigger
DROP TRIGGER IF EXISTS update_competitions_updated_at ON public.competitions;
CREATE TRIGGER update_competitions_updated_at 
  BEFORE UPDATE ON public.competitions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. GRANT PERMISSIONS
-- ============================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.spotter_activity TO authenticated;
GRANT ALL ON public.competitions TO authenticated;
GRANT ALL ON public.competition_participants TO authenticated;
GRANT EXECUTE ON FUNCTION get_monthly_active_spotters(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_competition_results(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION add_spotter_activity(UUID, TEXT, INTEGER, UUID, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_competition_ranks(UUID) TO authenticated;

-- ============================================
-- 7. ÖRNEK VERİ (OPSIYONEL)
-- ============================================

-- Örnek yarışma oluşturma
/*
INSERT INTO public.competitions (
  title,
  description,
  start_date,
  end_date,
  status,
  prize_description,
  rules
) VALUES (
  'Kasım 2025 Spotter Yarışması',
  'Bu ay en çok fotoğraf yükleyen ve en aktif olan spotterlar ödüllendirilecek!',
  '2025-11-01',
  '2025-11-30',
  'active',
  'İlk 3 spotter özel rozet ve sertifika kazanacak!',
  '1. Fotoğraf yüklemek 10 puan
2. Yorum yapmak 2 puan
3. Beğeni yapmak 1 puan
4. En yüksek puana sahip spotterlar kazanır'
);
*/

-- ============================================
-- ✅ KURULUM TAMAMLANDI!
-- ============================================

-- ============================================
-- KONTROL SORGULARI
-- ============================================

-- Tablolar oluşturuldu mu?
SELECT 
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('spotter_activity', 'competitions', 'competition_participants')
AND schemaname = 'public';

-- Index'ler
SELECT 
  tablename,
  indexname
FROM pg_indexes 
WHERE tablename IN ('spotter_activity', 'competitions', 'competition_participants')
AND schemaname = 'public'
ORDER BY tablename, indexname;

-- Fonksiyonlar
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'get_monthly_active_spotters',
  'get_competition_results',
  'add_spotter_activity',
  'calculate_competition_ranks',
  'trigger_photo_approved_activity',
  'trigger_comment_activity',
  'trigger_like_activity'
)
ORDER BY routine_name;

-- ============================================
-- NOTLAR
-- ============================================
-- 1. Spotter activity otomatik olarak trigger'lar ile kaydedilir
-- 2. Fotoğraf onaylandığında 10 puan eklenir
-- 3. Yorum yapıldığında 2 puan eklenir
-- 4. Beğeni yapıldığında 1 puan eklenir
-- 5. Puanlar aylık olarak takip edilir (month_year formatı: 'YYYY-MM')
-- 6. Yarışmalar aktif olduğunda puanlar otomatik olarak yarışma puanlarına eklenir
-- 7. Yarışma bittiğinde calculate_competition_ranks() fonksiyonu ile sıralama yapılır

