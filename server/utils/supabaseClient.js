const { createClient } = require('@supabase/supabase-js');
require('dotenv').config(); // Load biến môi trường

const SUPABASE_URL = process.env.SUPABASE_URL;   // https://xxxx.supabase.co
const SUPABASE_KEY = process.env.SUPABASE_KEY;   // anon hoặc service_role key

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ✅ Hàm gọi Edge Function từ Dashboard
async function callSupabaseFunction(action, payload = {}) {
  try {
    const { data, error } = await supabase.functions.invoke('dynamic-action', {
      body: { action, ...payload },
    });

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('callSupabaseFunction error:', err.message);
    throw err;
  }
}

module.exports = { supabase, callSupabaseFunction };
