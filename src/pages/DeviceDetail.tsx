import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  AppWindow,
  Bell,
  Check,
  CheckCircle2,
  Globe,
  Loader2,
  MapPin,
  Pencil,
  RadioTower,
  Trash2,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import api from '../services/api';
import { DashboardLayout } from '../components/DashboardLayout';

interface Device {
  id: string;
  childName: string;
  deviceName: string;
  platform: string;
  deviceIdentifier?: string | null;
  internetBlocked?: boolean;
  createdAt?: string;
  parentEmail?: string | null;
  parentName?: string | null;
}

interface InstalledApp {
  id: string;
  packageName: string;
  appName: string;
  isSystem?: boolean;
  updatedAt?: string;
}

interface LocationRow {
  id: string;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  createdAt?: string;
  timestamp?: string;
  capturedAt?: string;
}

interface BrowserEntry {
  id: string;
  url: string;
  title?: string | null;
  visitedAt?: string;
  visited_at?: string;
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
  created_at?: string;
  createdAt?: string;
}

interface InternetAccess {
  blocked: boolean;
}

interface GeofenceDraft {
  id: string;
  name: string;
  latitude: string;
  longitude: string;
  radius: string;
  eventType: 'entry' | 'exit' | 'both';
}

const tabs = [
  { id: 'location', label: 'Localização' },
  { id: 'apps', label: 'Apps' },
  { id: 'internet', label: 'Internet' },
  { id: 'history', label: 'Histórico' },
  { id: 'geofence', label: 'Geofence' },
  { id: 'reports', label: 'Relatórios' },
  { id: 'notifications', label: 'Alertas' },
] as const;

type TabId = (typeof tabs)[number]['id'];

