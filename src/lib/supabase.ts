import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  { auth: { persistSession: false } },
);

export type Project = {
  id: string;
  created_at: string;
  author: string;
  team: string | null;
  title: string;
  description: string | null;
  web_url: string | null;
  video_url: string | null;
  github_url: string | null;
  report_url: string | null;
};
