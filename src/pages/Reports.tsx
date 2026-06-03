import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueries, useQuery } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Calendar,
  Clock,
  Download,
  Globe,
  Loader2,
  ShieldCheck,
  Smartphone,
  TrendingUp,
} from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import api from '../services/api';

interface Device {
  id: string;
  childName: string;
  deviceName: string;
  platform: string;
  deviceIdentifier?: string | null;
  internetBlocked?: boolean;
  createdAt?: string;
}

interface AppUsageRow {
  packageName?: string;
  package_name?: string;
  appName?: string;
  app_name?: string;
  totalDurationSeconds?: number | string;
  total_duration_seconds?: number | string;
}

interface DailyUsageRow {
  usageDate?: string;
  usage_date?: string;
  totalDurationSeconds?: number | string;
  total_duration_seconds?: number | string;
}

interface NotificationRow {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt?: string;
  created_at?: string;
}

interface BrowserEntry {
  id: string;
  url: string;
  title?: string | null;
  visitedAt?: string;
  visited_at?: string;
}

function secondsToHours(value: number | string | undefined) {
  const seconds = Number(value ?? 0);
  if (seconds < 60) return `${seconds}s`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return hours ? `${hours}h ${minutes}min` : `${minutes}min`;
}

function formatDate(value?: string) {
  if (!value) return 'Sem registro';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(value));
}

type RangeKey = '7d' | '14d' | '30d';

const ranges: Array<{ id: RangeKey; label: string; days: number }> = [
  { id: '7d', label: '7 dias', days: 7 },
  { id: '14d', label: '14 dias', days: 14 },
  { id: '30d', label: '30 dias', days: 30 },
];

