import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Search, X, Smartphone, AppWindow, AlertTriangle, Loader2 } from 'lucide-react';
import { useSearchStore } from '../store/searchStore';
import api from '../services/api';

interface Device {
  id: string;
  childName: string;
  deviceName: string;
  platform: string;
  deviceIdentifier?: string | null;
  internetBlocked?: boolean;
}

interface InstalledApp {
  id: string;
  packageName: string;
  appName: string;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt?: string;
  created_at?: string;
}

export function TopbarSearch() {
  const query = useSearchStore((state) => state.query);
  const setQuery = useSearchStore((state) => state.setQuery);
  const clear = useSearchStore((state) => state.clear);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmed = query.trim();

  const devicesQuery = useQuery<Device[]>({
    queryKey: ['devices'],
    queryFn: async () => {
      const { data } = await api.get('/devices');
      return data;
    },
  });

  const devices = devicesQuery.data ?? [];

  const deviceResults = useMemo(() => {
    if (!trimmed) return [];
    const lower = trimmed.toLowerCase();
    return devices
      .filter(
        (device) =>
          device.childName.toLowerCase().includes(lower) ||
          device.deviceName.toLowerCase().includes(lower) ||
          device.platform.toLowerCase().includes(lower) ||
          (device.deviceIdentifier ?? '').toLowerCase().includes(lower),
      )
      .slice(0, 5);
  }, [devices, trimmed]);

  const appsQueries = useQuery<{ id: string; packageName: string; appName: string; deviceId: string }[]>({
    enabled: devices.length > 0 && trimmed.length > 0,
    queryKey: ['search-apps', devices.map((d) => d.id).join(','), trimmed],
    queryFn: async () => {
      const allLists = await Promise.all(
        devices.map(async (device) => {
          try {
            const { data } = await api.get<InstalledApp[]>(`/devices/${device.id}/apps`, {
              params: { search: trimmed }
            });
            return data.map(app => ({ ...app, deviceId: device.id }));
          } catch {
            return [];
          }
        }),
      );
      return allLists.flat();
    },
  });

  const appResults = useMemo(() => {
    if (!trimmed) return [];
    const results = appsQueries.data ?? [];
    console.log('TopbarSearch - appResults:', results);
    return results;
  }, [appsQueries.data, trimmed]);

  const notificationsQueries = useQueries({
    queries: devices.map((device) => ({
      queryKey: ['search-notifications', device.id],
      queryFn: async () => {
        try {
          const { data } = await api.get<NotificationItem[]>(`/reports/${device.id}/notifications`, {
            params: { limit: 50 },
          });
          return data;
        } catch {
          return [] as NotificationItem[];
        }
      },
      enabled: Boolean(device.id),
      staleTime: 30_000,
    })),
  });

  const aggregatedNotifications = useMemo<NotificationItem[]>(() => {
    const list: NotificationItem[] = [];
    notificationsQueries.forEach((query) => {
      (query.data ?? []).forEach((row) => list.push(row));
    });
    return list
      .sort((a, b) => {
        const aDate = new Date(a.createdAt ?? a.created_at ?? 0).getTime();
        const bDate = new Date(b.createdAt ?? b.created_at ?? 0).getTime();
        return bDate - aDate;
      })
      .slice(0, 50);
  }, [notificationsQueries]);

  const alertResults = useMemo(() => {
    if (!trimmed) return [];
    const lower = trimmed.toLowerCase();
    return aggregatedNotifications
      .filter(
        (notification) =>
          notification.title.toLowerCase().includes(lower) ||
          notification.message.toLowerCase().includes(lower) ||
          notification.type.toLowerCase().includes(lower),
      )
      .slice(0, 10);
  }, [aggregatedNotifications, trimmed]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (event.key === 'Escape') {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    const mouseHandler = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', handler);
    document.addEventListener('mousedown', mouseHandler);
    return () => {
      document.removeEventListener('keydown', handler);
      document.removeEventListener('mousedown', mouseHandler);
    };
  }, []);

  const hasQuery = trimmed.length > 0;

  return (
    <div className="relative w-full max-w-xl flex-1" ref={containerRef}>
      <label className="flex h-12 items-center gap-3 rounded-full bg-white px-4 text-sm text-[#7d8b83] shadow-sm">
        <Search size={18} />
        <input
          aria-label="Buscar dispositivo, alerta ou aplicativo"
          className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#8b968f]"
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Buscar dispositivo, alerta ou aplicativo"
          ref={inputRef}
          type="search"
          value={query}
        />
        {hasQuery ? (
          <button
            aria-label="Limpar busca"
            className="grid h-7 w-7 place-items-center rounded-full bg-[#eef0ec] text-[#46574d] transition hover:bg-[#dfe6df]"
            onClick={() => {
              clear();
              inputRef.current?.focus();
            }}
            type="button"
          >
            <X size={14} />
          </button>
        ) : (
          <span className="hidden rounded-md bg-[#eef0ec] px-2 py-1 text-xs font-semibold text-[#46574d] sm:inline">
            Ctrl K
          </span>
        )}
      </label>
      {open && hasQuery ? (
        <div className="absolute left-0 right-0 top-14 z-40 max-h-[480px] overflow-y-auto rounded-2xl border border-[#e8ece8] bg-white p-3 shadow-2xl">
          {appsQueries.isLoading || devicesQuery.isLoading || notificationsQueries.some((q) => q.isLoading) ? (
            <div className="flex items-center gap-2 p-3 text-sm text-[#5c6b62]">
              <Loader2 className="animate-spin" size={16} /> Buscando em dispositivos, apps e alertas...
            </div>
          ) : (
            <div className="grid gap-3">
              {deviceResults.length === 0 && appResults.length === 0 && alertResults.length === 0 ? (
                <div className="p-6 text-center text-sm text-[#5c6b62]">
                  <p className="font-semibold text-[#06120c]">Nenhum resultado encontrado</p>
                  <p className="mt-1">Tente buscar pelo nome do filho, dispositivo, app ou palavra-chave do alerta.</p>
                </div>
              ) : null}
              {deviceResults.length > 0 ? (
                <ResultGroup icon={Smartphone} title={`Dispositivos (${deviceResults.length})`}>
                  {deviceResults.map((device) => (
                    <Link
                      className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 transition hover:bg-[#f1faf4]"
                      key={device.id}
                      onClick={() => setOpen(false)}
                      to={`/device/${device.id}`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#06120c]">
                          {device.childName || device.deviceName}
                        </p>
                        <p className="truncate text-xs text-[#7d8b83]">
                          {device.deviceName} · {device.platform}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs font-semibold text-[#10673d]">Abrir</span>
                    </Link>
                  ))}
                </ResultGroup>
              ) : null}
              {appResults.length > 0 ? (
                <ResultGroup icon={AppWindow} title={`Aplicativos (${appResults.length})`}>
                  {appResults.map((app) => (
                    <Link
                      className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 transition hover:bg-[#f1faf4]"
                      key={`${app.id}-${app.packageName}`}
                      onClick={() => setOpen(false)}
                      to={`/device/${app.deviceId}?tab=apps`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#06120c]">{app.appName}</p>
                        <p className="truncate text-xs text-[#7d8b83]">{app.packageName}</p>
                      </div>
                      <span className="rounded-full bg-[#edf4ef] px-2 py-0.5 text-[11px] font-semibold text-[#10673d]">
                        App
                      </span>
                    </Link>
                  ))}
                </ResultGroup>
              ) : null}
              {alertResults.length > 0 ? (
                <ResultGroup icon={AlertTriangle} title={`Alertas (${alertResults.length})`}>
                  {alertResults.map((alert) => (
                    <div className="flex items-start gap-3 rounded-xl px-3 py-2" key={alert.id}>
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#d97706]" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#06120c]">{alert.title}</p>
                        <p className="line-clamp-1 text-xs text-[#5c6b62]">{alert.message}</p>
                      </div>
                    </div>
                  ))}
                </ResultGroup>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

interface ResultGroupProps {
  icon: React.ComponentType<any>;
  title: string;
  children: React.ReactNode;
}

function ResultGroup({ icon: Icon, title, children }: ResultGroupProps) {
  return (
    <section>
      <p className="flex items-center gap-2 px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-[#7d8b83]">
        <Icon size={14} /> {title}
      </p>
      <div className="grid gap-1">{children}</div>
    </section>
  );
}
