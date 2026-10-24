import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Loader2,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteHero } from "@/components/SiteHero";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  filterContacts,
  normalizeLinkedinUrl,
  sortContacts,
  type Contact,
  type ContactField,
  type ContactSortKey,
  type ContactStatus,
  type SortDirection,
} from "@/lib/contacts";
import { supabase } from "@/lib/supabase";
import type { User } from "@/lib/initiatives";
import { cn } from "@/lib/utils";
import {
  atualizarParceiro,
  criarParceiro,
  excluirParceiro,
  getParceiros,
  type Parceiro,
  type ParceiroInput,
} from "@/lib/parceiros";

export const Route = createFileRoute("/participantes")({
  head: () => ({
    meta: [
      { title: "Parceiros | Grêmio Politécnico USP" },
      {
        name: "description",
        content: "Gestão de parceiros empresariais do Grêmio Politécnico.",
      },
      { property: "og:title", content: "Parceiros | Grêmio Politécnico USP" },
      {
        property: "og:description",
        content: "Gestão de parceiros empresariais do Grêmio Politécnico.",
      },
    ],
  }),
  component: ParceirosPage,
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

// Colunas exportadas, na mesma ordem e com os mesmos cabeçalhos de data/contatosEmpresas.csv.
const CSV_COLUMNS: { field: keyof Contact; header: string }[] = [
  { field: "empresa", header: "Empresa" },
  { field: "nome", header: "Nome" },
  { field: "email", header: "Email" },
  { field: "numero", header: "Número" },
  { field: "linkedin", header: "Linkedin" },
  { field: "responsavel", header: "Responsável" },
  { field: "status", header: "Status" },
  { field: "observacoes", header: "Observações" },
  { field: "ramo", header: "Ramo" },
];

function escapeCsv(value: unknown): string {
  const text = String(value ?? "");
  return /[",;\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function contactsToCsv(contacts: Contact[]): string {
  const header = CSV_COLUMNS.map((c) => escapeCsv(c.header)).join(",");
  const rows = contacts.map((contact) =>
    CSV_COLUMNS.map((c) => escapeCsv(contact[c.field])).join(","),
  );
  return [header, ...rows].join("\n") + "\n";
}

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const PAGE_SIZE = 15;

// Converte o status vindo do Supabase para um status válido da página.
function normalizarStatus(status: string | null): ContactStatus {
  return (
    CONTACT_STATUSES.find((s) => s === status) ??
    CONTACT_STATUSES[0] ??
    ("Novo" as ContactStatus)
  );
}

// Números de página com reticências: 1 … 4 5 6 … 20
function getPageItems(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = Array.from(new Set([1, total, current - 1, current, current + 1]))
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
  const items: (number | "…")[] = [];
  pages.forEach((p, i) => {
    const previousPage = pages[i - 1];
    if (previousPage !== undefined && p - previousPage > 1) {
      items.push("…");
    }
    items.push(p);
  });
  return items;
}

function PaginationBar({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const btn =
    "inline-flex h-7 min-w-7 items-center justify-center rounded-md border border-[#0B2545]/20 px-2 text-xs font-medium text-[#0B2545] transition hover:bg-[#0B2545]/5 disabled:pointer-events-none disabled:opacity-40";

  return (
    <div className="flex flex-col items-center justify-between gap-2 border-t border-[#0B2545]/10 px-3 py-2 sm:flex-row">
      <p className="text-xs text-[#0B2545]/70">
        Mostrando {from}–{to} de {total}
      </p>
      {totalPages > 1 && (
        <nav aria-label="Paginação" className="flex items-center gap-1">
          <button
            type="button"
            className={btn}
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          {getPageItems(page, totalPages).map((item, i) =>
            item === "…" ? (
              <span key={`gap-${i}`} className="px-1 text-xs text-[#0B2545]/50">
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                className={cn(
                  btn,
                  item === page && "border-[#0B2545] bg-[#0B2545] text-white hover:bg-[#0B2545]",
                )}
                aria-current={item === page ? "page" : undefined}
                aria-label={`Página ${item}`}
                onClick={() => onPageChange(item)}
              >
                {item}
              </button>
            ),
          )}
          <button
            type="button"
            className={btn}
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            aria-label="Próxima página"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </nav>
      )}
    </div>
  );
}

// O Supabase lança um objeto simples (PostgrestError), não um Error: extrai a mensagem real.
function mensagemDeErro(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    const e = err as { message?: string; code?: string; hint?: string };
    return [e.message, e.code ? `(código ${e.code})` : "", e.hint ?? ""].filter(Boolean).join(" ");
  }
  return "Erro inesperado ao falar com o Supabase.";
}

const vazioParaNull = (v: string) => v.trim() || null;

// Linha da tabela `parceiros` -> contato exibido na página.
function parceiroToContact(p: Parceiro): Contact {
  return {
    id: p.id,
    empresa: p.nome_organizacao ?? "",
    nome: p.ponto_de_contato ?? "",
    numero: p.telefone ?? "",
    responsavel: p.ponto_de_contato ?? "",
    ramo: p.ramo ?? "",
    linkedin: p.linkedin ?? "",
    email: p.email ?? "",
    status: normalizarStatus(p.status),
    observacoes: p.observacoes ?? "",
  };
}

// Contato exibido -> campos gravados na tabela `parceiros`.
// (A coluna "Responsável" não existe na tabela, por isso não é enviada.)
function contactToInput(c: Contact): ParceiroInput {
  return {
    nome_organizacao: c.empresa.trim(),
    ponto_de_contato: vazioParaNull(c.nome),
    ramo: vazioParaNull(c.ramo),
    linkedin: vazioParaNull(c.linkedin),
    email: vazioParaNull(c.email),
    telefone: vazioParaNull(c.numero),
    status: c.status,
    observacoes: vazioParaNull(c.observacoes),
  };
}

type ParceiroDraft = {
  empresa: string;
  nome: string;
  email: string;
  numero: string;
  linkedin: string;
  ramo: string;
  status: ContactStatus;
  observacoes: string;
};

const dialogFieldCls =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#0B2545] focus:ring-1 focus:ring-[#0B2545]";

// Janela para cadastrar um novo parceiro (mesmo padrão da página de membros).
function ParceiroDialog({
  saving,
  onSubmit,
  onClose,
}: {
  saving: boolean;
  onSubmit: (input: ParceiroInput) => void;
  onClose: () => void;
}) {
  const [d, setD] = useState<ParceiroDraft>({
    empresa: "",
    nome: "",
    email: "",
    numero: "",
    linkedin: "",
    ramo: "",
    status: normalizarStatus(null),
    observacoes: "",
  });
  const set = <K extends keyof ParceiroDraft>(key: K, value: ParceiroDraft[K]) =>
    setD((prev) => ({ ...prev, [key]: value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!d.empresa.trim()) {
      toast.error("Informe o nome da empresa.");
      return;
    }
    onSubmit({
      nome_organizacao: d.empresa.trim(),
      ponto_de_contato: vazioParaNull(d.nome),
      ramo: vazioParaNull(d.ramo),
      linkedin: vazioParaNull(d.linkedin),
      email: vazioParaNull(d.email),
      telefone: vazioParaNull(d.numero),
      status: d.status,
      observacoes: vazioParaNull(d.observacoes),
    });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[#0B2545]">Novo parceiro</DialogTitle>
          <DialogDescription>Preencha os dados do parceiro empresarial.</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-3">
          <label className="block space-y-1 text-xs font-medium text-slate-600">
            Empresa *
            <input
              autoFocus
              className={dialogFieldCls}
              value={d.empresa}
              onChange={(e) => set("empresa", e.target.value)}
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1 text-xs font-medium text-slate-600">
              Nome do contato
              <input className={dialogFieldCls} value={d.nome} onChange={(e) => set("nome", e.target.value)} />
            </label>
            <label className="block space-y-1 text-xs font-medium text-slate-600">
              Ramo
              <input className={dialogFieldCls} value={d.ramo} onChange={(e) => set("ramo", e.target.value)} />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1 text-xs font-medium text-slate-600">
              E-mail
              <input
                type="email"
                className={dialogFieldCls}
                value={d.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </label>
            <label className="block space-y-1 text-xs font-medium text-slate-600">
              Número
              <input className={dialogFieldCls} value={d.numero} onChange={(e) => set("numero", e.target.value)} />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1 text-xs font-medium text-slate-600">
              LinkedIn
              <input
                className={dialogFieldCls}
                placeholder="linkedin.com/company/..."
                value={d.linkedin}
                onChange={(e) => set("linkedin", e.target.value)}
              />
            </label>
            <label className="block space-y-1 text-xs font-medium text-slate-600">
              Status
              <select
                className={dialogFieldCls}
                value={d.status}
                onChange={(e) => set("status", e.target.value as ContactStatus)}
              >
                {CONTACT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block space-y-1 text-xs font-medium text-slate-600">
            Observações
            <textarea
              rows={3}
              className={dialogFieldCls}
              value={d.observacoes}
              onChange={(e) => set("observacoes", e.target.value)}
            />
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-[#0B2545] transition hover:bg-slate-50 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-md bg-[#0B2545] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1a4a7a] disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Adicionar
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ParceirosPage() {
  const navigate = useNavigate();
  const [user, setU] = useState<User | null>(null);
  const [contatos, setContatos] = useState<Contact[]>([]);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<ContactSortKey | null>("empresa");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");
  const [page, setPage] = useState(1);
  const [jumpToId, setJumpToId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Confirma a sessão; sem login, volta para a tela inicial.
  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      const { data, error } = await supabase.auth.getSession();
      if (cancelled) return;

      if (error || !data.session) {
        navigate({ to: "/", replace: true });
        return;
      }

      const authUser = data.session.user;
      setU({
        name:
          authUser.user_metadata?.["name"] ??
          authUser.user_metadata?.["full_name"] ??
          authUser.email?.split("@")[0] ??
          "Usuário",
        email: authUser.email ?? "",
      });
    }

    void checkSession();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const visible = useMemo(
    () => sortContacts(filterContacts(contatos, query), sortKey, sortDir),
    [contatos, query, sortKey, sortDir],
  );

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageContacts = visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Após adicionar um contato, vai para a página onde ele ficou (conforme a ordenação).
  useEffect(() => {
    if (!jumpToId) return;
    const idx = visible.findIndex((c) => c.id === jumpToId);
    if (idx >= 0) setPage(Math.floor(idx / PAGE_SIZE) + 1);
    setJumpToId(null);
  }, [jumpToId, visible]);

  // Carrega os parceiros do Supabase somente depois que a sessão foi confirmada.
  // IMPORTANTE: todo hook precisa ficar ANTES do "return null" condicional abaixo.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function carregar() {
      setLoading(true);
      setError(null);

      try {
        const data = await getParceiros();
        if (cancelled) return;

        setContatos(data.map(parceiroToContact));
      } catch (err) {
        if (cancelled) return;
        console.error("Erro ao carregar parceiros:", err);
        setError(mensagemDeErro(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void carregar();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) return null;

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  const toggleSort = (key: ContactSortKey) => {
    setPage(1);
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("asc");
  };

  // Grava no Supabase a versão nova do contato; se falhar, desfaz a alteração na tela.
  const persistirEdicao = async (anterior: Contact, novo: Contact) => {
    try {
      await atualizarParceiro(novo.id, contactToInput(novo));
    } catch (err) {
      setContatos((prev) => prev.map((c) => (c.id === anterior.id ? anterior : c)));
      toast.error("Não foi possível salvar a alteração", { description: mensagemDeErro(err) });
    }
  };

  const updateField = (id: string, field: ContactField, value: string) => {
    const anterior = contatos.find((c) => c.id === id);
    if (!anterior) return;
    const novo = { ...anterior, [field]: value } as Contact;
    setContatos((prev) => prev.map((c) => (c.id === id ? novo : c)));
    // "Responsável" não existe na tabela: a edição fica só na tela.
    if (field !== "responsavel") void persistirEdicao(anterior, novo);
  };

  const updateStatus = (id: string, status: ContactStatus) => {
    const anterior = contatos.find((c) => c.id === id);
    if (!anterior) return;
    const novo = { ...anterior, status };
    setContatos((prev) => prev.map((c) => (c.id === id ? novo : c)));
    void persistirEdicao(anterior, novo);
  };

  const addContact = () => setFormOpen(true);

  const salvarNovo = async (input: ParceiroInput) => {
    setSaving(true);
    try {
      const criado = await criarParceiro(input);
      const novo = parceiroToContact(criado);
      setContatos((prev) => [novo, ...prev]);
      setQuery("");
      setJumpToId(novo.id);
      setFormOpen(false);
      toast.success("Parceiro adicionado", { description: novo.empresa });
    } catch (err) {
      toast.error("Não foi possível adicionar o parceiro", { description: mensagemDeErro(err) });
    } finally {
      setSaving(false);
    }
  };

  const removeContact = async (id: string) => {
    const target = contatos.find((c) => c.id === id);
    const nome = target?.empresa || target?.nome || "este contato";
    if (!window.confirm(`Remover ${nome}? Essa ação não pode ser desfeita.`)) return;
    try {
      await excluirParceiro(id);
      setContatos((prev) => prev.filter((c) => c.id !== id));
      toast.success("Parceiro removido", { description: nome });
    } catch (err) {
      toast.error("Não foi possível remover o parceiro", { description: mensagemDeErro(err) });
    }
  };

  const exportCsv = () => {
    downloadCsv(contactsToCsv(contatos), "contatosEmpresas.csv");
    toast.success("CSV exportado", {
      description: `${contatos.length} parceiros exportados.`,
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader user={user} onLogout={logout} />

      <SiteHero
        title="Parceiros empresariais"
        subtitle="Desde 1903 representando os alunos da Poli"
      >
        <p>
          Base carregada do Supabase. Use “Adicionar” para cadastrar um parceiro e clique em um
          campo da tabela para editar; as alterações são salvas automaticamente. “Baixar CSV”
          exporta a lista atual.
        </p>
      </SiteHero>

      <main className="space-y-3 bg-white px-3 pb-8 pt-1 sm:px-4 md:px-6">
        <h2 className="font-display text-center text-xl font-bold uppercase tracking-wide text-[#0B2545] md:text-2xl">
          Gestão de parceiros
        </h2>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar por empresa, nome ou status…"
              className="h-8 border-[#0B2545]/20 bg-white pl-9 text-xs focus-visible:ring-[#0B2545]"
              aria-label="Buscar parceiros"
            />
          </div>
          <div className="flex items-center gap-3">
            <p className="text-xs text-[#0B2545]/70">
              {loading ? "Carregando…" : `${visible.length} de ${contatos.length} parceiros`}
            </p>
            <button
              type="button"
              onClick={exportCsv}
              disabled={loading || contatos.length === 0}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#0B2545] px-3 py-1.5 text-xs font-semibold text-[#0B2545] transition hover:bg-[#0B2545] hover:text-white disabled:opacity-60"
            >
              <Download className="h-3.5 w-3.5" /> Baixar CSV
            </button>
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
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando parceiros…
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
            <>
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
                  {pageContacts.map((contact) => (
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
            <PaginationBar
              page={currentPage}
              totalPages={totalPages}
              total={visible.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
            </>
          )}
        </div>
      </main>

      {formOpen && (
        <ParceiroDialog saving={saving} onSubmit={salvarNovo} onClose={() => setFormOpen(false)} />
      )}
    </div>
  );
}
