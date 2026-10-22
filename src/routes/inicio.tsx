import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteHero } from "@/components/SiteHero";
import { InitiativeRow } from "@/components/InitiativeRow";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getUser, ongoing, past, setUser, type User } from "@/lib/initiatives";

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

  useEffect(() => {
    const u = getUser();
    if (!u) navigate({ to: "/", replace: true });
    else setU(u);
  }, [navigate]);

  if (!user) return null;

  const logout = () => {
    setUser(null);
    navigate({ to: "/", replace: true });
  };

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader user={user} onLogout={logout} />

      <SiteHero
        title="Grêmio Politécnico da USP"
        subtitle={`Olá, ${user.name.split(" ")[0]} — iniciativas que movem a Poli`}
      >
        <p>
          {ongoing.length} iniciativas em andamento · {past.length} concluídas. Acompanhe o catálogo e
          proponha novas ideias pelo botão Nova Iniciativa.
        </p>
      </SiteHero>

      <main className="space-y-10 bg-white pb-12 pt-2">
        <InitiativeRow title="Iniciativas em Andamento" items={ongoing} />
        <InitiativeRow title="Iniciativas Passadas" items={past} />
      </main>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="items-center text-center">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#0B2545]/10 text-[#0B2545]">
              <Sparkles className="h-6 w-6" />
            </div>
            <DialogTitle className="text-[#0B2545]">Em breve: Ingestão de Propostas</DialogTitle>
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
