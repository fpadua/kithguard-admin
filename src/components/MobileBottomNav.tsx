import { Link, useLocation } from 'react-router-dom';
import { BookOpen, LayoutDashboard, Smartphone } from 'lucide-react';

const items = [
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

interface MobileBottomNavProps {
  onOpenGuide: () => void;
}

export function MobileBottomNav({ onOpenGuide }: MobileBottomNavProps) {
  const location = useLocation();

  return (
    <nav className="fixed inset-x-3 bottom-3 z-30 rounded-2xl border border-[#e8ece8] bg-white/95 p-2 shadow-2xl backdrop-blur lg:hidden">
      <ul className="grid grid-cols-4 items-center gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item, location.pathname);
          return (
            <li key={item.path}>
              <Link
                aria-current={active ? 'page' : undefined}
                className={`flex h-14 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold transition ${
                  active
                    ? 'bg-[#10673d] text-white shadow-md shadow-[#10673d]/20'
                    : 'text-[#5c6b62] hover:bg-[#f1faf4]'
                }`}
                to={item.path}
              >
                <Icon size={20} />
                {item.name}
              </Link>
            </li>
          );
        })}
        <li>
          <button
            aria-label="Guia rápido"
            className="flex h-14 w-full flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold text-[#5c6b62] transition hover:bg-[#f1faf4]"
            onClick={onOpenGuide}
            type="button"
          >
            <BookOpen size={20} />
            Guia
          </button>
        </li>
      </ul>
    </nav>
  );
}
