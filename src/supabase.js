import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://scgexdxnqctwrhtprlir.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable__t7cg_r0EdAIs8Ai4sed0w_HgxMyYuf";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
