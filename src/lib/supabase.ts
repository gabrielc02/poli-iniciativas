import { createClient } from "@supabase/supabase-js";

// Acessando via string literal para satisfazer o TypeScript
const supabaseUrl = import.meta.env['VITE_SUPABASE_URL'];
const supabaseAnonKey = import.meta.env['VITE_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Faltam as variáveis de ambiente VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY no seu arquivo .env");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
