import { useState } from 'react';
import { ChevronDown, LogOut, UserRound } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { QuickGuideModal } from './QuickGuideModal';
import { TopbarSearch } from './TopbarSearch';
import { TopbarInbox } from './TopbarInbox';
import { useAuthStore } from '../store/authStore';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [menuOpen, setMenuOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  const initials = (user?.email ?? 'KG').slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-[#dfe1e1] p-3 text-[#08150f] sm:p-5 lg:p-8">
      <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] w-full max-w-[1520px] flex-col gap-3 rounded-[28px] bg-[#f7f7f4] p-3 shadow-2xl shadow-black/10 sm:min-h-[calc(100vh-2.5rem)] lg:min-h-[calc(100vh-4rem)] lg:flex-row">
        <Sidebar onOpenGuide={() => setGuideOpen(true)} />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <header className="flex flex-col gap-3 rounded-2xl bg-[#efefec] p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
            <TopbarSearch />
            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <TopbarInbox />
              <div className="relative">
                <button
                  aria-label="Conta do responsável"
                  className="flex items-center gap-3 rounded-full bg-white py-1 pl-1 pr-4 text-left shadow-sm transition hover:bg-[#f1faf4]"
                  onClick={() => setMenuOpen((value) => !value)}
                  type="button"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-[#10673d] text-sm font-bold text-white">
                    {initials}
                  </span>
                  <span className="hidden min-w-0 sm:block">
                    <p className="truncate text-sm font-semibold text-[#07130d]">Responsável</p>
                    <p className="max-w-[210px] truncate text-xs text-[#768279]">{user?.email ?? 'Convidado'}</p>
                  </span>
                  <ChevronDown className="hidden h-4 w-4 text-[#7d8b83] sm:block" />
                </button>
                {menuOpen ? (
                  <div
                    className="absolute right-0 top-14 z-40 w-60 overflow-hidden rounded-2xl border border-[#e8ece8] bg-white shadow-2xl"
                    onMouseLeave={() => setMenuOpen(false)}
                  >
                    <div className="border-b border-[#eef0ec] bg-[#f7f7f4] p-4">
                      <p className="flex items-center gap-2 text-sm font-semibold text-[#06120c]">
                        <UserRound size={16} /> Conta conectada
                      </p>
                      <p className="mt-1 truncate text-xs text-[#5c6b62]">{user?.email ?? 'Sem sessão'}</p>
                    </div>
                    <button
                      className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
                      onClick={logout}
                      type="button"
                    >
                      <LogOut size={16} /> Sair da conta
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </header>
          <main className="min-w-0 flex-1 overflow-y-auto rounded-2xl bg-[#efefec] p-4 pb-24 sm:p-6 sm:pb-6 lg:pb-6">
            {children}
          </main>
        </div>
      </div>
      <MobileBottomNav onOpenGuide={() => setGuideOpen(true)} />
      <QuickGuideModal onClose={() => setGuideOpen(false)} open={guideOpen} />
    </div>
  );
}
