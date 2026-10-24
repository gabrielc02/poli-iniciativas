import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteHero } from "@/components/SiteHero";
import { InitiativeRow } from "@/components/InitiativeRow";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  getInitiatives,
  type Initiative,
  type User,
} from "@/lib/initiatives";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/inicio")({
  head: () => ({
    meta: [
      { title: "Iniciativas | Grêmio Politécnico USP" },
      { name: "description", content: "Catálogo de iniciativas em andamento e passadas do Grêmio Politécnico." },
      { property: "og:title", content: "Iniciativas | Grêmio Politécnico USP" },
      { property: "og:description", content: "Catálogo de iniciativas em andamento e passadas do Grêmio Politécnico." },
    ],
  }),
  component: Home,
});

function Home() {
  const navigate = useNavigate();
  const [user, setU] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [ongoing, setOngoing] = useState<Initiative[]>([]);
  const [past, setPast] = useState<Initiative[]>([]);
  const [loadingInitiatives, setLoadingInitiatives] = useState(true);

  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) throw error;

        if (!session) {
          if (active) {
            navigate({ to: "/inicio", replace: true });
          }
          return;
        }

        if (!active) return;

        setU({
          name:
            session.user.user_metadata?.["full_name"] ??
            session.user.email?.split("@")[0] ??
            "Usuário",
          email: session.user.email ?? "",
        });

        const initiatives = await getInitiatives();

        if (!active) return;

        setOngoing(
          initiatives.filter((item) => item.status === "andamento"),
        );

        setPast(
          initiatives.filter((item) => item.status === "concluido"),
        );
      } catch (error) {
        console.error("Erro ao inicializar a página:", error);
      } finally {
        if (active) {
          setCheckingSession(false);
          setLoadingInitiatives(false);
        }
      }
    }

    void initialize();

    return () => {
      active = false;
    };
  }, [navigate]);

    if (checkingSession || !user) return null;

  const logout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Erro ao sair:", error);
      return;
    }

    navigate({ to: "/", replace: true });
  };

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader user={user} onLogout={logout} />

      <SiteHero
        title="Grêmio Politécnico da USP"
        subtitle={`Olá, Lilo — iniciativas que movem a Poli`}
      >
        <p>
          {ongoing.length} iniciativas em andamento · {past.length} concluídas.
          Acompanhe o catálogo e proponha novas ideias pelo botão Nova Iniciativa.
        </p>
      </SiteHero>

      <main className="space-y-10 bg-white pb-12 pt-2">
        {loadingInitiatives ? (
          <p className="px-6 text-sm text-[#0B2545]/70">
            Carregando iniciativas...
          </p>
        ) : (
          <>
            <InitiativeRow
              title="Iniciativas em Andamento"
              items={ongoing}
            />

            <InitiativeRow
              title="Iniciativas Passadas"
              items={past}
            />
          </>
        )}
      </main>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="items-center text-center">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#0B2545]/10 text-[#0B2545]">
              <Sparkles className="h-6 w-6" />
            </div>

            <DialogTitle className="text-[#0B2545]">
              Em breve: Ingestão de Propostas
            </DialogTitle>

            <DialogDescription>
              Logo você poderá enviar novas iniciativas diretamente pela plataforma.
            </DialogDescription>
          </DialogHeader>

          <button
            onClick={() => setOpen(false)}
            className="mt-2 rounded-md bg-[#0B2545] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1a4a7a]"
          >
            Entendi
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
