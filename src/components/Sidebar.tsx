import { Link, useLocation } from 'react-router-dom';
import { BookOpen, LayoutDashboard, LogOut, Smartphone, Sparkles } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface SidebarProps {
  onOpenGuide: () => void;
}

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard, end: true },
  { name: 'Dispositivos', path: '/devices', icon: Smartphone, end: false },
  { name: 'Relatórios', path: '/reports', icon: BookOpen, end: false },
];

function isActive(item: { path: string; end: boolean }, pathname: string) {
  if (item.end) return pathname === item.path;
  if (item.path === '/devices') {
    return pathname === item.path || pathname.startsWith('/device/');
  }
  return pathname === item.path || pathname.startsWith(`${item.path}/`);
}

export function Sidebar({ onOpenGuide }: SidebarProps) {
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);

  return (
    <aside className="hidden w-72 shrink-0 flex-col rounded-2xl bg-[#f4f4f1] p-6 lg:flex">
      <Link className="mb-12 flex w-full items-center justify-center gap-3" to="/" aria-label="KithGuard - Início">
        <img alt="KithGuard Logo" className="h-21 w-21 object-contain" src="/kithguard_logo.png" />
      </Link>
      <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-[#8b968f]">Menu</p>
      <nav className="flex flex-col gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item, location.pathname);
          return (
            <Link
              className={`flex items-center gap-3 rounded-xl p-3 text-base font-medium transition duration-200 ${active
                  ? 'bg-[#10673d] text-white shadow-lg shadow-[#10673d]/20'
                  : 'text-[#728078] hover:bg-white hover:text-[#0c1a12]'
                }`}
              key={item.path}
              to={item.path}
            >
              <span
                className={`grid h-9 w-9 place-items-center rounded-lg ${active ? 'bg-white/20 text-white' : 'bg-white text-[#10673d]'
                  }`}
              >
                <Icon size={18} />
              </span>
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto rounded-2xl bg-gradient-to-br from-[#06120c] to-[#0d2818] p-5 text-white">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#63c58b]" />
          <span className="text-xs font-semibold uppercase tracking-wide text-[#63c58b]">App móvel</span>
        </div>
        <p className="text-lg font-semibold leading-tight">Aplicativo móvel</p>
        <p className="mt-1 text-sm text-white/70">Pareie o celular da criança usando o código do painel.</p>
        <button
          className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#10673d] text-sm font-semibold text-white transition hover:bg-[#0d5532]"
          onClick={onOpenGuide}
          type="button"
        >
          <BookOpen size={16} /> Guia rápido
        </button>
      </div>
      <button
        className="mt-4 flex items-center gap-3 rounded-xl p-3 text-left text-[#728078] transition hover:bg-white hover:text-[#0c1a12]"
        onClick={logout}
        type="button"
      >
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-white text-[#10673d]">
          <LogOut size={16} />
        </span>
        Sair
      </button>
    </aside>
  );
}
