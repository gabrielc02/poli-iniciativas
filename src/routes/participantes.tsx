import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ExternalLink, Loader2, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteHero } from "@/components/SiteHero";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CONTACT_STATUSES,
  STATUS_BADGE_CLASS,
  createEmptyContact,
  filterContacts,
  loadContactsFromCsv,
  normalizeLinkedinUrl,
  sortContacts,
  type Contact,
  type ContactField,
  type ContactSortKey,
  type ContactStatus,
  type SortDirection,
} from "@/lib/contacts";
import { getUser, setUser, type User } from "@/lib/initiatives";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/participantes")({
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
    <div className="relative inline-flex w-full max-w-[9.5rem]">
      <Badge
        className={cn(
          "w-full justify-center truncate px-1.5 py-0.5 pr-5 text-[10px] font-semibold",
          STATUS_BADGE_CLASS[value],
        )}
      >
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

function EditableCell({
  value,
  onChange,
  ariaLabel,
  className,
  displayClassName,
  multiline = false,
  placeholder = "—",
  renderDisplay,
}: {
  value: string;
  onChange: (next: string) => void;
  ariaLabel: string;
  className?: string;
  displayClassName?: string;
  multiline?: boolean;
  placeholder?: string;
  renderDisplay?: (value: string) => ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commit = () => {
    const next = draft.trim();
    setEditing(false);
    if (next !== value) onChange(next);
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      cancel();
      return;
    }
    if (e.key === "Enter" && !multiline) {
      e.preventDefault();
      commit();
    }
    if (e.key === "Enter" && multiline && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      commit();
    }
  };

  if (editing) {
    const fieldClass =
      "w-full max-w-full rounded border border-[#0B2545]/30 bg-white px-1.5 py-0.5 text-xs text-[#0B2545] outline-none focus:border-[#0B2545] focus:ring-1 focus:ring-[#0B2545]";
    return (
      <TableCell className={cn("p-1", className)}>
        {multiline ? (
          <textarea
            ref={inputRef as RefObject<HTMLTextAreaElement>}
            aria-label={ariaLabel}
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={onKeyDown}
            className={cn(fieldClass, "resize-y")}
          />
        ) : (
          <input
            ref={inputRef as RefObject<HTMLInputElement>}
            aria-label={ariaLabel}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={onKeyDown}
            className={fieldClass}
          />
        )}
      </TableCell>
    );
  }

  return (
    <TableCell className={cn("max-w-0 p-1", className)}>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className={cn(
          "block w-full truncate rounded px-0.5 py-0.5 text-left text-xs transition hover:bg-[#0B2545]/5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0B2545]",
          displayClassName,
          !value && "text-muted-foreground",
        )}
        title={value || "Clique para editar"}
      >
        {value ? (renderDisplay ? renderDisplay(value) : value) : placeholder}
      </button>
    </TableCell>
  );
}

