import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck, UserPlus } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

export function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      setAuth(data.user, data.token);
      navigate('/');
    } catch (err) {
      console.error('Registration failed', err);
      setError('Não foi possível criar a conta. Verifique os dados e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#dfe1e1] p-3 sm:p-5 lg:p-8">
      <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] w-full max-w-[1520px] gap-3 rounded-[28px] bg-[#f7f7f4] p-4 shadow-2xl shadow-black/10 sm:min-h-[calc(100vh-2.5rem)] lg:min-h-[calc(100vh-4rem)] lg:p-8">
        <section className="hidden flex-1 flex-col justify-between rounded-2xl bg-gradient-to-br from-[#06120c] via-[#0d2818] to-[#10673d] p-10 text-white lg:flex">
          <Link className="flex items-center gap-3" to="/">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 backdrop-blur">
              <img alt="KithGuard" className="h-8 w-8 object-contain" src="/kithguard_logo.png" />
            </span>
            <span className="text-2xl font-bold">KithGuard</span>
          </Link>
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#63c58b]">
              <UserPlus size={14} /> Crie sua conta gratuita
            </span>
            <h1 className="text-4xl font-bold leading-tight">
              Comece a proteger a rotina digital da sua família em poucos minutos.
            </h1>
            <p className="max-w-md text-base text-white/80">
              Cadastre-se para parear dispositivos, configurar regras de uso e acompanhar tudo pelo painel
              KithGuard, com a mesma identidade visual usada no app e no site.
            </p>
            <ul className="grid gap-3 text-sm text-white/80">
              <li className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-[#63c58b]">
                  <ShieldCheck size={14} />
                </span>
                Onboarding guiado e central de ajuda
              </li>
              <li className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-[#63c58b]">
                  <ShieldCheck size={14} />
                </span>
                Suporte multiplataforma Android e iOS
              </li>
              <li className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-[#63c58b]">
                  <ShieldCheck size={14} />
                </span>
                Privacidade e segurança desde o pareamento
              </li>
            </ul>
          </div>
          <p className="text-xs text-white/60">© {new Date().getFullYear()} KithGuard · Painel administrativo</p>
        </section>

        <section className="flex flex-1 items-center justify-center p-2 sm:p-6">
          <div className="w-full max-w-md rounded-2xl border border-[#e8ece8] bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="mb-4 grid h-20 w-20 place-items-center rounded-3xl bg-[#f1faf4]">
                <img alt="KithGuard" className="h-12 w-12 object-contain" src="/kithguard_logo.png" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#10673d]">Crie sua conta</p>
              <h2 className="mt-1 text-3xl font-bold text-[#06120c]">Cadastro</h2>
              <p className="mt-2 text-sm text-[#5c6b62]">Leva menos de 1 minuto para começar.</p>
            </div>
            <form className="space-y-4" onSubmit={handleRegister}>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#06120c]">Nome</span>
                <span className="relative flex items-center">
                  <UserPlus className="pointer-events-none absolute left-4 text-[#7d8b83]" size={18} />
                  <input
                    className="w-full rounded-xl border border-[#dfe6df] bg-[#f7f7f4] py-3 pl-11 pr-4 text-sm text-[#06120c] outline-none transition focus:border-[#10673d] focus:bg-white"
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    required
                    type="text"
                    value={name}
                  />
                </span>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#06120c]">E-mail</span>
                <span className="relative flex items-center">
                  <Mail className="pointer-events-none absolute left-4 text-[#7d8b83]" size={18} />
                  <input
                    className="w-full rounded-xl border border-[#dfe6df] bg-[#f7f7f4] py-3 pl-11 pr-4 text-sm text-[#06120c] outline-none transition focus:border-[#10673d] focus:bg-white"
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@email.com"
                    required
                    type="email"
                    value={email}
                  />
                </span>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#06120c]">Senha</span>
                <span className="relative flex items-center">
                  <Lock className="pointer-events-none absolute left-4 text-[#7d8b83]" size={18} />
                  <input
                    className="w-full rounded-xl border border-[#dfe6df] bg-[#f7f7f4] py-3 pl-11 pr-12 text-sm text-[#06120c] outline-none transition focus:border-[#10673d] focus:bg-white"
                    minLength={6}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                  />
                  <button
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    className="absolute right-3 grid h-9 w-9 place-items-center rounded-full text-[#7d8b83] transition hover:bg-[#eef0ec] hover:text-[#10673d]"
                    onClick={() => setShowPassword((value) => !value)}
                    type="button"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </span>
              </label>
              {error ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
              ) : null}
              <button
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#10673d] py-3 text-sm font-semibold text-white transition hover:bg-[#0d5532] disabled:opacity-60"
                disabled={loading}
                type="submit"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : null}
                {loading ? 'Criando conta...' : 'Cadastrar'}
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-[#5c6b62]">
              Já tem uma conta?{' '}
              <Link className="font-semibold text-[#10673d] hover:underline" to="/login">
                Entrar
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
