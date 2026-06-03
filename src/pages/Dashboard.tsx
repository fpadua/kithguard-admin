import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  AppWindow,
  CheckCircle2,
  Clock,
  Globe,
  Loader2,
  Plus,
  Smartphone,
  Sparkles,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import api from '../services/api';
import { useSearchStore } from '../store/searchStore';

interface Device {
  id: string;
  childName: string;
  deviceName: string;
  platform: string;
  deviceIdentifier?: string | null;
  internetBlocked?: boolean;
  createdAt?: string;
}

interface PairingCode {
  code: string;
  expiresAt: string;
}

interface DashboardProps {
  defaultSection?: 'overview' | 'reports';
}

function formatDate(value?: string) {
  if (!value) return 'Sem registro';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function Dashboard({ defaultSection = 'overview' }: DashboardProps) {
  const [section, setSection] = useState(defaultSection);
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

  const devices = useMemo(() => devicesQuery.data ?? [], [devicesQuery.data]);

  const filteredDevices = useMemo(() => {
    const lower = globalQuery.trim().toLowerCase();
    if (!lower) return devices;
    return devices.filter(
      (device) =>
        device.childName.toLowerCase().includes(lower) ||
        device.deviceName.toLowerCase().includes(lower) ||
        (device.deviceIdentifier ?? '').toLowerCase().includes(lower),
    );
  }, [devices, globalQuery]);

  const pairedDevices = devices.filter((device) => device.deviceIdentifier).length;
  const blockedInternet = devices.filter((device) => device.internetBlocked).length;

  const oldestDevice = useMemo(() => {
    return devices
      .filter((device) => device.createdAt)
      .sort((a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime())[0];
  }, [devices]);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#6c7a71]">Visão pai</p>
            <h1 className="mt-1 text-4xl font-bold text-[#06120c]">Dashboard</h1>
            <p className="mt-2 max-w-2xl text-[#7d8b83]">
              Acompanhe localização, uso de apps, internet, histórico, alertas e pareamento dos dispositivos.
              {globalQuery ? (
                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-[#f1faf4] px-3 py-1 text-sm font-semibold text-[#10673d]">
                  Busca ativa: "{globalQuery}"
                </span>
              ) : null}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              aria-pressed={section === 'overview'}
              className={`flex h-12 items-center gap-2 rounded-full px-5 text-sm font-semibold transition ${
                section === 'overview'
                  ? 'bg-[#10673d] text-white shadow-lg shadow-[#10673d]/20'
                  : 'border border-[#0d3f29] bg-white text-[#0d3f29] hover:bg-[#f1faf4]'
              }`}
              onClick={() => setSection('overview')}
              type="button"
            >
              <Sparkles size={16} /> Visão geral
            </button>
            <button
              aria-pressed={section === 'reports'}
              className={`flex h-12 items-center gap-2 rounded-full px-5 text-sm font-semibold transition ${
                section === 'reports'
                  ? 'bg-[#10673d] text-white shadow-lg shadow-[#10673d]/20'
                  : 'border border-[#0d3f29] bg-white text-[#0d3f29] hover:bg-[#f1faf4]'
              }`}
              onClick={() => setSection('reports')}
              type="button"
            >
              <Clock size={16} /> Relatórios
            </button>
          </div>
        </div>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            highlight
            icon={Smartphone}
            label="Dispositivos"
            value={devices.length}
            helper="Filhos monitorados"
          />
          <MetricCard icon={CheckCircle2} label="Pareados" value={pairedDevices} helper="Com identificador ativo" />
          <MetricCard
            icon={WifiOff}
            label="Internet bloqueada"
            value={blockedInternet}
            helper="Regras ativas agora"
          />
          <MetricCard
            icon={Clock}
            label="Mais antigo"
            value={oldestDevice ? '1' : '0'}
            helper={oldestDevice?.childName ?? 'Sem histórico'}
          />
        </section>

        {devicesQuery.isError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Não foi possível carregar os dispositivos. Confira se o backend está online e se o token ainda é válido.
          </div>
        ) : null}

        {section === 'overview' ? (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.25fr_0.75fr]">
            <section className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-[#06120c]">Dispositivos filhos</h2>
                  <p className="text-sm text-[#7d8b83]">
                    Abra um perfil para controlar apps, internet, histórico e alertas.
                  </p>
                </div>
                <span className="rounded-full bg-[#edf4ef] px-3 py-1 text-xs font-semibold text-[#10673d]">
                  {filteredDevices.length} de {devices.length}
                </span>
              </div>
              {devicesQuery.isLoading ? (
                <div className="grid gap-3">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="h-24 animate-pulse rounded-xl bg-[#f0f1ee]" />
                  ))}
                </div>
              ) : filteredDevices.length ? (
                <div className="grid gap-3">
                  {filteredDevices.map((device) => (
                    <Link
                      className="grid gap-3 rounded-xl border border-[#e8ece8] p-4 transition hover:border-[#10673d] hover:bg-[#fbfffb] md:grid-cols-[1fr_auto]"
                      key={device.id}
                      to={`/device/${device.id}`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-lg font-semibold text-[#06120c]">
                          {device.childName || device.deviceName}
                        </p>
                        <p className="truncate text-sm text-[#7d8b83]">
                          {device.deviceName} · {device.platform}
                        </p>
                        <p className="mt-2 text-xs text-[#91a098]">Criado em {formatDate(device.createdAt)}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 md:justify-end">
                        <StatusPill
                          active={Boolean(device.deviceIdentifier)}
                          icon={device.deviceIdentifier ? CheckCircle2 : Smartphone}
                          label={device.deviceIdentifier ? 'Pareado' : 'Pendente'}
                        />
                        <StatusPill
                          active={!device.internetBlocked}
                          icon={device.internetBlocked ? WifiOff : Wifi}
                          label={device.internetBlocked ? 'Internet bloqueada' : 'Internet liberada'}
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title={globalQuery ? 'Nenhum dispositivo encontrado' : 'Nenhum dispositivo cadastrado'}
                  text={
                    globalQuery
                      ? 'Refine a busca no campo acima ou limpe o filtro para ver todos.'
                      : 'Gere um código de pareamento e informe no app instalado no celular da criança.'
                  }
                />
              )}
            </section>

            <aside className="grid gap-4">
              <section className="rounded-2xl bg-white p-5 shadow-sm">
                <h2 className="text-xl font-bold text-[#06120c]">Pareamento</h2>
                <p className="mt-1 text-sm text-[#7d8b83]">
                  Gere um código de 6 caracteres e informe no app instalado no celular da criança.
                </p>
                <button
                  className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#10673d] font-semibold text-white transition hover:bg-[#0d5532] disabled:opacity-60"
                  disabled={pairingMutation.isPending}
                  onClick={() => pairingMutation.mutate()}
                  type="button"
                >
                  {pairingMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                  {pairingMutation.isPending ? 'Gerando...' : 'Gerar código'}
                </button>
                {pairingMutation.data ? (
                  <div className="mt-4 rounded-xl bg-[#06120c] p-4 text-white">
                    <p className="text-xs uppercase text-white/60">Código</p>
                    <p className="mt-1 text-4xl font-bold tracking-[0.2em]">{pairingMutation.data.code}</p>
                    <p className="mt-2 text-sm text-white/70">Expira em {formatDate(pairingMutation.data.expiresAt)}</p>
                  </div>
                ) : null}
              </section>
            </aside>
          </div>
        ) : (
          <section className="grid gap-4 lg:grid-cols-3">
            <ReportTile
              icon={Clock}
              title="Tempo de tela"
              value="Por dispositivo"
              text="Abra um filho para ver o ranking de apps e uso diário vindo de /reports."
            />
            <ReportTile
              icon={Globe}
              title="Sites visitados"
              value="Com filtros"
              text="Histórico por busca, data e limite usando as rotas do backend."
            />
            <ReportTile
              icon={AppWindow}
              title="Alertas"
              value="Notificações"
              text="Lista de eventos com leitura individual e filtro de não lidas."
            />
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  helper,
  highlight = false,
}: {
  icon: typeof Smartphone;
  label: string;
  value: number | string;
  helper: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-2xl p-5 shadow-sm ${highlight ? 'bg-[#10673d] text-white' : 'bg-white text-[#06120c]'}`}>
      <div className="flex items-center justify-between">
        <p className="font-semibold">{label}</p>
        <span
          className={`grid h-10 w-10 place-items-center rounded-full ${
            highlight ? 'bg-white/20 text-white' : 'bg-[#f1faf4] text-[#10673d]'
          }`}
        >
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-5 text-5xl font-bold">{value}</p>
      <p className={`mt-3 text-sm ${highlight ? 'text-white/80' : 'text-[#7d8b83]'}`}>{helper}</p>
    </div>
  );
}

function StatusPill({
  active,
  icon: Icon,
  label,
}: {
  active: boolean;
  icon: typeof Smartphone;
  label: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
        active ? 'bg-[#edf4ef] text-[#10673d]' : 'bg-[#fff4df] text-[#9a5a00]'
      }`}
    >
      <Icon size={12} /> {label}
    </span>
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

function ReportTile({
  icon: Icon,
  title,
  value,
  text,
}: {
  icon: typeof Clock;
  title: string;
  value: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-[#10673d]">{title}</p>
        <span className="grid h-10 w-10 place-items-center rounded-full bg-[#f1faf4] text-[#10673d]">
          <Icon size={18} />
        </span>
      </div>
      <p className="text-3xl font-bold text-[#06120c]">{value}</p>
      <p className="mt-3 text-sm text-[#7d8b83]">{text}</p>
    </div>
  );
}