export function Reports() {
  const [range, setRange] = useState<RangeKey>('7d');
  const [appType, setAppType] = useState<'all' | 'system' | 'user'>('all');

  const devicesQuery = useQuery<Device[]>({
    queryKey: ['devices'],
    queryFn: async () => {
      const { data } = await api.get('/devices');
      return data;
    },
  });

  const devices = useMemo(() => devicesQuery.data ?? [], [devicesQuery.data]);
  const days = useMemo(() => ranges.find((item) => item.id === range)?.days ?? 7, [range]);

  const dailyUsageQueries = useQueries({
    queries: devices.map((device) => ({
      queryKey: ['daily-usage', device.id, days],
      queryFn: async () => {
        const { data } = await api.get<DailyUsageRow[]>(`/reports/${device.id}/daily-usage`, {
          params: { days },
        });
        return data;
      },
    })),
  });

  const appUsageQueries = useQueries({
    queries: devices.map((device) => ({
      queryKey: ['app-usage', device.id],
      queryFn: async () => {
        const { data } = await api.get<AppUsageRow[]>(`/reports/${device.id}/app-usage`);
        return data;
      },
    })),
  });

  const notificationsQueries = useQueries({
    queries: devices.map((device) => ({
      queryKey: ['reports-notifications', device.id, days],
      queryFn: async () => {
        const { data } = await api.get<NotificationRow[]>(`/reports/${device.id}/notifications`, {
          params: { limit: 50 },
        });
        return data;
      },
    })),
  });

  const historyQueries = useQueries({
    queries: devices.map((device) => ({
      queryKey: ['reports-history', device.id],
      queryFn: async () => {
        const { data } = await api.get<BrowserEntry[]>(`/devices/${device.id}/browser-history`);
        return data;
      },
    })),
  });

  const aggregatedDaily = useMemo(() => {
    const map = new Map<string, number>();
    dailyUsageQueries.forEach((query) => {
      (query.data ?? []).forEach((row) => {
        const label = String(row.usageDate ?? row.usage_date ?? '').slice(0, 10);
        if (!label) return;
        const seconds = Number(row.totalDurationSeconds ?? row.total_duration_seconds ?? 0);
        map.set(label, (map.get(label) ?? 0) + seconds);
      });
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, seconds]) => ({ date, seconds }));
  }, [dailyUsageQueries]);

  const maxDailySeconds = Math.max(1, ...aggregatedDaily.map((row) => row.seconds));

  const topApps = useMemo(() => {
    const map = new Map<string, { name: string; package: string; seconds: number; isSystem: boolean }>();
    appUsageQueries.forEach((query) => {
      (query.data ?? []).forEach((row) => {
        // Assuming the backend might need adjustments to include isSystem in the report response,
        // for now, we infer based on common package name patterns if not provided,
        // or just assume not system if not explicitly available.
        const pkg = String(row.packageName ?? row.package_name ?? '');
        const name = String(row.appName ?? row.app_name ?? row.packageName ?? row.package_name ?? '');
        const seconds = Number(row.totalDurationSeconds ?? row.total_duration_seconds ?? 0);
        const isSystem = pkg.startsWith('com.android.') || pkg.startsWith('android.');

        if (appType === 'system' && !isSystem) return;
        if (appType === 'user' && isSystem) return;

        const current = map.get(pkg);
        if (current) {
          current.seconds += seconds;
        } else {
          map.set(pkg, { name, package: pkg, seconds, isSystem });
        }
      });
    });
    return Array.from(map.values())
      .sort((a, b) => b.seconds - a.seconds)
      .slice(0, 5);
  }, [appUsageQueries, appType]);

  const aggregatedNotifications = useMemo(() => {
    const list: Array<NotificationRow & { deviceName: string }> = [];
    notificationsQueries.forEach((query, index) => {
      const device = devices[index];
      (query.data ?? []).forEach((row) => {
        list.push({ ...row, deviceName: device?.childName ?? device?.deviceName ?? 'Dispositivo' });
      });
    });
    return list
      .sort((a, b) => {
        const aDate = new Date(a.createdAt ?? a.created_at ?? 0).getTime();
        const bDate = new Date(b.createdAt ?? b.created_at ?? 0).getTime();
        return bDate - aDate;
      })
      .slice(0, 8);
  }, [notificationsQueries, devices]);

  const topSites = useMemo(() => {
    const map = new Map<string, { url: string; count: number }>();
      historyQueries.forEach((query) => {
      (query.data ?? []).forEach((row) => {
        try {
          const host = new URL(row.url).host || row.url;
          const current = map.get(host);
          if (current) {
            current.count += 1;
          } else {
            map.set(host, { url: host, count: 1 });
          }
        } catch {
          const current = map.get(row.url);
          if (current) current.count += 1;
          else map.set(row.url, { url: row.url, count: 1 });
        }
      });
    });
    return Array.from(map.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [historyQueries]);

  const totalScreenTime = useMemo(() => {
    return aggregatedDaily.reduce((sum, row) => sum + row.seconds, 0);
  }, [aggregatedDaily]);

  const isLoading =
    devicesQuery.isLoading ||
    dailyUsageQueries.some((q) => q.isLoading) ||
    appUsageQueries.some((q) => q.isLoading) ||
    notificationsQueries.some((q) => q.isLoading);

  const handleExport = () => {
    const payload = {
      generatedAt: new Date().toISOString(),
      range,
      devices: devices.length,
      totalScreenTime,
      topApps,
      topSites,
      notifications: aggregatedNotifications,
      daily: aggregatedDaily,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kithguard-relatorio-${range}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="grid gap-5">
        <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#6c7a71]">Central de relatórios</p>
            <h1 className="mt-1 text-4xl font-bold text-[#06120c]">Relatórios</h1>
            <p className="mt-2 max-w-2xl text-[#7d8b83]">
              Indicadores consolidados de todos os dispositivos da sua conta. Tempo de tela, apps mais
              utilizados, sites acessados e alertas recentes.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              className="h-10 rounded-full border border-[#dfe6df] bg-white px-4 text-sm text-[#06120c] outline-none"
              onChange={(e) => setAppType(e.target.value as 'all' | 'system' | 'user')}
              value={appType}
            >
              <option value="all">Todos os tipos</option>
              <option value="user">Aplicativos de usuário</option>
              <option value="system">Aplicativos de sistema</option>
            </select>
            <div className="flex items-center gap-2 rounded-full bg-white p-1 shadow-sm">
              {ranges.map((option) => (
                <button
                  className={`h-10 rounded-full px-4 text-sm font-semibold transition ${
                    range === option.id ? 'bg-[#10673d] text-white' : 'text-[#5c6b62] hover:bg-[#f1faf4]'
                  }`}
                  key={option.id}
                  onClick={() => setRange(option.id)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button
              className="flex h-12 items-center gap-2 rounded-full border border-[#0d3f29] bg-white px-5 text-sm font-semibold text-[#0d3f29] transition hover:bg-[#f1faf4]"
              onClick={handleExport}
              type="button"
            >
              <Download size={16} /> Exportar JSON
            </button>
          </div>
        </header>

        {isLoading ? (
          <div className="flex items-center gap-2 rounded-2xl bg-white p-6 text-sm text-[#5c6b62] shadow-sm">
            <Loader2 className="animate-spin" size={16} /> Carregando dados agregados dos dispositivos...
          </div>
        ) : null}

        <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Clock}
            label="Tempo total de tela"
            value={secondsToHours(totalScreenTime)}
            hint={`Período de ${days} dias`}
            tone="success"
          />
          <StatCard
            icon={Smartphone}
            label="Dispositivos monitorados"
            value={devices.length}
            hint="Incluem pareados e pendentes"
          />
          <StatCard
            icon={Activity}
            label="Apps no ranking"
            value={topApps.length}
            hint="Apps únicos com uso registrado"
          />
          <StatCard
            icon={AlertTriangle}
            label="Alertas no período"
            value={aggregatedNotifications.length}
            hint="Considerando os 50 mais recentes"
            tone="warning"
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
          <article className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-bold text-[#06120c]">
                  <BarChart3 size={18} className="text-[#10673d]" /> Uso diário agregado
                </h2>
                <p className="text-sm text-[#7d8b83]">Soma do tempo de tela em todos os dispositivos.</p>
              </div>
              <span className="rounded-full bg-[#edf4ef] px-3 py-1 text-xs font-semibold text-[#10673d]">
                {aggregatedDaily.length} dias
              </span>
            </div>
            <div className="flex h-56 items-end gap-2">
              {aggregatedDaily.length === 0 ? (
                <div className="grid h-full flex-1 place-items-center text-sm text-[#7d8b83]">
                  Aguardando dados de uso para o período selecionado.
                </div>
              ) : (
                aggregatedDaily.map((row) => (
                  <div className="flex flex-1 flex-col items-center gap-2" key={row.date}>
                    <div
                      className="w-full rounded-t-xl bg-[#10673d] transition-all"
                      style={{ height: `${Math.max(8, (row.seconds / maxDailySeconds) * 180)}px` }}
                    />
                    <span className="text-[11px] text-[#7d8b83]">{formatDate(row.date)}</span>
                    <span className="text-[10px] font-semibold text-[#10673d]">{secondsToHours(row.seconds)}</span>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-bold text-[#06120c]">
                  <TrendingUp size={18} className="text-[#10673d]" /> Top apps
                </h2>
                <p className="text-sm text-[#7d8b83]">Apps com maior tempo de uso somando todos os filhos.</p>
              </div>
            </div>
            <ul className="grid gap-3">
              {topApps.length === 0 ? (
                <li className="rounded-xl border border-dashed border-[#cad4ca] p-6 text-center text-sm text-[#7d8b83]">
                  Sem dados de uso de app ainda.
                </li>
              ) : (
                topApps.map((app, index) => {
                  const max = topApps[0]?.seconds ?? 1;
                  return (
                    <li key={app.name + index} className="grid gap-1">
                      <div className="flex flex-col text-sm font-semibold text-[#06120c]">
                        <span className="truncate">{app.name} ({app.package})</span>
                        <span className="text-[#10673d]">{secondsToHours(app.seconds)}</span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-[#eef0ec]">
                        <div
                          className="h-full rounded-full bg-[#10673d]"
                          style={{ width: `${Math.max(6, (app.seconds / max) * 100)}%` }}
                        />
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
          </article>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <article className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-bold text-[#06120c]">
                <Globe size={18} className="text-[#10673d]" /> Sites mais acessados
              </h2>
              <span className="text-xs font-semibold text-[#7d8b83]">Por domínio</span>
            </div>
            {topSites.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[#cad4ca] p-6 text-center text-sm text-[#7d8b83]">
                Nenhum site registrado no histórico.
              </p>
            ) : (
              <ul className="grid gap-2">
                {topSites.map((site) => (
                  <li
                    className="flex items-center justify-between rounded-xl bg-[#f7f7f4] px-4 py-3"
                    key={site.url}
                  >
                    <span className="truncate text-sm font-semibold text-[#06120c]">{site.url}</span>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#10673d]">
                      {site.count} visitas
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-bold text-[#06120c]">
                <AlertTriangle size={18} className="text-[#d97706]" /> Alertas recentes
              </h2>
              <Link className="text-sm font-semibold text-[#10673d]" to="/">
                Ver todos
              </Link>
            </div>
            <ul className="grid gap-2">
              {aggregatedNotifications.length === 0 ? (
                <li className="rounded-xl border border-dashed border-[#cad4ca] p-6 text-center text-sm text-[#7d8b83]">
                  Nenhum alerta no período selecionado.
                </li>
              ) : (
                aggregatedNotifications.map((notification) => (
                  <li className="rounded-xl border border-[#e8ece8] p-3" key={notification.id}>
                    <p className="flex items-center justify-between text-sm font-semibold text-[#06120c]">
                      <span className="truncate">{notification.title}</span>
                      <span className="text-xs text-[#7d8b83]">
                        {formatDate(notification.createdAt ?? notification.created_at)}
                      </span>
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-[#5c6b62]">{notification.message}</p>
                    <p className="mt-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-[#7d8b83]">
                      <ShieldCheck size={12} className="text-[#10673d]" /> {notification.deviceName} ·{' '}
                      {notification.type}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </article>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold text-[#06120c]">
              <Calendar size={18} className="text-[#10673d]" /> Resumo por dispositivo
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs font-semibold uppercase tracking-wide text-[#7d8b83]">
                <tr className="border-b border-[#e8ece8]">
                  <th className="py-3">Dispositivo</th>
                  <th className="py-3">Plataforma</th>
                  <th className="py-3">Pareado</th>
                  <th className="py-3">Internet</th>
                  <th className="py-3">Alertas</th>
                  <th className="py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {devices.length === 0 ? (
                  <tr>
                    <td className="py-6 text-center text-sm text-[#7d8b83]" colSpan={6}>
                      Nenhum dispositivo cadastrado.
                    </td>
                  </tr>
                ) : (
                  devices.map((device) => {
                    const alerts = notificationsQueries[devices.indexOf(device)]?.data?.length ?? 0;
                    return (
                      <tr className="border-b border-[#eef0ec] last:border-b-0" key={device.id}>
                        <td className="py-3">
                          <p className="font-semibold text-[#06120c]">{device.childName || device.deviceName}</p>
                          <p className="text-xs text-[#7d8b83]">{device.deviceName}</p>
                        </td>
                        <td className="py-3 capitalize text-[#5c6b62]">{device.platform}</td>
                        <td className="py-3 text-[#5c6b62]">{device.deviceIdentifier ? 'Sim' : 'Pendente'}</td>
                        <td className="py-3 text-[#5c6b62]">{device.internetBlocked ? 'Bloqueada' : 'Liberada'}</td>
                        <td className="py-3 text-[#5c6b62]">{alerts}</td>
                        <td className="py-3 text-right">
                          <Link
                            className="inline-flex items-center gap-1 rounded-full bg-[#10673d] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#0d5532]"
                            to={`/device/${device.id}`}
                          >
                            Detalhes
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = 'default',
}: {
  icon: typeof Clock;
  label: string;
  value: number | string;
  hint: string;
  tone?: 'default' | 'success' | 'warning';
}) {
  return (
    <div
      className={`rounded-2xl p-5 shadow-sm ${
        tone === 'success' ? 'bg-[#10673d] text-white' : tone === 'warning' ? 'bg-[#fff8eb] text-[#a45306]' : 'bg-white text-[#06120c]'
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="font-semibold">{label}</p>
        <span
          className={`grid h-10 w-10 place-items-center rounded-full ${
            tone === 'default'
              ? 'bg-[#f1faf4] text-[#10673d]'
              : tone === 'success'
                ? 'bg-white/20 text-white'
                : 'bg-white text-[#d97706]'
          }`}
        >
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-5 text-4xl font-bold">{value}</p>
      <p className={`mt-2 text-sm ${tone === 'default' ? 'text-[#7d8b83]' : 'text-white/80'}`}>{hint}</p>
    </div>
  );
}
