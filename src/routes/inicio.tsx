import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogOut, Plus, Sparkles } from "lucide-react";
import { Logo } from "@/components/Logo";
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

  const logout = () => { setUser(null); navigate({ to: "/", replace: true }); };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 bg-primary shadow-md">
        <div className="flex items-center justify-between px-6 py-3 md:px-10">
          <Logo light />
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen(true)}
              className="flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-bold text-accent-foreground shadow-md transition hover:-translate-y-0.5 hover:brightness-105"
            >
              <Plus className="h-4 w-4" /> Nova Iniciativa
            </button>
            <div className="hidden h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground sm:flex" title={user.email}>
              {user.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
            </div>
            <button onClick={logout} aria-label="Sair" className="rounded-md p-2 text-primary-foreground/70 transition hover:bg-primary-foreground/10 hover:text-primary-foreground">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <section className="bg-hero px-6 pb-10 pt-8 text-primary-foreground md:px-10">
        <p className="text-sm opacity-70">Olá, {user.name.split(" ")[0]} 👋</p>
        <h1 className="mt-1 text-3xl font-bold md:text-4xl">Iniciativas do Grêmio</h1>
        <p className="mt-2 max-w-xl opacity-75">{ongoing.length} iniciativas em andamento · {past.length} concluídas</p>
      </section>

      <main className="space-y-10 py-8">
        <InitiativeRow title="Iniciativas em Andamento" items={ongoing} />
        <InitiativeRow title="Iniciativas Passadas" items={past} />
      </main>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="items-center text-center">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-accent/20 text-accent">
              <Sparkles className="h-6 w-6" />
            </div>
            <DialogTitle className="text-primary">Em breve: Ingestão de Propostas</DialogTitle>
            <DialogDescription>Logo você poderá enviar novas iniciativas diretamente pela plataforma.</DialogDescription>
          </DialogHeader>
          <button onClick={() => setOpen(false)} className="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-secondary">
            Entendi
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
