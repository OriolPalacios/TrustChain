// src/services/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'

// Pega tus claves de Supabase aquí
const supabaseUrl = 'https://uqjssdopyvzemdcbfoso.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxanNzZG9weXZ6ZW1kY2Jmb3NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNDQ0MDYsImV4cCI6MjA3NjcyMDQwNn0.7Dx0T-RViu12WDCZ0pSaZLvtcdeufOyAp-yAlKTd4fs'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)