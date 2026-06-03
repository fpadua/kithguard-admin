import { useEffect } from 'react';
import { X, Smartphone, KeyRound, Wifi, AppWindow, History, MapPinned, ShieldCheck } from 'lucide-react';

interface QuickGuideModalProps {
  open: boolean;
  onClose: () => void;
}

const steps = [
  {
    icon: Smartphone,
    title: '1. Instale o app no celular da criança',
    description:
      'Baixe o aplicativo KithGuard Filho na Play Store e abra pela primeira vez. Mantenha o app instalado e em segundo plano para que o monitoramento funcione continuamente.',
  },
  {
    icon: KeyRound,
    title: '2. Gere um código de pareamento',
    description:
      'No painel web, clique em "Gerar código". Um código de 6 caracteres com 30 minutos de validade será exibido.',
  },
  {
    icon: ShieldCheck,
    title: '3. Insira o código no celular da criança',
    description:
      'No app filho, digite o código gerado, informe o nome da criança e confirme. Aguarde a confirmação de pareamento.',
  },
  {
    icon: MapPinned,
    title: '4. Acompanhe localização e geofences',
    description:
      'Após o pareamento, a localização começa a ser enviada automaticamente. Você pode criar áreas (geofences) para receber alertas de entrada e saída.',
  },
  {
    icon: AppWindow,
    title: '5. Controle os aplicativos',
    description:
      'Acesse a aba "Apps" do dispositivo para visualizar os aplicativos instalados e bloquear ou liberar o acesso de cada um.',
  },
  {
    icon: Wifi,
    title: '6. Gerencie o acesso à internet',
    description:
      'Na aba "Internet" você pode liberar ou bloquear a conexão do dispositivo a qualquer momento.',
  },
  {
    icon: History,
    title: '7. Revise o histórico e relatórios',
    description:
      'Consulte o histórico de navegação, o tempo de uso por app e os alertas consolidados em "Relatórios".',
  },
];

export function QuickGuideModal({ open, onClose }: QuickGuideModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#06120c]/60 p-4 backdrop-blur-sm"
      role="dialog"
    >
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="flex items-center justify-between gap-3 border-b border-[#e8ece8] p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#10673d]">Aplicativo móvel</p>
            <h2 className="mt-1 text-2xl font-bold text-[#06120c]">Guia rápido de pareamento</h2>
          </div>
          <button
            aria-label="Fechar guia"
            className="grid h-10 w-10 place-items-center rounded-full bg-[#f4f4f1] text-[#06120c] transition hover:bg-[#e8ece8]"
            onClick={onClose}
            type="button"
          >
            <X size={20} />
          </button>
        </header>
        <div className="max-h-[calc(90vh-88px)] overflow-y-auto p-5">
          <ol className="grid gap-4">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <li className="flex items-start gap-4 rounded-2xl bg-[#f7f7f4] p-4" key={step.title}>
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#10673d] text-white">
                    <Icon size={22} />
                  </span>
                  <div>
                    <p className="text-base font-semibold text-[#06120c]">{step.title}</p>
                    <p className="mt-1 text-sm text-[#5c6b62]">{step.description}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
        <footer className="flex flex-col gap-3 border-t border-[#e8ece8] bg-[#f7f7f4] p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#5c6b62]">Precisa de mais ajuda? Acesse a central de suporte.</p>
          <button
            className="h-11 rounded-full bg-[#10673d] px-6 text-sm font-semibold text-white transition hover:bg-[#0d5532]"
            onClick={onClose}
            type="button"
          >
            Entendi
          </button>
        </footer>
      </div>
    </div>
  );
}
