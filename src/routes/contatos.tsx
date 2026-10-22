import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Loader2, Search } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteHero } from "@/components/SiteHero";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CONTACT_STATUSES,
  STATUS_BADGE_CLASS,
  filterContacts,
  loadContactsFromCsv,
  normalizeLinkedinUrl,
  type Contact,
  type ContactStatus,
} from "@/lib/contacts";
import { getUser, setUser, type User } from "@/lib/initiatives";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/contatos")({
  head: () => ({
    meta: [
      { title: "Contatos | Grêmio Politécnico USP" },
      {
        name: "description",
        content: "Gestão de contatos empresariais do Grêmio Politécnico.",
      },
      { property: "og:title", content: "Contatos | Grêmio Politécnico USP" },
      {
        property: "og:description",
        content: "Gestão de contatos empresariais do Grêmio Politécnico.",
      },
    ],
  }),
  component: ContatosPage,
});

function StatusSelect({
  value,
  onChange,
}: {
  value: ContactStatus;
  onChange: (status: ContactStatus) => void;
}) {
  return (
    <div className="relative inline-flex min-w-[10.5rem]">
      <Badge className={cn("w-full justify-center pr-6 font-semibold", STATUS_BADGE_CLASS[value])}>
        {value}
      </Badge>
      <select
        aria-label="Status do contato"
        className="absolute inset-0 cursor-pointer opacity-0"
        value={value}
        onChange={(e) => onChange(e.target.value as ContactStatus)}
      >
        {CONTACT_STATUSES.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
    </div>
  );
}

function ContatosPage() {
  const navigate = useNavigate();
  const [user, setU] = useState<User | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const u = getUser();
    if (!u) navigate({ to: "/", replace: true });
    else setU(u);
  }, [navigate]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const rows = await loadContactsFromCsv();
        if (!cancelled) setContacts(rows);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Falha ao carregar contatos.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(() => filterContacts(contacts, query), [contacts, query]);

  if (!user) return null;

  const logout = () => {
    setUser(null);
    navigate({ to: "/", replace: true });
  };

  const updateStatus = (id: string, status: ContactStatus) => {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
  };

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader user={user} onLogout={logout} />

      <SiteHero
        title="Contatos empresariais"
        subtitle="Desde 1903 representando os alunos da Poli"
      >
        <p>
          Base carregada de <span className="font-semibold text-white">data/contatosEmpresas.csv</span>.
          Revise status e dados antes de qualquer disparo.
        </p>
      </SiteHero>

      <main className="space-y-5 bg-white px-6 pb-12 pt-2 md:px-10">
        <h2 className="font-display text-center text-2xl font-bold uppercase tracking-wide text-[#0B2545] md:text-3xl">
          Gestão de contatos
        </h2>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por empresa, nome ou status…"
              className="border-[#0B2545]/20 bg-white pl-9 focus-visible:ring-[#0B2545]"
              aria-label="Buscar contatos"
            />
          </div>
          <p className="text-sm text-[#0B2545]/70">
            {loading ? "Carregando…" : `${visible.length} de ${contacts.length} contatos`}
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border border-[#0B2545]/15 bg-white shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center gap-2 px-6 py-16 text-sm text-[#0B2545]/70">
              <Loader2 className="h-4 w-4 animate-spin" /> Lendo contatosEmpresas.csv…
            </div>
          ) : error ? (
            <div className="px-6 py-12 text-center text-sm text-destructive">{error}</div>
          ) : visible.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-[#0B2545]/70">
              Nenhum contato encontrado para “{query}”.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-[#0B2545]/10 bg-[#0B2545]/5 hover:bg-[#0B2545]/5">
                  <TableHead className="min-w-[9rem] px-4 font-semibold text-[#0B2545]">Empresa</TableHead>
                  <TableHead className="min-w-[8rem] font-semibold text-[#0B2545]">Nome</TableHead>
                  <TableHead className="min-w-[12rem] font-semibold text-[#0B2545]">Email</TableHead>
                  <TableHead className="min-w-[8rem] font-semibold text-[#0B2545]">Número</TableHead>
                  <TableHead className="min-w-[6rem] font-semibold text-[#0B2545]">LinkedIn</TableHead>
                  <TableHead className="min-w-[8rem] font-semibold text-[#0B2545]">Responsável</TableHead>
                  <TableHead className="min-w-[11rem] font-semibold text-[#0B2545]">Status</TableHead>
                  <TableHead className="min-w-[14rem] font-semibold text-[#0B2545]">Observações</TableHead>
                  <TableHead className="min-w-[7rem] px-4 font-semibold text-[#0B2545]">Ramo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((contact) => {
                  const linkedin = normalizeLinkedinUrl(contact.linkedin);
                  return (
                    <TableRow key={contact.id} className="border-[#0B2545]/10">
                      <TableCell className="px-4 font-semibold text-[#0B2545]">{contact.empresa}</TableCell>
                      <TableCell>{contact.nome}</TableCell>
                      <TableCell>
                        {contact.email ? (
                          <a
                            href={`mailto:${contact.email}`}
                            className="text-[#1a4a7a] underline-offset-2 hover:underline"
                          >
                            {contact.email}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="tabular-nums">{contact.numero || "—"}</TableCell>
                      <TableCell>
                        {linkedin ? (
                          <a
                            href={linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm font-medium text-[#1a4a7a] underline-offset-2 hover:underline"
                          >
                            Perfil <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>{contact.responsavel || "—"}</TableCell>
                      <TableCell>
                        <StatusSelect
                          value={contact.status}
                          onChange={(status) => updateStatus(contact.id, status)}
                        />
                      </TableCell>
                      <TableCell className="max-w-xs text-[#0B2545]/70">
                        <span className="line-clamp-2" title={contact.observacoes}>
                          {contact.observacoes || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="px-4">{contact.ramo || "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </main>
    </div>
  );
}
