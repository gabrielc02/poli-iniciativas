import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, UserPlus } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteHero } from "@/components/SiteHero";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getUser, setUser, type User } from "@/lib/initiatives";

export const Route = createFileRoute("/membros")({
  head: () => ({
    meta: [
      { title: "Membros | Grêmio Politécnico USP" },
      { name: "description", content: "Conheça os membros e as diretorias do Grêmio Politécnico." },
      { property: "og:title", content: "Membros | Grêmio Politécnico USP" },
      { property: "og:description", content: "Conheça os membros e as diretorias do Grêmio Politécnico." },
    ],
  }),
  component: Membros,
});

type Member = {
  id: string;
  name: string;
  role: string;
  area: string;
  email?: string;
};

// TODO: mover para "@/lib/members" (ou buscar de uma API) quando os dados reais existirem.
const members: Member[] = [
  { id: "1", name: "Ana Souza", role: "Presidente", area: "Presidência", email: "ana@exemplo.com" },
  { id: "2", name: "Bruno Lima", role: "Vice-presidente", area: "Presidência", email: "bruno@exemplo.com" },
  { id: "3", name: "Carla Mendes", role: "Diretora", area: "Eventos", email: "carla@exemplo.com" },
  { id: "4", name: "Diego Alves", role: "Membro", area: "Eventos" },
  { id: "5", name: "Elisa Rocha", role: "Diretora", area: "Comunicação", email: "elisa@exemplo.com" },
  { id: "6", name: "Felipe Costa", role: "Membro", area: "Comunicação" },
];

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

function MemberCard({ member }: { member: Member }) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0B2545] text-sm font-semibold text-white">
        {initials(member.name)}
      </div>
      <div className="min-w-0">
        <p className="truncate font-semibold text-[#0B2545]">{member.name}</p>
        <p className="truncate text-sm text-slate-600">{member.role}</p>
        {member.email && (
          <a href={`mailto:${member.email}`} className="truncate text-xs text-[#1a4a7a] hover:underline">
            {member.email}
          </a>
        )}
      </div>
    </div>
  );
}

function Membros() {
  const navigate = useNavigate();
  const [user, setU] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const u = getUser();
    if (!u) navigate({ to: "/", replace: true });
    else setU(u);
  }, [navigate]);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = members.filter(
      (m) =>
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q) ||
        m.area.toLowerCase().includes(q),
    );
    return filtered.reduce<Record<string, Member[]>>((acc, m) => {
      (acc[m.area] ??= []).push(m);
      return acc;
    }, {});
  }, [query]);

  if (!user) return null;

  const logout = () => {
    setUser(null);
    navigate({ to: "/", replace: true });
  };

  const areas = Object.keys(grouped);

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader user={user} onLogout={logout} />

      <SiteHero title="Membros" subtitle="As pessoas que fazem o Grêmio Politécnico acontecer">
        <p>
          {members.length} membros em {new Set(members.map((m) => m.area)).size} diretorias. Encontre
          alguém pelo nome, cargo ou diretoria.
        </p>
      </SiteHero>

      <main className="mx-auto max-w-6xl space-y-10 bg-white px-4 pb-12 pt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar membro..."
              className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#0B2545] focus:ring-1 focus:ring-[#0B2545]"
            />
          </div>
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-[#0B2545] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1a4a7a]"
          >
            <UserPlus className="h-4 w-4" />
            Novo Membro
          </button>
        </div>

        {areas.length === 0 && (
          <p className="text-center text-sm text-slate-500">Nenhum membro encontrado.</p>
        )}

        {areas.map((area) => (
          <section key={area} className="space-y-4">
            <h2 className="text-xl font-bold text-[#0B2545]">{area}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {grouped[area].map((m) => (
                <MemberCard key={m.id} member={m} />
              ))}
            </div>
          </section>
        ))}
      </main>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="items-center text-center">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#0B2545]/10 text-[#0B2545]">
              <UserPlus className="h-6 w-6" />
            </div>
            <DialogTitle className="text-[#0B2545]">Em breve: Cadastro de Membros</DialogTitle>
            <DialogDescription>
              Logo você poderá adicionar e gerenciar membros diretamente pela plataforma.
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
