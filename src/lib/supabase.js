import { createClient } from '@supabase/supabase-js'

export const supabaseUrl = 'https://kbrdhofrezflnclrsfqv.supabase.co'
export const supabasePublishableKey = 'sb_publishable_n7V6pQDdR-Btg8nzdVDT-A_srYPg5Fz'
export const supabase = createClient(supabaseUrl, supabasePublishableKey)
