import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { getUser, setUser } from "@/lib/initiatives";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Entrar | Iniciativas Grêmio Politécnico" },
      { name: "description", content: "Acesse a plataforma de iniciativas do Grêmio Politécnico da USP." },
      { property: "og:title", content: "Entrar | Iniciativas Grêmio Politécnico" },
      { property: "og:description", content: "Acesse a plataforma de iniciativas do Grêmio Politécnico da USP." },
    ],
  }),
  component: Login,
});

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/>
    </svg>
  );
}

function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  useEffect(() => { if (getUser()) navigate({ to: "/inicio", replace: true }); }, [navigate]);

  const signIn = () => {
    setLoading(true);
    setTimeout(() => {
      setUser({ name: "Gabriel Chaves", email: "gabriel.chaves@usp.br" });
      navigate({ to: "/inicio" });
    }, 1100);
  };

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-hero p-12 lg:flex">
        <Logo light />
        <div className="text-primary-foreground">
          <h1 className="text-4xl font-bold leading-tight">Ideias que movem<br />a Poli.</h1>
          <p className="mt-4 max-w-md opacity-75">Acompanhe, proponha e celebre as iniciativas do Grêmio Politécnico em um só lugar.</p>
        </div>
        <p className="text-xs text-primary-foreground/50">© 2026 Grêmio Politécnico da USP</p>
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden"><Logo /></div>
          <div>
            <h2 className="text-3xl font-bold text-primary">Bem-vindo(a)</h2>
            <p className="mt-2 text-muted-foreground">Entre com sua conta USP do Google para continuar.</p>
          </div>
          <button
            onClick={signIn}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-md border border-border bg-card px-4 py-3 font-semibold text-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <GoogleIcon />}
            {loading ? "Conectando..." : "Entrar com o Google"}
          </button>
          <p className="text-center text-xs text-muted-foreground">Acesso restrito a e-mails @usp.br</p>
        </div>
      </div>
    </main>
  );
}
