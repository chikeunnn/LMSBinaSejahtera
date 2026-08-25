import { createBrowserClient } from '@supabase/ssr';

const FALLBACK_URL = 'https://nimqptwgvatvlvhvugdf.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pbXFwdHdndmF0dmx2aHZ1Z2RmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1NDQ0NDMsImV4cCI6MjEwMjEyMDQ0M30.ZEkdfVBT5gsUnjPLo7xSg21Ab7J2ho7eKyPu3UvCvHE';

let clientInstance = null;

export function createClient() {
  if (clientInstance) return clientInstance;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_KEY;

  try {
    clientInstance = createBrowserClient(url, key);
    return clientInstance;
  } catch (err) {
    console.error('Supabase client initialization fallback:', err);
    return createBrowserClient(FALLBACK_URL, FALLBACK_KEY);
  }
}
