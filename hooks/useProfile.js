'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const isAdminSession = typeof window !== 'undefined' && (
        localStorage.getItem('lms_admin_login') === 'true' ||
        window.location.pathname.startsWith('/admin')
      );

      if (!user) {
        if (isAdminSession) {
          setProfile({
            id: 'master-admin-id',
            email: 'admin@binasejahtera.sch.id',
            full_name: 'Super Administrator',
            role: 'admin',
            avatar_url: null
          });
        } else {
          setProfile(null);
        }
        setLoading(false);
        return;
      }

      // Query profiles by primary key 'id' or 'auth_user_id'
      let { data, error: err } = await supabase
        .from('profiles')
        .select('*, classes(id, name, grade, code)')
        .or(`id.eq.${user.id},auth_user_id.eq.${user.id}`)
        .maybeSingle();

      if (!data) {
        const { data: simpleData } = await supabase
          .from('profiles')
          .select('*')
          .or(`id.eq.${user.id},auth_user_id.eq.${user.id}`)
          .maybeSingle();
        data = simpleData;
      }

      // If profile has class_id but classes object is null, fetch class info manually
      if (data && data.class_id && (!data.classes || !data.classes.name)) {
        const { data: clsInfo } = await supabase
          .from('classes')
          .select('id, name, grade, code')
          .eq('id', data.class_id)
          .maybeSingle();
        if (clsInfo) {
          data.classes = clsInfo;
        }
      }

      // Read persistent local avatar fallback
      let savedAvatar = null;
      if (typeof window !== 'undefined') {
        savedAvatar = localStorage.getItem(`lms_avatar_${user.id}`);
      }

      if (data) {
        if (!data.avatar_url && savedAvatar) {
          data.avatar_url = savedAvatar;
        }
        setProfile(data);
      } else {
        // Default profile fallback
        setProfile({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
          role: isAdminSession ? 'admin' : (user.user_metadata?.role || 'student'),
          avatar_url: savedAvatar || null
        });
      }
    } catch (e) {
      console.warn('Profile fetch handled gracefully:', e.message);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, error, refreshProfile: fetchProfile, refetch: fetchProfile };
}
