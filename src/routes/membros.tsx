import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Loader2, Mail, Pencil, Phone, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteHero } from "@/components/SiteHero";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { User } from "@/lib/initiatives";
import { supabase } from "@/lib/supabase";
import {
  atualizarMembro,
  criarMembro,
  excluirMembro,
  getMembros,
  type Membro,
} from "@/lib/membros";

export const Route = createFileRoute("/membros")({
  head: () => ({
    meta: [
      { title: "Membros | Grêmio Politécnico USP" },
      { name: "description", content: "Conheça os membros do Grêmio Politécnico." },
      { property: "og:title", content: "Membros | Grêmio Politécnico USP" },
      { property: "og:description", content: "Conheça os membros do Grêmio Politécnico." },
    ],
  }),
  component: Membros,
  // Mostra o erro real (em vez do genérico "This page didn't load") para facilitar o diagnóstico.
  errorComponent: ({ error, reset }) => (
    <div className="mx-auto max-w-xl space-y-3 p-10 text-center">
      <h1 className="text-lg font-bold text-[#0B2545]">Erro ao carregar Membros</h1>
      <pre className="whitespace-pre-wrap rounded bg-slate-100 p-3 text-left text-xs text-red-700">
        {error instanceof Error ? error.message : String(error)}
      </pre>
      <button
        onClick={reset}
        className="rounded-md bg-[#0B2545] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1a4a7a]"
      >
        Tentar novamente
      </button>
    </div>
  ),
});

/* ---------- Tipos e helpers ---------- */

type MembroInput = Omit<Membro, "id">;

// Valores dos campos do formulário (tudo string; convertido para MembroInput ao salvar).
type Draft = {
  nome: string;
  cargo: string;
  curso: string;
  ano_ingresso_curso: string;
  email: string;
  telefone: string;
  status: string;
  image: string;
};

const emptyDraft: Draft = {
  nome: "",
  cargo: "",
  curso: "",
  ano_ingresso_curso: "",
  email: "",
  telefone: "",
  status: "Ativo",
  image: "",
};

const toDraft = (m: Membro): Draft => ({
  nome: m.nome,
  cargo: m.cargo ?? "",
  curso: m.curso ?? "",
  ano_ingresso_curso: m.ano_ingresso_curso?.toString() ?? "",
  email: m.email ?? "",
  telefone: m.telefone ?? "",
  status: m.status ?? "",
  image: m.image ?? "",
});

const vazioParaNull = (v: string) => v.trim() || null;

const toInput = (d: Draft): MembroInput => {
  const ano = d.ano_ingresso_curso.trim();
  return {
    nome: d.nome.trim(),
    cargo: vazioParaNull(d.cargo),
    curso: vazioParaNull(d.curso),
    ano_ingresso_curso: ano ? Number(ano) : null,
    email: vazioParaNull(d.email),
    telefone: vazioParaNull(d.telefone),
    status: vazioParaNull(d.status),
    image: vazioParaNull(d.image),
  };
};

const porNome = (a: Membro, b: Membro) => a.nome.localeCompare(b.nome, "pt-BR");

const isAtivo = (status: string | null) => status?.trim().toLowerCase() === "ativo";

const statusClass = (status: string | null) => {
  const s = status?.trim().toLowerCase();
  if (s === "ativo") return "bg-green-100 text-green-800";
  if (s === "inativo") return "bg-slate-100 text-slate-600";
  return "bg-[#0B2545]/10 text-[#0B2545]";
};

const erroMsg = (err: unknown, fallback: string) => (err instanceof Error ? err.message : fallback);

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

const fieldCls =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#0B2545] focus:ring-1 focus:ring-[#0B2545]";
const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-md bg-[#0B2545] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1a4a7a] disabled:opacity-60";
const btnOutline =
  "inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-[#0B2545] transition hover:bg-slate-50 disabled:opacity-60";

/* ---------- Componentes ---------- */

// Foto de perfil; se não houver imagem (ou a URL falhar), mostra as iniciais.
function Avatar({ nome, image, className = "h-12 w-12" }: { nome: string; image: string | null; className?: string }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [image]);

  if (image && !failed) {
    return (
      <img
        src={image}
        alt={`Foto de ${nome}`}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`${className} shrink-0 rounded-full border border-slate-200 object-cover`}
      />
    );
  }

  return (
    <div
      className={`${className} flex shrink-0 items-center justify-center rounded-full bg-[#0B2545] text-sm font-semibold text-white`}
    >
      {initials(nome)}
    </div>
  );
}

