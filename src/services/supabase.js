import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// calls
export function signup(name, email) {
  return supabaseEmail.functions.invoke("swift-processor", {
    body: { action: "signup", name, email },
  });
}

export function resetPassword(email) {
  return supabaseEmail.functions.invoke("swift-processor", {
    body: { action: "resetPassword", email },
  });
}
