import { createClient } from '@/lib/supabase/client';

/**
 * Send notification to a target user
 */
export async function sendNotification({ userId, title, message, type = 'info', link = '' }) {
  try {
    const supabase = createClient();
    await supabase.from('notifications').insert({
      user_id: userId,
      title,
      message,
      type,
      link,
      is_read: false,
      created_at: new Date().toISOString()
    });
  } catch (err) {
    console.warn('Failed to send notification:', err.message);
  }
}