function MembroCard({ membro, onEdit }: { membro: Membro; onEdit: () => void }) {
  return (
    <div className="flex gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <Avatar nome={membro.nome} image={membro.image} />

      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate font-semibold text-[#0B2545]">{membro.nome}</p>
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Editar ${membro.nome}`}
            className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-[#0B2545]"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>

        {membro.cargo && <p className="truncate text-sm text-slate-600">{membro.cargo}</p>}
        {(membro.curso || membro.ano_ingresso_curso) && (
          <p className="truncate text-xs text-slate-500">
            {[membro.curso, membro.ano_ingresso_curso ? `ingresso ${membro.ano_ingresso_curso}` : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}

        <div className="space-y-0.5 pt-1">
          {membro.email && (
            <a
              href={`mailto:${membro.email}`}
              className="flex items-center gap-1.5 truncate text-xs text-[#1a4a7a] hover:underline"
            >
              <Mail className="h-3 w-3 shrink-0" /> {membro.email}
            </a>
          )}
          {membro.telefone && (
            <p className="flex items-center gap-1.5 truncate text-xs text-slate-600">
              <Phone className="h-3 w-3 shrink-0" /> {membro.telefone}
            </p>
          )}
        </div>

        {membro.status && (
          <span className={`mt-2 inline-block rounded px-2 py-0.5 text-[10px] font-bold ${statusClass(membro.status)}`}>
            {membro.status}
          </span>
        )}
      </div>
    </div>
  );
}

function MembroDialog({
  membro,
  statusSugeridos,
  saving,
  onSubmit,
  onDelete,
  onClose,
}: {
  membro: Membro | null; // null = novo membro
  statusSugeridos: string[];
  saving: boolean;
  onSubmit: (input: MembroInput) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const [d, setD] = useState<Draft>(membro ? toDraft(membro) : emptyDraft);
  const set = (k: keyof Draft, v: string) => setD((prev) => ({ ...prev, [k]: v }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!d.nome.trim()) {
      toast.error("Informe o nome do membro.");
      return;
    }
    const ano = d.ano_ingresso_curso.trim();
    if (ano && (!Number.isInteger(Number(ano)) || Number(ano) < 1900 || Number(ano) > new Date().getFullYear() + 1)) {
      toast.error("Ano de ingresso inválido.");
      return;
    }
    onSubmit(toInput(d));
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !saving && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[#0B2545]">{membro ? "Editar membro" : "Novo membro"}</DialogTitle>
          <DialogDescription>
            {membro ? "Atualize os dados e salve." : "Preencha os dados do novo membro."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-3">
          <label className="block space-y-1 text-xs font-medium text-slate-600">
            Nome *
            <input autoFocus className={fieldCls} value={d.nome} onChange={(e) => set("nome", e.target.value)} />
          </label>

          <div className="flex items-end gap-3">
            <Avatar nome={d.nome || "?"} image={d.image.trim() || null} />
            <label className="block flex-1 space-y-1 text-xs font-medium text-slate-600">
              Foto de perfil (URL da imagem)
              <input
                type="url"
                className={fieldCls}
                placeholder="https://..."
                value={d.image}
                onChange={(e) => set("image", e.target.value)}
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1 text-xs font-medium text-slate-600">
              Cargo
              <input className={fieldCls} value={d.cargo} onChange={(e) => set("cargo", e.target.value)} />
            </label>
            <label className="block space-y-1 text-xs font-medium text-slate-600">
              Status
              <input
                className={fieldCls}
                list="membros-status"
                value={d.status}
                onChange={(e) => set("status", e.target.value)}
              />
              <datalist id="membros-status">
                {statusSugeridos.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
            <label className="block space-y-1 text-xs font-medium text-slate-600">
              Curso
              <input className={fieldCls} value={d.curso} onChange={(e) => set("curso", e.target.value)} />
            </label>
            <label className="block space-y-1 text-xs font-medium text-slate-600">
              Ano de ingresso
              <input
                className={fieldCls}
                inputMode="numeric"
                placeholder="2024"
                value={d.ano_ingresso_curso}
                onChange={(e) => set("ano_ingresso_curso", e.target.value)}
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1 text-xs font-medium text-slate-600">
              E-mail
              <input type="email" className={fieldCls} value={d.email} onChange={(e) => set("email", e.target.value)} />
            </label>
            <label className="block space-y-1 text-xs font-medium text-slate-600">
              Telefone
              <input className={fieldCls} value={d.telefone} onChange={(e) => set("telefone", e.target.value)} />
            </label>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2">
            {onDelete ? (
              <button
                type="button"
                onClick={onDelete}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" /> Excluir
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button type="button" className={btnOutline} onClick={onClose} disabled={saving}>
                Cancelar
              </button>
              <button type="submit" className={btnPrimary} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {membro ? "Salvar" : "Adicionar"}
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Página ---------- */

function Membros() {
  const navigate = useNavigate();
  const [user, setU] = useState<User | null>(null);

  const [membros, setMembros] = useState<Membro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [query, setQuery] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<string>("todos");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Membro | null>(null);
  const [saving, setSaving] = useState(false);

  // Confirma a sessão do Supabase; sem login, volta para a tela inicial.
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

  // Carrega os membros do Supabase depois do login.
  // Todos os hooks ficam ANTES do "return null" condicional mais abaixo.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function carregar() {
      setLoading(true);
      setError(null);
      try {
        const data = await getMembros();
        if (!cancelled) setMembros(data);
      } catch (err) {
        if (cancelled) return;
        console.error("Erro ao carregar membros:", err);
        setError(erroMsg(err, "Falha ao carregar membros."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void carregar();
    return () => {
      cancelled = true;
    };
  }, [user, reloadKey]);

  const statuses = useMemo(
    () =>
      Array.from(new Set(membros.map((m) => m.status?.trim()).filter((s): s is string => !!s))).sort((a, b) =>
        a.localeCompare(b, "pt-BR"),
      ),
    [membros],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return membros.filter((m) => {
      if (statusFiltro !== "todos" && (m.status?.trim() ?? "") !== statusFiltro) return false;
      if (!q) return true;
      return [m.nome, m.cargo, m.curso, m.email].some((v) => v?.toLowerCase().includes(q));
    });
  }, [membros, query, statusFiltro]);

  if (!user) return null;

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  const abrirNovo = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const abrirEdicao = (m: Membro) => {
    setEditing(m);
    setFormOpen(true);
  };

  const fechar = () => {
    setFormOpen(false);
    setEditing(null);
  };

  const salvar = async (input: MembroInput) => {
    setSaving(true);
    try {
      if (editing) {
        const atualizado = await atualizarMembro(editing.id, input);
        setMembros((prev) => prev.map((m) => (m.id === atualizado.id ? atualizado : m)).sort(porNome));
        toast.success("Membro atualizado");
      } else {
        const novo = await criarMembro(input);
        setMembros((prev) => [...prev, novo].sort(porNome));
        toast.success("Membro adicionado");
      }
      fechar();
    } catch (err) {
      toast.error(erroMsg(err, "Não foi possível salvar o membro."));
    } finally {
      setSaving(false);
    }
  };

  const excluir = async () => {
    if (!editing) return;
    if (!window.confirm(`Excluir ${editing.nome}? Essa ação não pode ser desfeita.`)) return;
    setSaving(true);
    try {
      await excluirMembro(editing.id);
      setMembros((prev) => prev.filter((m) => m.id !== editing.id));
      toast.success("Membro excluído");
      fechar();
    } catch (err) {
      toast.error(erroMsg(err, "Não foi possível excluir o membro."));
    } finally {
      setSaving(false);
    }
  };

  const ativos = membros.filter((m) => isAtivo(m.status)).length;

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader user={user} onLogout={logout} />

      <SiteHero title="Membros" subtitle="As pessoas que fazem o Grêmio Politécnico acontecer">
        <p>
          {loading ? "Carregando membros…" : `${membros.length} membros · ${ativos} ativos. Busque por nome, cargo, curso ou e-mail.`}
        </p>
      </SiteHero>

      <main className="mx-auto max-w-6xl space-y-6 bg-white px-4 pb-12 pt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar membro..."
              aria-label="Buscar membro"
              className={fieldCls + " pl-9"}
            />
          </div>
          <button onClick={abrirNovo} disabled={loading} className={btnPrimary}>
            <Plus className="h-4 w-4" />
            Novo Membro
          </button>
        </div>

        {statuses.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {["todos", ...statuses].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFiltro(s)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  statusFiltro === s ? "bg-[#0B2545] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {s === "todos" ? "Todos" : s}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando membros…
          </div>
        ) : error ? (
          <div className="space-y-3 py-12 text-center">
            <p className="text-sm text-red-700">{error}</p>
            <button className={btnOutline} onClick={() => setReloadKey((k) => k + 1)}>
              <RefreshCw className="h-4 w-4" /> Tentar novamente
            </button>
          </div>
        ) : visible.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">
            {membros.length === 0
              ? "Nenhum membro retornado. Se a tabela tem dados no Supabase, confira a policy de SELECT (RLS) da tabela membros."
              : "Nenhum membro encontrado."}
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((m) => (
              <MembroCard key={m.id} membro={m} onEdit={() => abrirEdicao(m)} />
            ))}
          </div>
        )}
      </main>

      {formOpen && (
        <MembroDialog
          key={editing?.id ?? "novo"}
          membro={editing}
          statusSugeridos={Array.from(new Set(["Ativo", "Inativo", ...statuses]))}
          saving={saving}
          onSubmit={salvar}
          onDelete={editing ? excluir : undefined}
          onClose={fechar}
        />
      )}
    </div>
  );
}
