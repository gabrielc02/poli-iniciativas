import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import gremioInvertido from "@/assets/gremio_invertido.avif";
import { supabase } from "../lib/supabase"; 



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


function Login() {
  const navigate = useNavigate();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const checkSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) throw error;

        if (active && session) {
          navigate({ to: "/inicio", replace: true });
        }
      } catch (error) {
        console.error("Erro ao verificar sessão:", error);
      }
    };

    void checkSession();

    return () => {
      active = false;
    };
  }, [navigate]);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setMessage(null);

    try {
      // 1. Valida o código no servidor.
      const { data, error } = await supabase.functions.invoke(
        "code-login",
        {
          body: { code },
        },
      );

      if (error) throw error;

      if (!data?.token_hash) {
        throw new Error("Não foi possível validar o acesso.");
      }

      // 2. Troca o token por uma sessão real do Supabase Auth.
      const { error: authError } = await supabase.auth.verifyOtp({
        token_hash: data.token_hash,
        type: "magiclink",
      });

      if (authError) throw authError;

      // 3. Redireciona após a sessão ser estabelecida.
      navigate({ to: "/inicio", replace: true });
    } catch (error) {
      console.error("Falha no login:", error);

      setMessage(
        "Código inválido ou falha ao autenticar. Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Coluna esquerda */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gremio-hero p-12 lg:flex">
        <Logo light link={false} />

        <div className="relative z-10 max-w-lg text-white">
          <h1 className="font-display text-4xl font-bold uppercase leading-tight tracking-wide xl:text-5xl">
            Grêmio Politécnico da USP
          </h1>

          <p className="mt-3 text-lg text-white/85">
            Desde 1903 representando os alunos da Poli
          </p>

          <p className="mt-5 text-sm leading-relaxed text-white/75">
            Acompanhe, proponha e celebre as iniciativas do Grêmio
            em um só lugar.
          </p>
        </div>

        <p className="relative z-10 text-xs text-white/50">
          © 2026 Grêmio Politécnico da USP
        </p>

        <img
          src={gremioInvertido}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 bottom-8 h-72 w-72 object-contain opacity-80 xl:h-96 xl:w-96"
        />
      </div>

      {/* Coluna direita */}
      <div className="flex items-center justify-center bg-white p-6">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden">
            <Logo link={false} />
          </div>

          <div>
            <h2 className="font-display text-3xl font-bold uppercase tracking-wide text-[#0B2545]">
              Bem-vindo(a)
            </h2>

            <p className="mt-2 text-[#0B2545]/70">
              Digite seu código de acesso para continuar.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="access-code"
                className="block text-sm font-semibold text-[#0B2545]"
              >
                Código de acesso
              </label>

              <input
                id="access-code"
                type="password"
                autoComplete="current-password"
                required
                maxLength={256}
                placeholder="Digite seu código"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="mt-1 block w-full rounded-md border border-[#0B2545]/30 px-4 py-2.5 text-sm text-[#0B2545] placeholder-[#0B2545]/40 focus:border-[#0B2545] focus:outline-none focus:ring-1 focus:ring-[#0B2545]"
              />
            </div>

            {message && (
              <p
                role="alert"
                className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="flex w-full items-center justify-center gap-3 rounded-md border border-[#0B2545] bg-[#0B2545] px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-white hover:text-[#0B2545] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Verificando...</span>
                </>
              ) : (
                <span>Acessar Plataforma</span>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-[#0B2545]/55">
            Acesso restrito a pessoas autorizadas.
          </p>
        </div>
      </div>
    </main>
  );
}
