import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Database } from '~/types/supabase';

export type AppNotification = {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: 'like' | 'comment' | 'reply' | 'endorse' | string;
  target_type: 'post' | 'comment' | 'bias' | string;
  target_id: string;
  post_id: string | null;
  read_at: string | null;
  created_at: string;
  actor_username: string | null;
  actor_avatar_path: string | null;
};

type NotificationRow = Database['public']['Tables']['notifications']['Row'];

let sharedChannel: RealtimeChannel | null = null;

export function useNotifications() {
  const supabase = useSupabaseClient<Database>();
  const authUserId = useAuthUserId();

  const notifications = useState<AppNotification[]>('notifications-list', () => []);
  const unreadCount = useState<number>('notifications-unread', () => 0);
  const isLoading = useState<boolean>('notifications-loading', () => false);
  const hasLoaded = useState<boolean>('notifications-loaded', () => false);
  const realtimeStarted = useState<boolean>('notifications-realtime-started', () => false);

  function notificationMessage(n: AppNotification): string {
    const actor = n.actor_username || 'Alguém';
    switch (n.type) {
      case 'like':
        return n.target_type === 'comment'
          ? `${actor} curtiu seu comentário`
          : `${actor} curtiu sua postagem`;
      case 'comment':
        return `${actor} comentou na sua postagem`;
      case 'post_activity':
        return `${actor} comentou em uma postagem que você acompanha`;
      case 'reply':
        return `${actor} respondeu ao seu comentário`;
      case 'endorse':
        return `${actor} endossou seu viés`;
      case 'follow_request':
        return `${actor} pediu para te seguir`;
      case 'follow_accepted':
        return `${actor} aceitou sua solicitação de seguir`;
      default:
        return `${actor} interagiu com você`;
    }
  }

  function notificationLink(n: AppNotification): string | null {
    if (n.type === 'endorse') return '/user/profile';
    if (n.type === 'follow_request' || n.type === 'follow_accepted') {
      return n.actor_username ? `/user/${n.actor_username}` : null;
    }
    if (n.post_id) {
      if (n.type === 'reply' || (n.type === 'like' && n.target_type === 'comment')) {
        return `/post/${n.post_id}#comment-${n.target_id}`;
      }
      if (n.type === 'comment' || n.type === 'post_activity') {
        return `/post/${n.post_id}`;
      }
      return `/post/${n.post_id}`;
    }
    if (n.target_type === 'post') return `/post/${n.target_id}`;
    return null;
  }

  function removeNotification(id: string) {
    const item = notifications.value.find((n) => n.id === id);
    notifications.value = notifications.value.filter((n) => n.id !== id);
    if (item && !item.read_at) {
      unreadCount.value = Math.max(0, unreadCount.value - 1);
    }
  }

  async function refreshUnreadCount() {
    if (!authUserId.value) {
      unreadCount.value = 0;
      return;
    }
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', authUserId.value)
        .is('read_at', null);
      if (error) throw error;
      unreadCount.value = count || 0;
    } catch (e) {
      console.error('Erro ao contar notificações:', e);
    }
  }

  async function fetchNotifications(limit = 30, before?: string | null, append = false) {
    if (!authUserId.value) {
      notifications.value = [];
      unreadCount.value = 0;
      hasLoaded.value = false;
      return false;
    }
    if (!append) {
      isLoading.value = true;
    }
    try {
      let query = supabase
        .from('notifications_with_actor')
        .select('*')
        .eq('user_id', authUserId.value)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (before) {
        query = query.lt('created_at', before);
      }

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data || []) as AppNotification[];
      if (append) {
        const existing = new Set(notifications.value.map((n) => n.id));
        notifications.value = [
          ...notifications.value,
          ...rows.filter((n) => n.id && !existing.has(n.id)),
        ];
      } else {
        notifications.value = rows;
      }
      unreadCount.value = notifications.value.filter((n) => !n.read_at).length;
      hasLoaded.value = true;
      return rows.length >= limit;
    } catch (e) {
      console.error('Erro ao buscar notificações:', e);
      if (!append) {
        notifications.value = [];
      }
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function enrichActor(row: NotificationRow): Promise<AppNotification> {
    let actor_username: string | null = null;
    let actor_avatar_path: string | null = null;
    if (row.actor_id) {
      const { data } = await supabase
        .from('profiles')
        .select('username, avatar_path')
        .eq('id', row.actor_id)
        .maybeSingle();
      actor_username = data?.username ?? null;
      actor_avatar_path = data?.avatar_path ?? null;
    }
    return {
      ...row,
      actor_username,
      actor_avatar_path,
    };
  }

  async function handleRealtimeInsert(row: NotificationRow) {
    if (!authUserId.value || row.user_id !== authUserId.value) return;
    if (row.actor_id && useBlock().isAuthorHidden(row.actor_id)) return;
    if (notifications.value.some((n) => n.id === row.id)) return;

    unreadCount.value += 1;

    if (hasLoaded.value) {
      const enriched = await enrichActor(row);
      notifications.value = [enriched, ...notifications.value];
    }
  }

  function handleRealtimeUpdate(row: NotificationRow) {
    if (!authUserId.value || row.user_id !== authUserId.value) return;

    const index = notifications.value.findIndex((n) => n.id === row.id);
    if (index !== -1) {
      const wasUnread = !notifications.value[index].read_at;
      notifications.value[index] = {
        ...notifications.value[index],
        read_at: row.read_at,
      };
      if (wasUnread && row.read_at) {
        unreadCount.value = Math.max(0, unreadCount.value - 1);
      }
    } else if (row.read_at) {
      // Lista ainda não carregada: recalcula contagem com segurança
      refreshUnreadCount();
    }
  }

  function stopRealtime() {
    if (sharedChannel) {
      supabase.removeChannel(sharedChannel);
      sharedChannel = null;
    }
    realtimeStarted.value = false;
  }

  function startRealtime() {
    if (!import.meta.client || !authUserId.value) {
      stopRealtime();
      return;
    }
    if (realtimeStarted.value && sharedChannel) return;

    stopRealtime();
    realtimeStarted.value = true;

    const userId = authUserId.value;
    sharedChannel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          void handleRealtimeInsert(payload.new as NotificationRow);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          handleRealtimeUpdate(payload.new as NotificationRow);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const old = payload.old as { id?: string; read_at?: string | null };
          if (!old?.id) return;
          const existing = notifications.value.find((n) => n.id === old.id);
          if (!existing) {
            refreshUnreadCount();
            return;
          }
          notifications.value = notifications.value.filter((n) => n.id !== old.id);
          if (!existing.read_at) {
            unreadCount.value = Math.max(0, unreadCount.value - 1);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('Realtime de notificações falhou; usando contagem sob demanda.');
        }
      });
  }

  async function markAllRead() {
    if (!authUserId.value) return;
    try {
      const { error } = await supabase.rpc('mark_notifications_read');
      if (error) throw error;
      notifications.value = notifications.value.map((n) => ({
        ...n,
        read_at: n.read_at || new Date().toISOString(),
      }));
      unreadCount.value = 0;
    } catch (e: any) {
      console.error('Erro ao marcar notificações como lidas:', e);
    }
  }

  async function markOneRead(id: string) {
    if (!authUserId.value) return;
    const item = notifications.value.find((n) => n.id === id);
    if (!item || item.read_at) return;
    try {
      const { error } = await supabase.rpc('mark_notifications_read', {
        p_notification_ids: [id],
      });
      if (error) throw error;
      item.read_at = new Date().toISOString();
      unreadCount.value = Math.max(0, unreadCount.value - 1);
    } catch (e) {
      console.error('Erro ao marcar notificação:', e);
    }
  }

  return {
    notifications,
    unreadCount,
    isLoading,
    hasLoaded,
    notificationMessage,
    notificationLink,
    removeNotification,
    refreshUnreadCount,
    fetchNotifications,
    markAllRead,
    markOneRead,
    startRealtime,
    stopRealtime,
  };
}
