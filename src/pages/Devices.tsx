import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Battery,
  BatteryCharging,
  CheckCircle2,
  Filter,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldOff,
  Smartphone,
  Trash2,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import api from '../services/api';
import { useSearchStore } from '../store/searchStore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

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

interface PairingCode {
  code: string;
  expiresAt: string;
}

type PlatformFilter = 'all' | 'android' | 'ios';
type StatusFilter = 'all' | 'paired' | 'pending' | 'blocked';

function formatDate(value?: string) {
  if (!value) return 'Sem registro';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function Devices() {
  const [platform, setPlatform] = useState<PlatformFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const queryClient = useQueryClient();
  const globalQuery = useSearchStore((state) => state.query);

  const devicesQuery = useQuery<Device[]>({
    queryKey: ['devices'],
    queryFn: async () => {
      const { data } = await api.get('/devices');
      return data;
    },
  });

  const pairingMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<PairingCode>('/devices/generate-pairing-code');
      return data;
    },
  });

  const internetMutation = useMutation({
    mutationFn: async ({ id, blocked }: { id: string; blocked: boolean }) => {
      await api.post(`/devices/${id}/internet-access`, { blocked });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/devices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });

  const filteredDevices = useMemo(() => {
    const lower = globalQuery.trim().toLowerCase();
    return (devicesQuery.data ?? []).filter((device) => {
      if (platform !== 'all' && device.platform.toLowerCase() !== platform) return false;
      if (status === 'paired' && !device.deviceIdentifier) return false;
      if (status === 'pending' && device.deviceIdentifier) return false;
      if (status === 'blocked' && !device.internetBlocked) return false;
      if (!lower) return true;
      return (
        device.childName.toLowerCase().includes(lower) ||
        device.deviceName.toLowerCase().includes(lower) ||
        (device.deviceIdentifier ?? '').toLowerCase().includes(lower)
      );
    });
  }, [devicesQuery.data, globalQuery, platform, status]);

  const stats = useMemo(() => {
    const devices = devicesQuery.data ?? [];
    return {
      total: devices.length,
      paired: devices.filter((d) => d.deviceIdentifier).length,
      blocked: devices.filter((d) => d.internetBlocked).length,
      android: devices.filter((d) => d.platform.toLowerCase() === 'android').length,
    };
  }, [devicesQuery.data]);

  return (
    <DashboardLayout>
      <div className="grid gap-5">
        <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#6c7a71]">Gestão de dispositivos</p>
            <h1 className="mt-1 text-4xl font-bold text-[#06120c]">Dispositivos</h1>
            <p className="mt-2 max-w-2xl text-[#7d8b83]">
              Gerencie todos os celulares pareados com a sua conta. Gere códigos, libere/bloqueie o acesso à
              internet e abra o painel detalhado de cada filho.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              className="flex h-12 items-center gap-2 rounded-full border border-[#0d3f29] bg-white px-5 text-sm font-semibold text-[#0d3f29] transition hover:bg-[#f1faf4]"
              onClick={() => devicesQuery.refetch()}
              type="button"
            >
              <RefreshCw size={16} className={devicesQuery.isFetching ? 'animate-spin' : ''} />
              Atualizar
            </button>
            <button
              className="flex h-12 items-center gap-2 rounded-full bg-[#10673d] px-5 text-sm font-semibold text-white transition hover:bg-[#0d5532]"
              onClick={() => pairingMutation.mutate()}
              type="button"
              disabled={pairingMutation.isPending}
            >
              {pairingMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
              Gerar código de pareamento
            </button>
          </div>
        </header>

        {pairingMutation.data ? (
          <div className="flex flex-col gap-3 rounded-2xl bg-[#06120c] p-5 text-white sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-white/60">Código gerado</p>
              <p className="mt-1 text-3xl font-bold tracking-[0.2em]">{pairingMutation.data.code}</p>
              <p className="mt-1 text-sm text-white/70">Expira em {formatDate(pairingMutation.data.expiresAt)}</p>
            </div>
            <button
              className="flex items-center gap-2 self-start rounded-full border border-white/30 px-4 py-2 text-sm font-semibold transition hover:bg-white/10"
              onClick={() => pairingMutation.reset()}
              type="button"
            >
              <X size={16} /> Fechar
            </button>
          </div>
        ) : null}

        <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={Smartphone} label="Total cadastrados" value={stats.total} hint="incluindo pendentes" />
          <StatCard
            icon={ShieldCheck}
            label="Pareados"
            value={stats.paired}
            hint="com identificador ativo"
            tone="success"
          />
          <StatCard
            icon={ShieldOff}
            label="Internet bloqueada"
            value={stats.blocked}
            hint="regra ativa agora"
            tone="warning"
          />
          <StatCard icon={BatteryCharging} label="Android" value={stats.android} hint="demais: iOS / outros" />
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#06120c]">Lista de dispositivos</h2>
              <p className="text-sm text-[#7d8b83]">
                {filteredDevices.length} de {stats.total} resultados. Use a busca global ou os filtros abaixo.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Filter size={14} className="text-[#5c6b62]" />
              <span className="text-sm font-medium text-[#5c6b62]">Plataforma</span>
              <Select value={platform} onValueChange={(v) => setPlatform(v as PlatformFilter)}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Plataforma">
                    {(value: string | null) => {
                      if (!value) return 'Plataforma';
                      return { all: 'Todas', android: 'Android', ios: 'iOS' }[value] ?? value;
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="android">Android</SelectItem>
                  <SelectItem value="ios">iOS</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm font-medium text-[#5c6b62]">Status</span>
              <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status">
                    {(value: string | null) => {
                      if (!value) return 'Status';
                      return { all: 'Todos', paired: 'Pareados', pending: 'Pendentes', blocked: 'Internet bloqueada' }[value] ?? value;
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="paired">Pareados</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="blocked">Internet bloqueada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {globalQuery.trim() ? (
            <p className="mt-4 flex items-center gap-2 rounded-xl bg-[#f1faf4] px-3 py-2 text-sm text-[#10673d]">
              <Search size={14} /> Filtrando por "{globalQuery.trim()}"
            </p>
          ) : null}

          <div className="mt-5 grid gap-3">
            {devicesQuery.isLoading ? (
              <SkeletonList />
            ) : filteredDevices.length === 0 ? (
              <EmptyState />
            ) : (
              filteredDevices.map((device) => (
                <DeviceRow
                  device={device}
                  key={device.id}
                  onDelete={() => deleteMutation.mutate(device.id)}
                  onToggleInternet={() =>
                    internetMutation.mutate({ id: device.id, blocked: !device.internetBlocked })
                  }
                />
              ))
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

function DeviceRow({
  device,
  onToggleInternet,
  onDelete,
}: {
  device: Device;
  onToggleInternet: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="grid gap-4 rounded-xl border border-[#e8ece8] p-4 transition hover:border-[#10673d] hover:bg-[#fbfffb] md:grid-cols-[1fr_auto]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-lg font-semibold text-[#06120c]">
            {device.childName || device.deviceName}
          </p>
          <StatusPill active={Boolean(device.deviceIdentifier)} label={device.deviceIdentifier ? 'Pareado' : 'Pendente'} />
        </div>
        <p className="mt-1 truncate text-sm text-[#7d8b83]">
          {device.deviceName} · {device.platform}
          {device.deviceIdentifier ? ` · ID ${device.deviceIdentifier}` : ''}
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#5c6b62]">
          <span className="flex items-center gap-1 rounded-full bg-[#f4f4f1] px-3 py-1">
            <MapPin size={12} /> {formatDate(device.createdAt)}
          </span>
          <span className="flex items-center gap-1 rounded-full bg-[#f4f4f1] px-3 py-1">
            <Battery size={12} /> Status ativo
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 md:justify-end">
        <Link
          className="flex h-10 items-center gap-2 rounded-full bg-[#10673d] px-4 text-sm font-semibold text-white transition hover:bg-[#0d5532]"
          to={`/device/${device.id}`}
        >
          <Smartphone size={14} /> Abrir
        </Link>
        <button
          className={`flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition ${
            device.internetBlocked
              ? 'border border-[#d97706] bg-white text-[#d97706] hover:bg-[#fff8eb]'
              : 'border border-[#10673d] bg-white text-[#10673d] hover:bg-[#f1faf4]'
          }`}
          onClick={onToggleInternet}
          type="button"
        >
          {device.internetBlocked ? <WifiOff size={14} /> : <Wifi size={14} />}
          {device.internetBlocked ? 'Liberar internet' : 'Bloquear internet'}
        </button>
        <button
          aria-label="Remover dispositivo"
          className="grid h-10 w-10 place-items-center rounded-full border border-red-200 bg-white text-red-600 transition hover:bg-red-50"
          onClick={() => {
            if (confirm(`Tem certeza que deseja remover ${device.childName || device.deviceName}?`)) {
              onDelete();
            }
          }}
          type="button"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = 'default',
}: {
  icon: typeof Smartphone;
  label: string;
  value: number;
  hint: string;
  tone?: 'default' | 'success' | 'warning';
}) {
  const toneClasses: Record<typeof tone, string> = {
    default: 'bg-white text-[#06120c]',
    success: 'bg-[#10673d] text-white',
    warning: 'bg-[#fff8eb] text-[#a45306]',
  };
  return (
    <div className={`rounded-2xl p-5 shadow-sm ${toneClasses[tone]}`}>
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

function StatusPill({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
        active ? 'bg-[#edf4ef] text-[#10673d]' : 'bg-[#fff4df] text-[#9a5a00]'
      }`}
    >
      {active ? <CheckCircle2 size={12} /> : <ShieldOff size={12} />} {label}
    </span>
  );
}

function SkeletonList() {
  return (
    <>
      {[1, 2, 3].map((item) => (
        <div key={item} className="h-28 animate-pulse rounded-xl bg-[#f0f1ee]" />
      ))}
    </>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-[#cad4ca] p-8 text-center">
      <p className="text-lg font-semibold text-[#06120c]">Nenhum dispositivo encontrado</p>
      <p className="mt-2 text-sm text-[#7d8b83]">
        Ajuste os filtros, gere um código de pareamento ou cadastre um dispositivo manualmente.
      </p>
    </div>
  );
}