function SortableHead({
  label,
  sortKey,
  activeKey,
  direction,
  onSort,
  className,
}: {
  label: string;
  sortKey: ContactSortKey;
  activeKey: ContactSortKey | null;
  direction: SortDirection;
  onSort: (key: ContactSortKey) => void;
  className?: string;
}) {
  const active = activeKey === sortKey;
  const Icon = !active ? ArrowUpDown : direction === "asc" ? ArrowUp : ArrowDown;

  return (
    <TableHead className={cn("font-semibold text-[#0B2545]", className)}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 rounded px-0.5 py-0.5 transition hover:text-[#1a4a7a] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0B2545]"
        aria-label={`Ordenar por ${label}${active ? `, ${direction === "asc" ? "crescente" : "decrescente"}` : ""}`}
      >
        {label}
        <Icon className={cn("h-3.5 w-3.5", active ? "opacity-100" : "opacity-40")} />
      </button>
    </TableHead>
  );
}

function ContatosPage() {
  const navigate = useNavigate();
  const [user, setU] = useState<User | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<ContactSortKey | null>("empresa");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");
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

  const visible = useMemo(
    () => sortContacts(filterContacts(contacts, query), sortKey, sortDir),
    [contacts, query, sortKey, sortDir],
  );

  if (!user) return null;

  const logout = () => {
    setUser(null);
    navigate({ to: "/", replace: true });
  };

  const toggleSort = (key: ContactSortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("asc");
  };

  const updateField = (id: string, field: ContactField, value: string) => {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const updateStatus = (id: string, status: ContactStatus) => {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
  };

  const addContact = () => {
    const novo = createEmptyContact({
      responsavel: user.name,
      empresa: "Nova empresa",
      nome: "Novo contato",
    });
    setContacts((prev) => [novo, ...prev]);
    setQuery("");
    toast.success("Contato adicionado", {
      description: "Clique nos campos para editar.",
    });
  };

  const removeContact = (id: string) => {
    const target = contacts.find((c) => c.id === id);
    setContacts((prev) => prev.filter((c) => c.id !== id));
    toast.success("Contato removido", {
      description: target?.empresa || target?.nome || "Registro excluído da lista.",
    });
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
          Clique em um campo para editar; adicione ou remova contatos antes do disparo.
        </p>
      </SiteHero>

      <main className="space-y-3 bg-white px-3 pb-8 pt-1 sm:px-4 md:px-6">
        <h2 className="font-display text-center text-xl font-bold uppercase tracking-wide text-[#0B2545] md:text-2xl">
          Gestão de contatos
        </h2>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por empresa, nome ou status…"
              className="h-8 border-[#0B2545]/20 bg-white pl-9 text-xs focus-visible:ring-[#0B2545]"
              aria-label="Buscar contatos"
            />
          </div>
          <div className="flex items-center gap-3">
            <p className="text-xs text-[#0B2545]/70">
              {loading ? "Carregando…" : `${visible.length} de ${contacts.length} contatos`}
            </p>
            <button
              type="button"
              onClick={addContact}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#0B2545] bg-[#0B2545] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#1a4a7a] disabled:opacity-60"
            >
              <Plus className="h-3.5 w-3.5" /> Adicionar
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-[#0B2545]/15 bg-white shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center gap-2 px-6 py-16 text-sm text-[#0B2545]/70">
              <Loader2 className="h-4 w-4 animate-spin" /> Lendo contatosEmpresas.csv…
            </div>
          ) : error ? (
            <div className="px-6 py-12 text-center text-sm text-destructive">{error}</div>
          ) : visible.length === 0 ? (
            <div className="space-y-3 px-6 py-12 text-center text-sm text-[#0B2545]/70">
              <p>
                {query
                  ? `Nenhum contato encontrado para “${query}”.`
                  : "Nenhum contato na lista."}
              </p>
              {!query && (
                <button
                  type="button"
                  onClick={addContact}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[#0B2545] px-3 py-1.5 text-sm font-semibold text-[#0B2545] transition hover:bg-[#0B2545] hover:text-white"
                >
                  <Plus className="h-4 w-4" /> Adicionar contato
                </button>
              )}
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full table-fixed caption-bottom text-xs">
                <colgroup>
                  <col className="w-[12%]" />
                  <col className="w-[11%]" />
                  <col className="w-[14%]" />
                  <col className="w-[9%]" />
                  <col className="w-[5%]" />
                  <col className="w-[10%]" />
                  <col className="w-[11%]" />
                  <col className="w-[14%]" />
                  <col className="w-[8%]" />
                  <col className="w-10" />
                </colgroup>
                <TableHeader>
                  <TableRow className="border-[#0B2545]/10 bg-[#0B2545]/5 hover:bg-[#0B2545]/5">
                    <SortableHead label="Empresa" sortKey="empresa" activeKey={sortKey} direction={sortDir} onSort={toggleSort} className="px-1.5 text-xs" />
                    <SortableHead label="Nome" sortKey="nome" activeKey={sortKey} direction={sortDir} onSort={toggleSort} className="px-1.5 text-xs" />
                    <SortableHead label="Email" sortKey="email" activeKey={sortKey} direction={sortDir} onSort={toggleSort} className="px-1.5 text-xs" />
                    <SortableHead label="Número" sortKey="numero" activeKey={sortKey} direction={sortDir} onSort={toggleSort} className="px-1.5 text-xs" />
                    <SortableHead label="LI" sortKey="linkedin" activeKey={sortKey} direction={sortDir} onSort={toggleSort} className="px-1.5 text-xs" />
                    <SortableHead label="Responsável" sortKey="responsavel" activeKey={sortKey} direction={sortDir} onSort={toggleSort} className="px-1.5 text-xs" />
                    <SortableHead label="Status" sortKey="status" activeKey={sortKey} direction={sortDir} onSort={toggleSort} className="px-1.5 text-xs" />
                    <SortableHead label="Obs." sortKey="observacoes" activeKey={sortKey} direction={sortDir} onSort={toggleSort} className="px-1.5 text-xs" />
                    <SortableHead label="Ramo" sortKey="ramo" activeKey={sortKey} direction={sortDir} onSort={toggleSort} className="px-1.5 text-xs" />
                    <TableHead className="sticky right-0 z-20 w-10 bg-[color-mix(in_oklab,var(--primary)_5%,white)] px-1 text-xs font-semibold text-[#0B2545] shadow-[-4px_0_8px_-4px_rgba(11,37,69,0.15)]">
                      <span className="sr-only">Ações</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((contact) => (
                    <TableRow key={contact.id} className="group border-[#0B2545]/10">
                      <EditableCell
                        displayClassName="font-semibold text-[#0B2545]"
                        ariaLabel="Empresa"
                        value={contact.empresa}
                        onChange={(v) => updateField(contact.id, "empresa", v)}
                      />
                      <EditableCell
                        ariaLabel="Nome"
                        value={contact.nome}
                        onChange={(v) => updateField(contact.id, "nome", v)}
                      />
                      <EditableCell
                        ariaLabel="Email"
                        value={contact.email}
                        onChange={(v) => updateField(contact.id, "email", v)}
                        renderDisplay={(v) => (
                          <span className="text-[#1a4a7a]">{v}</span>
                        )}
                      />
                      <EditableCell
                        ariaLabel="Número"
                        value={contact.numero}
                        onChange={(v) => updateField(contact.id, "numero", v)}
                        displayClassName="tabular-nums"
                      />
                      <EditableCell
                        ariaLabel="LinkedIn"
                        value={contact.linkedin}
                        onChange={(v) => updateField(contact.id, "linkedin", v)}
                        renderDisplay={(v) => {
                          const href = normalizeLinkedinUrl(v);
                          return (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex text-[#1a4a7a]"
                              aria-label="Abrir LinkedIn"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          );
                        }}
                      />
                      <EditableCell
                        ariaLabel="Responsável"
                        value={contact.responsavel}
                        onChange={(v) => updateField(contact.id, "responsavel", v)}
                      />
                      <TableCell className="p-1">
                        <StatusSelect
                          value={contact.status}
                          onChange={(status) => updateStatus(contact.id, status)}
                        />
                      </TableCell>
                      <EditableCell
                        ariaLabel="Observações"
                        value={contact.observacoes}
                        onChange={(v) => updateField(contact.id, "observacoes", v)}
                        multiline
                        displayClassName="text-[#0B2545]/70"
                      />
                      <EditableCell
                        ariaLabel="Ramo"
                        value={contact.ramo}
                        onChange={(v) => updateField(contact.id, "ramo", v)}
                      />
                      <TableCell className="sticky right-0 z-10 w-10 bg-white p-1 shadow-[-4px_0_8px_-4px_rgba(11,37,69,0.12)] group-hover:bg-muted/50">
                        <button
                          type="button"
                          onClick={() => removeContact(contact.id)}
                          aria-label={`Remover ${contact.empresa || contact.nome || "contato"}`}
                          className="rounded-md p-1.5 text-[#0B2545]/45 transition hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
