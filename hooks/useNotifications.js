'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotifs() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (!error && data) {
          setNotifications(data);
          setUnreadCount(data.filter(n => !n.is_read).length);
        }
      } catch (err) {
        console.warn('Notifications fetch handled gracefully:', err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchNotifs();
  }, []);

  const markAsRead = async (id) => {
    try {
      const supabase = createClient();
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.warn(e);
    }
  };

  const markAllRead = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.warn(e);
    }
  };

  return { notifications, unreadCount, loading, markAsRead, markAllRead };
}
