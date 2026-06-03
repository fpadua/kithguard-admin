import { useEffect, useMemo, useRef, useState } from 'react';
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, Inbox as InboxIcon, Loader2 } from 'lucide-react';
import { useInboxStore, type NotificationItem, type NotificationType } from '../store/inboxStore';
import api from '../services/api';

interface Device {
  id: string;
  childName: string;
  deviceName: string;
}

interface ApiNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt?: string;
  created_at?: string;
}

const ALLOWED_TYPES: NotificationType[] = ['geofence', 'app', 'internet', 'pairing', 'system'];

function normalizeType(value: string): NotificationType {
  return (ALLOWED_TYPES as string[]).includes(value) ? (value as NotificationType) : 'system';
}

function timeAgo(value: string) {
  const seconds = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
  if (Number.isNaN(seconds) || seconds < 0) return '';
  if (seconds < 60) return 'agora há pouco';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  return `há ${days} d`;
}

const notificationTypeStyles: Record<NotificationType, { dot: string; label: string }> = {
  geofence: { dot: 'bg-[#10673d]', label: 'Geofence' },
  app: { dot: 'bg-[#d97706]', label: 'Apps' },
  internet: { dot: 'bg-[#2563eb]', label: 'Internet' },
  pairing: { dot: 'bg-[#7c3aed]', label: 'Pareamento' },
  system: { dot: 'bg-[#475569]', label: 'Sistema' },
};

