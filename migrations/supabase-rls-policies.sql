-- Supabase-Specific RLS Policies
-- Use this file when deploying to Supabase with auth.users integration

-- Enable RLS on all sensitive tables (if not already enabled)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detailed_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_recommendations ENABLE ROW LEVEL SECURITY;

-- User data policies using Supabase auth
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
CREATE POLICY "Users can view own data" ON public.users 
  FOR SELECT USING (auth.uid()::text = id::text);

DROP POLICY IF EXISTS "Users can update own data" ON public.users 
CREATE POLICY "Users can update own data" ON public.users 
  FOR UPDATE USING (auth.uid()::text = id::text);

-- User sessions - users can only access their own sessions
DROP POLICY IF EXISTS "Users can access own sessions" ON public.user_sessions;
CREATE POLICY "Users can access own sessions" ON public.user_sessions 
  FOR ALL USING (auth.uid()::text = user_id::text);

-- User profiles - users can only access their own profiles
DROP POLICY IF EXISTS "Users can access own profiles" ON public.user_profiles;
CREATE POLICY "Users can access own profiles" ON public.user_profiles 
  FOR ALL USING (auth.uid()::text = user_id::text);

-- Comments - users can view all but only edit their own
DROP POLICY IF EXISTS "Anyone can view comments" ON public.comments;
CREATE POLICY "Anyone can view comments" ON public.comments 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage own comments" ON public.comments;
CREATE POLICY "Users can manage own comments" ON public.comments 
  FOR ALL USING (auth.uid()::text = user_id::text);

-- Uploads - users can only access their own uploads
DROP POLICY IF EXISTS "Users can access own uploads" ON public.uploads;
CREATE POLICY "Users can access own uploads" ON public.uploads 
  FOR ALL USING (auth.uid()::text = user_id::text);

-- Analytics tables - users can only view their own data
DROP POLICY IF EXISTS "Users can view own analytics" ON public.exam_analytics;
CREATE POLICY "Users can view own analytics" ON public.exam_analytics 
  FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can view own performance" ON public.performance_trends;
CREATE POLICY "Users can view own performance" ON public.performance_trends 
  FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can view own recommendations" ON public.study_recommendations;
CREATE POLICY "Users can view own recommendations" ON public.study_recommendations 
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Admin-only tables - restrict to authenticated admin users
DROP POLICY IF EXISTS "Admin only access" ON public.auth_logs;
CREATE POLICY "Admin only access" ON public.auth_logs 
  FOR ALL USING (
    auth.uid() IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid()::text 
      AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admin only access" ON public.auth_sessions;
CREATE POLICY "Admin only access" ON public.auth_sessions 
  FOR ALL USING (
    auth.uid() IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid()::text 
      AND role = 'admin'
    )
  );