function formatDate(value?: string | null) {
  if (!value) return 'Sem registro';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function secondsToHours(value: number | string | undefined) {
  const seconds = Number(value ?? 0);
  if (seconds < 60) return `${seconds}s`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return hours ? `${hours}h ${minutes}min` : `${minutes}min`;
}

function geofenceStorageKey(deviceId: string) {
  return `kithguard-geofences-${deviceId}`;
}

import { useSearchStore } from '../store/searchStore';
// ...
export function DeviceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>((searchParams.get('tab') as TabId) || 'location');
  const [historySearch, setHistorySearch] = useState('');
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  
  const globalAppSearch = useSearchStore((state) => state.query);
  const deferredAppSearch = useDeferredValue(globalAppSearch);
  
  const [appStatus, setAppStatus] = useState<'all' | 'blocked' | 'unblocked'>('all');
  const [appSystemFilter, setAppSystemFilter] = useState<'all' | 'system' | 'user'>('all');
  const [geofenceForm, setGeofenceForm] = useState<Omit<GeofenceDraft, 'id'>>({
    name: '',
    latitude: '',
    longitude: '',
    radius: '250',
    eventType: 'both',
  });
  const [geofences, setGeofences] = useState<GeofenceDraft[]>(() => {
    if (!id) return [];
    return JSON.parse(localStorage.getItem(geofenceStorageKey(id)) || '[]') as GeofenceDraft[];
  });
  const [isEditingDeviceName, setIsEditingDeviceName] = useState(false);
  const [editedDeviceName, setEditedDeviceName] = useState('');
  const deviceNameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (id) localStorage.setItem(geofenceStorageKey(id), JSON.stringify(geofences));
  }, [geofences, id]);

  const devicesQuery = useQuery<Device[]>({
    queryKey: ['devices'],
    queryFn: async () => {
      const { data } = await api.get('/devices');
      return data;
    },
  });

  const device = devicesQuery.data?.find((item) => item.id === id);

  const [limit, setLimit] = useState(20);
  const [page, setPage] = useState(1);

  const appsQuery = useQuery<{ apps: InstalledApp[]; total: number }>({
    enabled: Boolean(id),
    queryKey: ['device-apps', id, deferredAppSearch, appSystemFilter, limit, page],
    queryFn: async () => {
      const params: Record<string, string | number | boolean> = { 
        limit,
        offset: (page - 1) * limit
      };
      if (deferredAppSearch) params.search = deferredAppSearch;
      if (appSystemFilter === 'system') params.isSystem = true;
      if (appSystemFilter === 'user') params.isSystem = false;
      const { data } = await api.get(`/devices/${id}/apps`, { params });
      return data;
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const apps = appsQuery.data?.apps ?? [];
  const totalApps = appsQuery.data?.total ?? 0;
  const totalPages = Math.ceil(totalApps / limit);

  const blockedAppsQuery = useQuery<string[]>({
    enabled: Boolean(id),
    queryKey: ['blocked-apps', id],
    queryFn: async () => {
      const { data } = await api.get(`/devices/${id}/blocked-apps`);
      return data;
    },
  });

  const internetQuery = useQuery<InternetAccess>({
    enabled: Boolean(id),
    queryKey: ['internet-access', id],
    queryFn: async () => {
      const { data } = await api.get(`/devices/${id}/internet-access`);
      return data;
    },
  });

  const locationsQuery = useQuery<LocationRow[]>({
    enabled: Boolean(id),
    queryKey: ['locations', id],
    queryFn: async () => {
      const { data } = await api.get(`/locations/${id}`, { params: { limit: 25 } });
      return data;
    },
  });

  const historyQuery = useQuery<BrowserEntry[]>({
    enabled: Boolean(id),
    queryKey: ['browser-history', id, historySearch, historyStartDate, historyEndDate],
    queryFn: async () => {
      const { data } = await api.get(`/devices/${id}/browser-history`, {
        params: {
          search: historySearch || undefined,
          startDate: historyStartDate || undefined,
          endDate: historyEndDate || undefined,
        },
      });
      return data;
    },
  });

  const appUsageQuery = useQuery<AppUsageRow[]>({
    enabled: Boolean(id),
    queryKey: ['app-usage', id],
    queryFn: async () => {
      const { data } = await api.get(`/reports/${id}/app-usage`);
      return data;
    },
  });

  const currentAppQuery = useQuery<{
    packageName: string;
    appName: string;
    isSystem: boolean;
    updatedAt: string;
    isStale: boolean;
  } | null>({
    enabled: Boolean(id),
    queryKey: ['current-app', id],
    queryFn: async () => {
      const { data } = await api.get(`/reports/${id}/current-app`);
      return data;
    },
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  });

  const dailyUsageQuery = useQuery<DailyUsageRow[]>({
    enabled: Boolean(id),
    queryKey: ['daily-usage', id],
    queryFn: async () => {
      const { data } = await api.get(`/reports/${id}/daily-usage`, { params: { days: 7 } });
      return data;
    },
  });

  const notificationsQuery = useQuery<NotificationRow[]>({
    enabled: Boolean(id),
    queryKey: ['notifications', id, unreadOnly],
    queryFn: async () => {
      const { data } = await api.get(`/reports/${id}/notifications`, { params: { unreadOnly, limit: 50 } });
      return data;
    },
  });

  const blockAppMutation = useMutation({
    mutationFn: async ({ packageName, blocked }: { packageName: string; blocked: boolean }) => {
      await api.post(`/devices/${id}/apps/${encodeURIComponent(packageName)}/block`, { blocked });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocked-apps', id] });
    },
  });

  const internetMutation = useMutation({
    mutationFn: async (blocked: boolean) => {
      await api.post(`/devices/${id}/internet-access`, { blocked });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internet-access', id] });
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });

  const readNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await api.put(`/reports/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', id] });
    },
  });

  const deleteDeviceMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/devices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      navigate('/');
    },
  });

  const renameDeviceMutation = useMutation({
    mutationFn: async (deviceName: string) => {
      await api.patch(`/devices/${id}`, { deviceName });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      setIsEditingDeviceName(false);
    },
  });

  useEffect(() => {
    if (isEditingDeviceName) {
      deviceNameInputRef.current?.focus();
      deviceNameInputRef.current?.select();
    }
  }, [isEditingDeviceName]);

  // Resync mutation must be declared before the auto-trigger useEffect below.
  const resyncAppsMutation = useMutation({
    mutationFn: async () => {
      await api.post(`/devices/${id}/apps/resync`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['device-apps', id] });
    },
  });

  // Auto-trigger a one-time resync when the apps data shows all rows as isSystem=false
  // (signal of legacy data that pre-dates the is_system column). Guarded so it only
  // fires once per deviceId per session, and only when the device is actually paired.
  const hasTriggeredResyncRef = useRef<string | null>(null);
  useEffect(() => {
    if (!id) return;
    if (hasTriggeredResyncRef.current === id) return;
    if (appsQuery.isLoading) return;
    if (appsQuery.data === undefined) return;
    if (appsQuery.data.apps.length === 0) return;
    const allLegacy = appsQuery.data.apps.every((app: InstalledApp) => app.isSystem === false);
    if (!allLegacy) {
      hasTriggeredResyncRef.current = id;
      return;
    }
    hasTriggeredResyncRef.current = id;
    console.info(`[DeviceDetail] legacy apps data detected for ${id}; requesting resync`);
    resyncAppsMutation.mutate();
  }, [id, appsQuery.isLoading, appsQuery.data, resyncAppsMutation]);

  const startEditingDeviceName = () => {
    setEditedDeviceName(device?.deviceName ?? '');
    setIsEditingDeviceName(true);
  };

  const cancelEditingDeviceName = () => {
    setIsEditingDeviceName(false);
    setEditedDeviceName('');
  };

  const submitDeviceName = () => {
    const next = editedDeviceName.trim();
    if (!next || next === device?.deviceName) {
      cancelEditingDeviceName();
      return;
    }
    renameDeviceMutation.mutate(next);
  };

  const forceCloseMutation = useMutation({
    mutationFn: async (packageName: string) => {
      await api.post(`/devices/${id}/force-close`, { packageName });
    },
  });

  const blockedApps = blockedAppsQuery.data ?? [];

  const filteredApps = useMemo(() => {
    if (appStatus === 'all') return apps;
    const blockedSet = new Set(blockedApps);
    return apps.filter((app) => {
      const isBlocked = blockedSet.has(app.packageName);
      if (appStatus === 'blocked') return isBlocked;
      return !isBlocked;
    });
  }, [apps, appStatus, blockedApps]);

  const hasActiveAppFilter =
    globalAppSearch.trim().length > 0 || appStatus !== 'all' || appSystemFilter !== 'all';
  const latestLocation = locationsQuery.data?.[0];
  const maxDailySeconds = Math.max(
    1,
    ...(dailyUsageQuery.data ?? []).map((row) => Number(row.totalDurationSeconds ?? row.total_duration_seconds ?? 0)),
  );

  const appUsageTotal = useMemo(() => {
    return (appUsageQuery.data ?? []).reduce((sum, row) => sum + Number(row.totalDurationSeconds ?? row.total_duration_seconds ?? 0), 0);
  }, [appUsageQuery.data]);

  if (!id) {
    return <DashboardLayout><EmptyState title="Dispositivo inválido" text="Volte ao dashboard e escolha um dispositivo." /></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <Link className="inline-flex items-center gap-1 text-sm font-semibold text-[#10673d]" to="/">
              ← Voltar ao dashboard
            </Link>
            <h1 className="mt-2 text-4xl font-bold text-[#06120c]">{device?.childName ?? 'Dispositivo'}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[#7d8b83]">
              {isEditingDeviceName ? (
                <span className="inline-flex items-center gap-1">
                  <input
                    className="h-9 rounded-lg border border-[#10673d] bg-white px-2 text-sm text-[#06120c] outline-none focus:ring-2 focus:ring-[#10673d]/30"
                    maxLength={120}
                    onChange={(event) => setEditedDeviceName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        submitDeviceName();
                      } else if (event.key === 'Escape') {
                        event.preventDefault();
                        cancelEditingDeviceName();
                      }
                    }}
                    ref={deviceNameInputRef}
                    type="text"
                    value={editedDeviceName}
                  />
                  <button
                    aria-label="Salvar nome"
                    className="grid h-9 w-9 place-items-center rounded-full bg-[#10673d] text-white transition hover:bg-[#0d5632] disabled:opacity-50"
                    disabled={renameDeviceMutation.isPending}
                    onClick={submitDeviceName}
                    type="button"
                  >
                    {renameDeviceMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                  </button>
                  <button
                    aria-label="Cancelar edição"
                    className="grid h-9 w-9 place-items-center rounded-full border border-[#dfe6df] bg-white text-[#48574d] transition hover:bg-[#f1faf4]"
                    onClick={cancelEditingDeviceName}
                    type="button"
                  >
                    <X size={16} />
                  </button>
                </span>
              ) : (
                <button
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-sm font-medium text-[#06120c] transition hover:bg-[#f1faf4]"
                  onClick={startEditingDeviceName}
                  type="button"
                >
                  {device?.deviceName ?? id}
                  <Pencil size={12} className="text-[#7d8b83]" />
                </button>
              )}
              <span>· {device?.platform ?? 'android'}</span>
              <span>· {device?.deviceIdentifier ? 'pareado' : 'aguardando pareamento'}</span>
            </div>
            <p className="mt-1 text-sm text-[#7d8b83]">
              Responsável:{' '}
              <span className="font-medium text-[#06120c]">
                {device?.parentName || device?.parentEmail || '—'}
              </span>
              {device?.parentName && device?.parentEmail ? (
                <span className="text-[#7d8b83]"> · {device.parentEmail}</span>
              ) : null}
            </p>
            {renameDeviceMutation.isError ? (
              <p className="mt-1 text-sm text-red-600">Não foi possível atualizar o nome.</p>
            ) : null}
          </div>
          <button
            className="flex h-11 items-center gap-2 rounded-full border border-red-200 bg-white px-5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
            disabled={deleteDeviceMutation.isPending}
            onClick={() => deleteDeviceMutation.mutate()}
            type="button"
          >
            {deleteDeviceMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
            Revogar dispositivo
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              className={`h-11 shrink-0 rounded-full px-4 text-sm font-semibold ${
                activeTab === tab.id ? 'bg-[#10673d] text-white' : 'bg-white text-[#66746b]'
              }`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        {devicesQuery.isError ? (
          <Panel>
            <EmptyState title="Não foi possível carregar este dispositivo" text="Confira a conexão com o backend ou faça login novamente." />
          </Panel>
        ) : null}

        {activeTab === 'location' ? (
          <Panel>
            <SectionTitle
              title="Localização em tempo real"
              text="Últimas coordenadas enviadas pelo app filho via /locations/update."
            />
            <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
              <div className="min-h-[360px] overflow-hidden rounded-2xl bg-[#dfe6df]">
                {latestLocation ? (
                  <iframe
                    className="h-[360px] w-full border-0"
                    loading="lazy"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${latestLocation.longitude - 0.01}%2C${latestLocation.latitude - 0.01}%2C${latestLocation.longitude + 0.01}%2C${latestLocation.latitude + 0.01}&layer=mapnik&marker=${latestLocation.latitude}%2C${latestLocation.longitude}`}
                    title="Mapa de localização"
                  />
                ) : (
                  <MapPlaceholder />
                )}
              </div>
              <div className="grid gap-3">
                <Metric icon={MapPin} label="Latitude" value={latestLocation?.latitude.toFixed(6) ?? '--'} />
                <Metric icon={RadioTower} label="Longitude" value={latestLocation?.longitude.toFixed(6) ?? '--'} />
                <Metric
                  icon={Activity}
                  label="Precisão"
                  value={latestLocation?.accuracy ? `${latestLocation.accuracy}m` : '--'}
                />
                <Metric
                  icon={Bell}
                  label="Atualizado"
                  value={formatDate(latestLocation?.createdAt ?? latestLocation?.timestamp ?? latestLocation?.capturedAt)}
                />
              </div>
            </div>
          </Panel>
        ) : null}

        {activeTab === 'apps' ? (
          <Panel>
            <SectionTitle
              title="Aplicativos instalados"
              text="Bloqueie ou libere apps específicos sincronizados pelo celular da criança."
            />
            {(() => {
              const current = currentAppQuery.data;
              if (!current) return null;
              const inUsePackage = current.packageName;
              const inUseName = current.appName && current.appName !== current.packageName
                ? current.appName
                : apps.find((a) => a.packageName === current.packageName)?.appName ?? current.packageName;
              return (
                <div
                  className={`mb-4 flex flex-col gap-3 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between ${
                    current.isStale
                      ? 'border-zinc-200 bg-[#f8faf8]'
                      : 'border-amber-200 bg-[#fff7ed]'
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                        current.isStale
                          ? 'bg-zinc-100 text-zinc-500'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      <AppWindow size={18} />
                    </span>
                    <div className="min-w-0">
                      <p
                        className={`text-xs font-semibold uppercase tracking-wide ${
                          current.isStale ? 'text-zinc-500' : 'text-amber-700'
                        }`}
                      >
                        App em uso agora {current.isStale ? '· offline' : '· tempo real'}
                      </p>
                      <p className="truncate font-semibold text-[#06120c]">{inUseName}</p>
                      <p className="truncate text-sm text-[#7d8b83]">{inUsePackage}</p>
                    </div>
                  </div>
                  <button
                    className="flex h-11 shrink-0 items-center gap-2 rounded-full bg-amber-600 px-5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={forceCloseMutation.isPending}
                    onClick={() => forceCloseMutation.mutate(String(inUsePackage))}
                    type="button"
                  >
                    {forceCloseMutation.isPending && forceCloseMutation.variables === inUsePackage ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        Fechando...
                      </>
                    ) : (
                      'Fechar agora'
                    )}
                  </button>
                </div>
              );
            })()}
            <div className="mb-4 grid gap-3 md:grid-cols-[140px_140px_140px]">
              <select
                className="h-11 rounded-xl border border-[#dfe6df] bg-white px-3 text-sm text-[#06120c] outline-none focus:border-[#10673d]"
                onChange={(event) => { setAppStatus(event.target.value as 'all' | 'blocked' | 'unblocked'); setPage(1); }}
                value={appStatus}
              >
                <option value="all">Todos os status</option>
                <option value="blocked">Bloqueados</option>
                <option value="unblocked">Liberados</option>
              </select>
              <select
                className="h-11 rounded-xl border border-[#dfe6df] bg-white px-3 text-sm text-[#06120c] outline-none focus:border-[#10673d]"
                onChange={(event) => { setAppSystemFilter(event.target.value as 'all' | 'system' | 'user'); setPage(1); }}
                value={appSystemFilter}
              >
                <option value="all">Todos os tipos</option>
                <option value="user">Aplicativos de usuário</option>
                <option value="system">Aplicativos de sistema</option>
              </select>
              <select
                className="h-11 rounded-xl border border-[#dfe6df] bg-white px-3 text-sm text-[#06120c] outline-none focus:border-[#10673d]"
                onChange={(event) => { setLimit(Number(event.target.value)); setPage(1); }}
                value={limit}
              >
                <option value="10">10 por página</option>
                <option value="20">20 por página</option>
                <option value="50">50 por página</option>
              </select>
            </div>
            {globalAppSearch.trim().length > 0 ? (
              <p className="mb-3 text-sm text-[#7d8b83]">
                Filtrado por: "<span className="font-medium text-[#06120c]">{globalAppSearch}</span>"
              </p>
            ) : null}
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs text-[#7d8b83]">
                {resyncAppsMutation.isPending
                  ? 'Solicitando re-sincronização…'
                  : resyncAppsMutation.isSuccess
                    ? 'Comando de re-sincronização enviado. O celular da criança receberá em até ~5s.'
                    : resyncAppsMutation.isError
                      ? 'Falha ao solicitar re-sincronização.'
                      : null}
              </p>
              <button
                className="flex h-9 shrink-0 items-center gap-2 rounded-full border border-[#dfe6df] bg-white px-4 text-xs font-semibold text-[#10673d] transition hover:bg-[#f1faf4] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={resyncAppsMutation.isPending}
                onClick={() => resyncAppsMutation.mutate()}
                type="button"
              >
                {resyncAppsMutation.isPending ? <Loader2 className="animate-spin" size={14} /> : null}
                Re-sincronizar apps
              </button>
            </div>
            <div className="grid gap-3">
              {appsQuery.isLoading ? <SkeletonRows /> : null}
              {!appsQuery.isLoading && apps.length === 0 && !hasActiveAppFilter ? (
                <EmptyState
                  title="Nenhum app sincronizado"
                  text="O app filho deve enviar a lista para /devices/by-identifier/:deviceIdentifier/apps."
                />
              ) : null}
              {!appsQuery.isLoading && apps.length > 0 && filteredApps.length === 0 ? (
                <EmptyState
                  title="Nenhum app encontrado"
                  text={globalAppSearch
                    ? `Não há apps que correspondam a "${globalAppSearch}" com os filtros atuais.`
                    : 'Tente ajustar os filtros de status e tipo.'}
                />
              ) : null}
              {filteredApps.map((app) => {
                const isBlocked = blockedApps.includes(app.packageName);
                return (
                  <div
                    className="grid gap-3 rounded-xl border border-[#e8ece8] p-4 md:grid-cols-[1fr_auto_auto]"
                    key={app.id}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#f1faf4] text-[#10673d]">
                        <AppWindow size={18} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[#06120c]">{app.appName}</p>
                        <p className="truncate text-sm text-[#7d8b83]">{app.packageName}</p>
                      </div>
                    </div>
                    <button
                      className="flex h-10 shrink-0 items-center gap-2 rounded-full border border-amber-200 bg-white px-4 text-sm font-semibold text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={forceCloseMutation.isPending}
                      onClick={() => forceCloseMutation.mutate(app.packageName)}
                      type="button"
                    >
                      {forceCloseMutation.isPending && forceCloseMutation.variables === app.packageName ? (
                        <>
                          <Loader2 className="animate-spin" size={14} />
                          Fechando...
                        </>
                      ) : (
                        'Fechar'
                      )}
                    </button>
                    <label className="flex items-center gap-3 text-sm font-semibold text-[#48574d]">
                      <span>{isBlocked ? 'Bloqueado' : 'Liberado'}</span>
                      <input
                        checked={isBlocked}
                        className="h-5 w-5 accent-[#10673d]"
                        disabled={blockAppMutation.isPending}
                        onChange={(event) =>
                          blockAppMutation.mutate({ packageName: app.packageName, blocked: event.target.checked })
                        }
                        type="checkbox"
                      />
                    </label>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-[#7d8b83]">
                Página {page} de {totalPages || 1} - Total de {totalApps} aplicativos
              </span>
              <div className="flex gap-2">
                <button
                  className="rounded-full border border-[#dfe6df] bg-white px-4 py-2 text-sm font-semibold text-[#10673d] disabled:opacity-50"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  type="button"
                >
                  Anterior
                </button>
                <button
                  className="rounded-full border border-[#dfe6df] bg-white px-4 py-2 text-sm font-semibold text-[#10673d] disabled:opacity-50"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  type="button"
                >
                  Próxima
                </button>
              </div>
            </div>
            {forceCloseMutation.isError ? (
              <p className="mt-3 text-sm text-red-600">
                Não foi possível enviar o comando. Tente novamente.
              </p>
            ) : null}
            {forceCloseMutation.isSuccess ? (
              <p className="mt-3 text-sm text-[#10673d]">
                Comando enviado. O celular da criança receberá em até ~5s.
              </p>
            ) : null}
          </Panel>
        ) : null}

        {activeTab === 'internet' ? (
          <Panel>
            <SectionTitle
              title="Bloqueio de internet"
              text="Controle o status consumido pelo app filho em /devices/by-identifier/:deviceIdentifier/internet-access."
            />
            <div className="rounded-2xl bg-[#06120c] p-6 text-white">
              <p className="text-sm text-white/70">Status atual</p>
              <p className="mt-2 flex items-center gap-3 text-4xl font-bold">
                {internetQuery.data?.blocked ? <WifiOff size={32} /> : <Wifi size={32} />}
                {internetQuery.data?.blocked ? 'Bloqueada' : 'Liberada'}
              </p>
              <label className="mt-6 flex max-w-md items-center justify-between rounded-full bg-white/10 px-5 py-4">
                <span className="font-semibold">Bloquear acesso à internet</span>
                <input
                  checked={Boolean(internetQuery.data?.blocked)}
                  className="h-6 w-6 accent-[#63c58b]"
                  disabled={internetMutation.isPending}
                  onChange={(event) => internetMutation.mutate(event.target.checked)}
                  type="checkbox"
                />
              </label>
            </div>
          </Panel>
        ) : null}

        {activeTab === 'history' ? (
          <Panel>
            <SectionTitle title="Histórico de navegação" text="Filtre por URL, título e intervalo de datas." />
            <div className="mb-4 grid gap-3 md:grid-cols-[1fr_170px_170px]">
              <input
                className="h-11 rounded-xl border border-[#dfe6df] px-4"
                onChange={(event) => setHistorySearch(event.target.value)}
                placeholder="Buscar URL ou título"
                value={historySearch}
              />
              <input
                className="h-11 rounded-xl border border-[#dfe6df] px-4"
                onChange={(event) => setHistoryStartDate(event.target.value)}
                type="date"
                value={historyStartDate}
              />
              <input
                className="h-11 rounded-xl border border-[#dfe6df] px-4"
                onChange={(event) => setHistoryEndDate(event.target.value)}
                type="date"
                value={historyEndDate}
              />
            </div>
            <DataList
              emptyText="Nenhuma navegação registrada ainda."
              items={(historyQuery.data ?? []).map((entry) => ({
                id: entry.id,
                title: entry.title || entry.url,
                subtitle: entry.url,
                meta: formatDate(entry.visitedAt ?? entry.visited_at),
                icon: Globe,
              }))}
              loading={historyQuery.isLoading}
            />
          </Panel>
        ) : null}

        {activeTab === 'geofence' ? (
          <Panel>
            <SectionTitle
              title="Geofencing"
              text="Rascunhe áreas de entrada/saída para acompanhamento. O backend ainda não expõe rotas de geofence."
            />
            <form
              className="grid gap-3 lg:grid-cols-[1fr_140px_140px_120px_160px_auto]"
              onSubmit={(event) => {
                event.preventDefault();
                setGeofences((current) => [...current, { id: crypto.randomUUID(), ...geofenceForm }]);
                setGeofenceForm({ name: '', latitude: '', longitude: '', radius: '250', eventType: 'both' });
              }}
            >
              <input
                className="h-11 rounded-xl border border-[#dfe6df] px-4"
                onChange={(event) => setGeofenceForm((form) => ({ ...form, name: event.target.value }))}
                placeholder="Nome da área"
                required
                value={geofenceForm.name}
              />
              <input
                className="h-11 rounded-xl border border-[#dfe6df] px-4"
                onChange={(event) => setGeofenceForm((form) => ({ ...form, latitude: event.target.value }))}
                placeholder="Latitude"
                required
                value={geofenceForm.latitude}
              />
              <input
                className="h-11 rounded-xl border border-[#dfe6df] px-4"
                onChange={(event) => setGeofenceForm((form) => ({ ...form, longitude: event.target.value }))}
                placeholder="Longitude"
                required
                value={geofenceForm.longitude}
              />
              <input
                className="h-11 rounded-xl border border-[#dfe6df] px-4"
                onChange={(event) => setGeofenceForm((form) => ({ ...form, radius: event.target.value }))}
                placeholder="Raio"
                required
                value={geofenceForm.radius}
              />
              <select
                className="h-11 rounded-xl border border-[#dfe6df] px-4"
                onChange={(event) =>
                  setGeofenceForm((form) => ({
                    ...form,
                    eventType: event.target.value as GeofenceDraft['eventType'],
                  }))
                }
                value={geofenceForm.eventType}
              >
                <option value="both">Entrada e saída</option>
                <option value="entry">Entrada</option>
                <option value="exit">Saída</option>
              </select>
              <button className="h-11 rounded-full bg-[#10673d] px-5 font-semibold text-white" type="submit">
                Adicionar
              </button>
            </form>
            <DataList
              emptyText="Nenhuma geofence rascunhada."
              items={geofences.map((fence) => ({
                id: fence.id,
                title: fence.name,
                subtitle: `${fence.latitude}, ${fence.longitude} · ${fence.radius}m`,
                meta:
                  fence.eventType === 'both' ? 'Entrada e saída' : fence.eventType === 'entry' ? 'Entrada' : 'Saída',
                icon: MapPin,
                action: (
                  <button
                    className="text-sm font-semibold text-red-600"
                    onClick={() => setGeofences((current) => current.filter((item) => item.id !== fence.id))}
                    type="button"
                  >
                    Remover
                  </button>
                ),
              }))}
              loading={false}
            />
          </Panel>
        ) : null}

        {activeTab === 'reports' ? (
          <Panel>
            <SectionTitle
              title="Relatórios de uso"
              text="Tempo total, ranking de apps e uso diário dos últimos 7 dias."
            />
            <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
              <div className="rounded-2xl bg-[#10673d] p-5 text-white">
                <p className="text-sm text-white/70">Tempo total no período</p>
                <p className="mt-3 text-5xl font-bold">{secondsToHours(appUsageTotal)}</p>
                <p className="mt-3 text-sm text-white/70">
                  {appUsageQuery.data?.length ?? 0} apps com registro
                </p>
              </div>
              <div className="rounded-2xl border border-[#e8ece8] p-5">
                <p className="mb-4 font-semibold text-[#06120c]">Uso diário</p>
                <div className="flex h-48 items-end gap-3">
                  {(dailyUsageQuery.data ?? []).map((row) => {
                    const seconds = Number(row.totalDurationSeconds ?? row.total_duration_seconds ?? 0);
                    const label = String(row.usageDate ?? row.usage_date ?? '').slice(0, 10);
                    return (
                      <div className="flex flex-1 flex-col items-center gap-2" key={label}>
                        <div
                          className="w-full rounded-t-xl bg-[#10673d]"
                          style={{ height: `${Math.max(12, (seconds / maxDailySeconds) * 160)}px` }}
                        />
                        <span className="text-xs text-[#7d8b83]">{label || '--'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <DataList
              emptyText="Nenhum uso de app registrado."
              items={(appUsageQuery.data ?? []).map((row) => ({
                id: String(row.packageName ?? row.package_name),
                title: String(row.appName ?? row.app_name),
                subtitle: String(row.packageName ?? row.package_name),
                meta: secondsToHours(row.totalDurationSeconds ?? row.total_duration_seconds),
                icon: AppWindow,
              }))}
              loading={appUsageQuery.isLoading}
            />
          </Panel>
        ) : null}

        {activeTab === 'notifications' ? (
          <Panel>
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <SectionTitle
                title="Notificações"
                text="Alertas importantes gerados pelo backend para este dispositivo."
              />
              <label className="flex items-center gap-2 text-sm font-semibold text-[#48574d]">
                <input
                  checked={unreadOnly}
                  className="h-5 w-5 accent-[#10673d]"
                  onChange={(event) => setUnreadOnly(event.target.checked)}
                  type="checkbox"
                />
                Somente não lidas
              </label>
            </div>
            <DataList
              emptyText="Nenhuma notificação encontrada."
              items={(notificationsQuery.data ?? []).map((notification) => ({
                id: notification.id,
                title: notification.title,
                subtitle: notification.message,
                meta: `${notification.type} · ${formatDate(notification.createdAt ?? notification.created_at)}${notification.read ? '' : ' · não lida'}`,
                icon: notification.read ? CheckCircle2 : AlertTriangle,
                action: notification.read ? undefined : (
                  <button
                    className="text-sm font-semibold text-[#10673d]"
                    onClick={() => readNotificationMutation.mutate(notification.id)}
                    type="button"
                  >
                    Marcar lida
                  </button>
                ),
              }))}
              loading={notificationsQuery.isLoading}
            />
          </Panel>
        ) : null}
      </div>
    </DashboardLayout>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <section className="rounded-2xl bg-white p-5 shadow-sm">{children}</section>;
}

function SectionTitle({ title, text }: { title: string; text: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-xl font-bold text-[#06120c]">{title}</h2>
      <p className="mt-1 text-sm text-[#7d8b83]">{text}</p>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#e8ece8] p-4">
      <span className="grid h-10 w-10 place-items-center rounded-full bg-[#f1faf4] text-[#10673d]">
        <Icon size={16} />
      </span>
      <div className="min-w-0">
        <p className="text-sm text-[#7d8b83]">{label}</p>
        <p className="mt-1 break-words text-lg font-semibold text-[#06120c]">{value}</p>
      </div>
    </div>
  );
}

function MapPlaceholder() {
  return (
    <div className="grid h-[360px] place-items-center bg-[linear-gradient(90deg,#d7ded7_1px,transparent_1px),linear-gradient(#d7ded7_1px,transparent_1px)] bg-[size:42px_42px]">
      <div className="rounded-2xl bg-white p-5 text-center shadow-sm">
        <p className="text-lg font-semibold text-[#06120c]">Sem localização</p>
        <p className="mt-1 max-w-xs text-sm text-[#7d8b83]">Aguardando o primeiro envio do serviço de localização do app filho.</p>
      </div>
    </div>
  );
}

function SkeletonRows() {
  return (
    <>
      {[1, 2, 3].map((item) => (
        <div className="h-20 animate-pulse rounded-xl bg-[#f0f1ee]" key={item} />
      ))}
    </>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[#cad4ca] p-8 text-center">
      <p className="text-lg font-semibold text-[#06120c]">{title}</p>
      <p className="mt-2 text-sm text-[#7d8b83]">{text}</p>
    </div>
  );
}

function DataList({
  emptyText,
  items,
  loading,
}: {
  emptyText: string;
  items: Array<{
    id: string;
    title: string;
    subtitle: string;
    meta: string;
    action?: React.ReactNode;
    icon?: typeof MapPin;
  }>;
  loading: boolean;
}) {
  if (loading) return <SkeletonRows />;
  if (!items.length) return <EmptyState title="Sem dados" text={emptyText} />;

  return (
    <div className="mt-4 grid gap-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            className="grid gap-3 rounded-xl border border-[#e8ece8] p-4 md:grid-cols-[auto_1fr_auto]"
            key={item.id}
          >
            {Icon ? (
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f1faf4] text-[#10673d]">
                <Icon size={18} />
              </span>
            ) : null}
            <div className="min-w-0">
              <p className="truncate font-semibold text-[#06120c]">{item.title}</p>
              <p className="truncate text-sm text-[#7d8b83]">{item.subtitle}</p>
              <p className="mt-2 text-xs text-[#91a098]">{item.meta}</p>
            </div>
            {item.action ? <div className="flex items-center md:justify-end">{item.action}</div> : null}
          </div>
        );
      })}
    </div>
  );
}