export function TopbarInbox() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastSyncedSignature = useRef<string>('');
  const queryClient = useQueryClient();

  const setNotifications = useInboxStore((state) => state.setNotifications);
  const markNotificationRead = useInboxStore((state) => state.markNotificationRead);
  const markAllNotificationsRead = useInboxStore((state) => state.markAllNotificationsRead);

  const devicesQuery = useQuery<Device[]>({
    queryKey: ['devices'],
    queryFn: async () => {
      const { data } = await api.get<Device[]>('/devices');
      return data;
    },
    staleTime: 60_000,
  });

  const devices = devicesQuery.data ?? [];

  const notificationsQueries = useQueries({
    queries: devices.map((device) => ({
      queryKey: ['inbox-notifications', device.id],
      queryFn: async () => {
        const { data } = await api.get<ApiNotification[]>(`/reports/${device.id}/notifications`, {
          params: { limit: 50 },
        });
        return data;
      },
      enabled: Boolean(device.id),
      staleTime: 30_000,
    })),
  });

  const isLoading =
    devicesQuery.isLoading || notificationsQueries.some((query) => query.isLoading);

  const aggregated = useMemo<NotificationItem[]>(() => {
    const list: NotificationItem[] = [];
    notificationsQueries.forEach((query, index) => {
      const device = devices[index];
      (query.data ?? []).forEach((row) => {
        const createdAt = row.createdAt ?? row.created_at ?? new Date().toISOString();
        list.push({
          id: row.id,
          deviceId: device.id,
          deviceName: device.childName || device.deviceName || 'Dispositivo',
          title: row.title,
          message: row.message,
          type: normalizeType(row.type),
          createdAt,
          read: Boolean(row.read),
        });
      });
    });
    return list
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 50);
  }, [notificationsQueries, devices]);

  useEffect(() => {
    const signature = aggregated
      .map((n) => `${n.id}:${n.read ? 1 : 0}:${n.createdAt}`)
      .join('|');
    if (signature !== lastSyncedSignature.current) {
      lastSyncedSignature.current = signature;
      setNotifications(aggregated);
    }
  }, [aggregated, setNotifications]);

  const unreadNotifications = aggregated.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const escHandler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', escHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', escHandler);
    };
  }, [open]);

  const handleRefresh = () => {
    notificationsQueries.forEach((query) => query.refetch());
    devicesQuery.refetch();
  };

  const handleMarkAll = async () => {
    const unreadIds = aggregated.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    try {
      await markAllNotificationsRead(unreadIds);
      queryClient.invalidateQueries({ queryKey: ['inbox-notifications'] });
    } catch {
      // estado já revertido pelo store
    }
  };

  return (
    <div className="relative flex items-center gap-3" ref={containerRef}>
      <button
        aria-label="Notificações"
        className="relative grid h-12 w-12 place-items-center rounded-full bg-white text-[#10673d] shadow-sm transition hover:text-[#0d5532]"
        onClick={() => setOpen(true)}
        type="button"
      >
        <Bell size={20} />
        {unreadNotifications > 0 ? (
          <span className="absolute right-2 top-2 grid h-5 min-w-[20px] place-items-center rounded-full bg-[#d97706] px-1 text-[10px] font-bold text-white">
            {unreadNotifications}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 top-14 z-40 w-[360px] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-[#e8ece8] bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#e8ece8] bg-[#f7f7f4] px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-[#7d8b83]">Caixa de entrada</p>
              <p className="text-sm font-bold text-[#06120c]">Notificações</p>
            </div>
            {unreadNotifications > 0 ? (
              <span className="rounded-full bg-[#10673d] px-2 py-0.5 text-[11px] font-bold text-white">
                {unreadNotifications} novas
              </span>
            ) : null}
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center gap-2 p-6 text-sm text-[#5c6b62]">
                <Loader2 className="animate-spin" size={16} /> Carregando notificações...
              </div>
            ) : aggregated.length === 0 ? (
              <EmptyInbox
                icon={<InboxIcon size={20} />}
                title="Nenhuma notificação por aqui."
                hint="Novos alertas dos dispositivos aparecerão aqui assim que chegarem."
              />
            ) : (
              <ul className="divide-y divide-[#eef0ec]">
                {aggregated.map((notification) => {
                  const type = notificationTypeStyles[notification.type];
                  return (
                    <li
                      className={`flex items-start gap-3 p-4 transition hover:bg-[#f7f7f4] ${
                        notification.read ? 'bg-white' : 'bg-[#f1faf4]'
                      }`}
                      key={notification.id}
                    >
                      <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${type.dot}`} />
                      <button
                        className="min-w-0 flex-1 text-left disabled:cursor-default"
                        disabled={notification.read}
                        onClick={() => {
                          if (notification.read) return;
                          markNotificationRead(notification.id)
                            .then(() => {
                              queryClient.invalidateQueries({ queryKey: ['inbox-notifications'] });
                            })
                            .catch(() => undefined);
                        }}
                        type="button"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-[#06120c]">{notification.title}</p>
                          <span className="shrink-0 text-[11px] text-[#7d8b83]">{timeAgo(notification.createdAt)}</span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm text-[#5c6b62]">{notification.message}</p>
                        <p className="mt-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-[#7d8b83]">
                          <span>{type.label}</span>
                          <span className="text-[#cad4ca]">·</span>
                          <span className="truncate normal-case text-[#5c6b62]">{notification.deviceName}</span>
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-[#e8ece8] bg-[#f7f7f4] p-2">
            <button
              className="flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[#10673d] transition hover:bg-white disabled:opacity-50"
              disabled={unreadNotifications === 0}
              onClick={handleMarkAll}
              type="button"
            >
              <Check size={16} /> Marcar todas como lidas
            </button>
            <button
              className="rounded-xl px-3 py-2 text-sm font-semibold text-[#5c6b62] transition hover:bg-white"
              onClick={handleRefresh}
              type="button"
            >
              Atualizar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function EmptyInbox({
  icon,
  title,
  hint,
}: {
  icon?: React.ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 p-8 text-center">
      {icon ? <span className="grid h-10 w-10 place-items-center rounded-full bg-[#f1faf4] text-[#10673d]">{icon}</span> : null}
      <p className="text-sm font-semibold text-[#06120c]">{title}</p>
      <p className="text-xs text-[#7d8b83]">{hint}</p>
    </div>
  );
}
