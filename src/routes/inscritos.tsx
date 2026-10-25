import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { toast } from "sonner";
import { AlertTriangle, Loader2, Pencil, RefreshCw, Search, Upload } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteHero } from "@/components/SiteHero";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { User } from "@/lib/initiatives";
import { supabase } from "@/lib/supabase";
import {
  atualizarTime,
  classificarStatus,
  getInscritos,
  importarInscritos,
  type Inscrito,
  type StatusKey,
  type InscritoImport,
} from "@/lib/inscritos";

export const Route = createFileRoute("/inscritos")({
  head: () => ({
    meta: [
      { title: "Inscritos | Grêmio Politécnico USP" },
      { name: "description", content: "Inscritos do Hack@Poli organizados por time." },
      { property: "og:title", content: "Inscritos | Grêmio Politécnico USP" },
      { property: "og:description", content: "Inscritos do Hack@Poli organizados por time." },
    ],
  }),
  component: Inscritos,
  errorComponent: ({ error, reset }) => (
    <div className="mx-auto max-w-xl space-y-3 p-10 text-center">
      <h1 className="text-lg font-bold text-[#0B2545]">Erro ao carregar Inscritos</h1>
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

/* ---------- Configurações ---------- */

const MIN_TIME = 2; // mínimo de integrantes por time (regulamento)
const MAX_TIME = 5; // máximo de integrantes por time (regulamento)
const MAPA_KEY = "gremio:inscritos:mapa";

// Respostas do campo "time" que significam "não tenho time". Ajuste se aparecerem outras.
const SEM_TIME = /^(sem\b|nao\b|n a$|na$|nenhum|individual|sozinh|ainda nao|procurando|buscando)/;

/* ---------- Helpers ---------- */

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const classificar = classificarStatus;

const statusLabel: Record<StatusKey, string> = {
  aprovado: "Aprovado",
  pendente: "Pendente",
  recusado: "Recusado",
  outro: "Outro",
};

const statusClass: Record<StatusKey, string> = {
  aprovado: "bg-green-100 text-green-800",
  pendente: "bg-amber-100 text-amber-800",
  recusado: "bg-red-100 text-red-700",
  outro: "bg-slate-100 text-slate-600",
};

// Time efetivo da pessoa: o ajuste feito na página vale mais que o do Luma.
function timeDe(i: Inscrito): string {
  const bruto = i.time_corrigido !== null ? i.time_corrigido : i.time_original;
  const v = (bruto ?? "").trim();
  return !v || SEM_TIME.test(norm(v)) ? "" : v;
}

const fmtData = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
};

const fieldCls =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#0B2545] focus:ring-1 focus:ring-[#0B2545]";
const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-md bg-[#0B2545] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1a4a7a] disabled:opacity-60";
const btnOutline =
  "inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-[#0B2545] transition hover:bg-slate-50 disabled:opacity-60";

/* ---------- CSV ---------- */

// Parser simples de CSV (aspas, vírgulas e quebras de linha dentro de campos; vírgula ou ponto e vírgula).
function parseCsv(texto: string): string[][] {
  const t = texto.replace(/^\uFEFF/, "");
  const primeira = t.split(/\r?\n/, 1)[0] ?? "";
  const delim = (primeira.match(/;/g)?.length ?? 0) > (primeira.match(/,/g)?.length ?? 0) ? ";" : ",";

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let aspas = false;

  for (let i = 0; i < t.length; i++) {
    const c = t.charAt(i);
    if (aspas) {
      if (c === '"') {
        if (t.charAt(i + 1) === '"') {
          cell += '"';
          i++;
        } else aspas = false;
      } else cell += c;
    } else if (c === '"') aspas = true;
    else if (c === delim) {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && t.charAt(i + 1) === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

type Campo = "email" | "nome" | "time" | "status" | "data" | "checkin" | "curso" | "ano" | "linkedin" | "telefone";
type Mapa = Record<Campo, string>; // campo -> nome da coluna do CSV ("" = nenhuma)

const camposMapa: { campo: Campo; label: string; obrigatorio?: boolean }[] = [
  { campo: "email", label: "E-mail", obrigatorio: true },
  { campo: "nome", label: "Nome" },
  { campo: "time", label: "Time / equipe" },
  { campo: "status", label: "Status de aprovação" },
  { campo: "data", label: "Data da inscrição" },
  { campo: "checkin", label: "Check-in (data/hora)" },
  { campo: "curso", label: "Engenharia / curso" },
  { campo: "ano", label: "Ano de ingresso" },
  { campo: "linkedin", label: "LinkedIn" },
  { campo: "telefone", label: "Telefone" },
];

// Tenta descobrir sozinho qual coluna é qual (o Luma usa nomes como email, name, created_at, approval_status).
function detectarMapa(headers: string[]): Mapa {
  const achar = (...testes: ((h: string) => boolean)[]) => {
    for (const teste of testes) {
      const h = headers.find((x) => teste(norm(x)));
      if (h) return h;
    }
    return "";
  };

  let salvo: Partial<Mapa> = {};
  try {
    salvo = JSON.parse(localStorage.getItem(MAPA_KEY) ?? "{}") as Partial<Mapa>;
  } catch {
    /* ignore */
  }
  const usar = (campo: Campo, auto: string) => {
    const s = salvo[campo];
    return s !== undefined && (s === "" || headers.includes(s)) ? s : auto;
  };

  return {
    email: usar("email", achar((h) => h === "email", (h) => h.includes("email") || h.includes("e mail"))),
    nome: usar("nome", achar((h) => h === "name" || h === "nome", (h) => h.includes("nome") || h === "first name")),
    data: usar("data", achar((h) => h === "created at", (h) => h.includes("inscri") || h.includes("registered"))),
    status: usar("status", achar((h) => h === "approval status", (h) => h.includes("status") || h.includes("aprova"))),
    time: usar(
      "time",
      achar(
        (h) => /\b(time|equipe|team|grupo)\b/.test(h) && !h.includes("timezone") && !h.includes("zone"),
      ),
    ),
    checkin: usar("checkin", achar((h) => h === "checked in at", (h) => h.includes("checked in") || h.includes("check in"))),
    curso: usar("curso", achar((h) => h.includes("engenharia"), (h) => h.includes("curso"))),
    ano: usar("ano", achar((h) => h.includes("ano") && h.includes("ingress"))),
    linkedin: usar("linkedin", achar((h) => h.includes("linkedin") && !h.includes("click"))),
    telefone: usar("telefone", achar((h) => h === "phone number", (h) => h.includes("telefone") || h.includes("phone"))),
  };
}

function montarImportacao(headers: string[], rows: string[][], mapa: Mapa): InscritoImport[] {
  const idx = (campo: Campo) => (mapa[campo] ? headers.indexOf(mapa[campo]) : -1);
  const get = (r: string[], i: number) => (i >= 0 ? (r[i] ?? "").trim() : "");
  const iEmail = idx("email");
  const porEmail = new Map<string, InscritoImport>();

  for (const r of rows) {
    const email = get(r, iEmail).toLowerCase();
    if (!email.includes("@")) continue;

    const dataBruta = get(r, idx("data"));
    const d = dataBruta ? new Date(dataBruta) : null;
    const checkinBruto = get(r, idx("checkin"));
    const ci = checkinBruto ? new Date(checkinBruto) : null;

    porEmail.set(email, {
      email,
      nome: get(r, idx("nome")) || null,
      telefone: get(r, idx("telefone")) || null,
      curso: get(r, idx("curso")) || null,
      ano_ingresso: get(r, idx("ano")) || null,
      linkedin: get(r, idx("linkedin")) || null,
      inscrito_em: d && !Number.isNaN(d.getTime()) ? d.toISOString() : null,
      checked_in_at: ci && !Number.isNaN(ci.getTime()) ? ci.toISOString() : null,
      status: get(r, idx("status")) || null,
      time_original: get(r, idx("time")) || null,
    });
  }
  return Array.from(porEmail.values());
}

/* ---------- Diálogos ---------- */

type CsvLido = { nome: string; headers: string[]; rows: string[][] };

function MapaDialog({
  csv,
  importando,
  onImportar,
  onClose,
}: {
  csv: CsvLido;
  importando: boolean;
  onImportar: (mapa: Mapa) => void;
  onClose: () => void;
}) {
  const [mapa, setMapa] = useState<Mapa>(() => detectarMapa(csv.headers));
  const total = useMemo(() => montarImportacao(csv.headers, csv.rows, mapa).length, [csv, mapa]);

  return (
    <Dialog open onOpenChange={(o) => !o && !importando && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[#0B2545]">Importar inscritos do Luma</DialogTitle>
          <DialogDescription>
            {csv.nome} · {csv.rows.length} linhas. Confira quais colunas do arquivo são cada campo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {camposMapa.map(({ campo, label, obrigatorio }) => (
            <label key={campo} className="block space-y-1 text-xs font-medium text-slate-600">
              {label}
              {obrigatorio ? " *" : ""}
              <select
                className={fieldCls}
                value={mapa[campo]}
                onChange={(e) => setMapa((m) => ({ ...m, [campo]: e.target.value }))}
              >
                <option value="">— nenhuma —</option>
                {csv.headers.map((h) => (
                  <option key={h} value={h}>
                    {h.length > 70 ? `${h.slice(0, 70)}…` : h}
                  </option>
                ))}
              </select>
            </label>
          ))}

          {!mapa.time && (
            <p className="flex items-start gap-2 rounded-md bg-amber-50 p-3 text-xs text-amber-800">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Sem a coluna de time, todos entrarão como "sem time" até você ajustar na página.
            </p>
          )}

          <div className="flex items-center justify-between gap-2 pt-2">
            <p className="text-xs text-slate-500">{total} inscritos com e-mail válido</p>
            <div className="flex gap-2">
              <button className={btnOutline} onClick={onClose} disabled={importando}>
                Cancelar
              </button>
              <button
                className={btnPrimary}
                disabled={importando || !mapa.email || total === 0}
                onClick={() => onImportar(mapa)}
              >
                {importando && <Loader2 className="h-4 w-4 animate-spin" />}
                Importar
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type AlvoTime =
  | { tipo: "pessoa"; inscrito: Inscrito }
  | { tipo: "time"; nome: string; ids: string[] };

function TimeDialog({
  alvo,
  sugestoes,
  saving,
  onSalvar,
  onClose,
}: {
  alvo: AlvoTime;
  sugestoes: string[];
  saving: boolean;
  onSalvar: (valor: string | null) => void; // null = voltar ao original do Luma; "" = sem time
  onClose: () => void;
}) {
  const pessoa = alvo.tipo === "pessoa";
  const [valor, setValor] = useState(pessoa ? timeDe(alvo.inscrito) : alvo.nome);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!valor.trim()) {
      toast.error(pessoa ? "Digite o time ou use “Deixar sem time”." : "Digite o novo nome do time.");
      return;
    }
    onSalvar(valor.trim());
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !saving && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#0B2545]">{pessoa ? "Mover para um time" : "Renomear time"}</DialogTitle>
          <DialogDescription>
            {pessoa
              ? `${alvo.inscrito.nome ?? alvo.inscrito.email}. Escolha um time existente (isso une grafias diferentes) ou digite um novo.`
              : `Vale para as ${alvo.ids.length} pessoas deste time. Use o nome de outro time para uni-los.`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-3">
          <input
            autoFocus
            className={fieldCls}
            list="inscritos-times"
            placeholder="Nome do time"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
          />
          <datalist id="inscritos-times">
            {sugestoes.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            {pessoa ? (
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => onSalvar("")}
                  className="rounded-md px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-60"
                >
                  Deixar sem time
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => onSalvar(null)}
                  className="rounded-md px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-60"
                >
                  Restaurar do Luma
                </button>
              </div>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button type="button" className={btnOutline} onClick={onClose} disabled={saving}>
                Cancelar
              </button>
              <button type="submit" className={btnPrimary} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Salvar
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Página ---------- */

type Grupo = { nome: string; membros: Inscrito[] };
type Filtro = "todos" | "pendente" | "aprovado" | "recusado";

function PessoaLinha({ i, onMover }: { i: Inscrito; onMover: () => void }) {
  const st = classificar(i.status);
  return (
    <li className="flex items-center gap-2 py-1.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[#0B2545]">{i.nome ?? i.email}</p>
        <p className="truncate text-xs text-slate-500">
          {[i.nome ? i.email : null, i.curso, i.ano_ingresso ? `ingresso ${i.ano_ingresso}` : null, fmtData(i.inscrito_em)]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
      <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${statusClass[st]}`} title={i.status ?? ""}>
        {statusLabel[st]}
      </span>
      <button
        type="button"
        onClick={onMover}
        aria-label={`Mover ${i.nome ?? i.email} de time`}
        className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-[#0B2545]"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}

function Stat({ label, valor, destaque }: { label: string; valor: number; destaque?: boolean }) {
  return (
    <div className={`rounded-lg border p-4 ${destaque ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white"}`}>
      <p className="text-2xl font-bold text-[#0B2545]">{valor}</p>
      <p className="mt-0.5 text-xs text-slate-600">{label}</p>
    </div>
  );
}

function Inscritos() {
  const navigate = useNavigate();
  const [user, setU] = useState<User | null>(null);

  const [inscritos, setInscritos] = useState<Inscrito[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [query, setQuery] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const fileRef = useRef<HTMLInputElement>(null);
  const [csv, setCsv] = useState<CsvLido | null>(null);
  const [importando, setImportando] = useState(false);

  const [alvo, setAlvo] = useState<AlvoTime | null>(null);
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

  // Carrega os inscritos depois do login. Todos os hooks ficam ANTES do "return null" abaixo.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function carregar() {
      setLoading(true);
      setError(null);
      try {
        const data = await getInscritos();
        if (!cancelled) setInscritos(data);
      } catch (err) {
        if (cancelled) return;
        console.error("Erro ao carregar inscritos:", err);
        setError(err instanceof Error ? err.message : "Falha ao carregar inscritos.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void carregar();
    return () => {
      cancelled = true;
    };
  }, [user, reloadKey]);

  // Agrupamento por time (grafias parecidas, como "Time Alfa" e "time alfa", caem no mesmo grupo).
  const { grupos, semTime } = useMemo(() => {
    const mapa = new Map<string, { grafias: Map<string, number>; membros: Inscrito[] }>();
    const sem: Inscrito[] = [];

    for (const i of inscritos) {
      const t = timeDe(i);
      if (!t) {
        sem.push(i);
        continue;
      }
      const k = norm(t);
      const g = mapa.get(k) ?? { grafias: new Map<string, number>(), membros: [] };
      g.grafias.set(t, (g.grafias.get(t) ?? 0) + 1);
      g.membros.push(i);
      mapa.set(k, g);
    }

    const lista: Grupo[] = Array.from(mapa.values()).map((g) => ({
      nome: Array.from(g.grafias.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "",
      membros: g.membros,
    }));
    lista.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    return { grupos: lista, semTime: sem };
  }, [inscritos]);

  // Números do topo (pessoas recusadas não entram na contagem de times nem de "sem time").
  const stats = useMemo(() => {
    const ativo = (i: Inscrito) => classificar(i.status) !== "recusado";
    const pend = inscritos.filter((i) => classificar(i.status) === "pendente");
    const gruposAtivos = grupos.filter((g) => g.membros.some(ativo));
    return {
      total: inscritos.length,
      times: gruposAtivos.length,
      foraDoLimite: gruposAtivos.filter((g) => {
        const n = g.membros.filter(ativo).length;
        return n < MIN_TIME || n > MAX_TIME;
      }).length,
      semTime: semTime.filter(ativo).length,
      aprovados: inscritos.filter((i) => classificar(i.status) === "aprovado").length,
      pendentes: pend.length,
      pendComTime: pend.filter((i) => timeDe(i)).length,
      pendSemTime: pend.filter((i) => !timeDe(i)).length,
    };
  }, [inscritos, grupos, semTime]);

  const nomesDeTimes = useMemo(() => grupos.map((g) => g.nome), [grupos]);

  // Filtros e busca da lista exibida.
  const q = norm(query);
  const passa = (i: Inscrito, nomeTime: string) =>
    (filtro === "todos" || classificar(i.status) === filtro) &&
    (!q || norm(`${i.nome ?? ""} ${i.email} ${nomeTime}`).includes(q));

  const gruposVisiveis = grupos
    .map((g) => ({ ...g, visiveis: g.membros.filter((m) => passa(m, g.nome)) }))
    .filter((g) => g.visiveis.length > 0);
  const semTimeVisiveis = semTime.filter((m) => passa(m, ""));

  if (!user) return null;

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  /* --- importação --- */
  const onArquivo = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    try {
      const rows = parseCsv(await file.text());
      const [headers, ...dados] = rows;
      if (!headers || dados.length === 0) {
        toast.error("O arquivo está vazio ou não parece um CSV do Luma.");
        return;
      }
      setCsv({ nome: file.name, headers: headers.map((h) => h.trim()), rows: dados });
    } catch {
      toast.error("Não foi possível ler o arquivo.");
    }
  };

  const importar = async (mapa: Mapa) => {
    if (!csv) return;
    const linhas = montarImportacao(csv.headers, csv.rows, mapa);
    const jaExistem = new Set(inscritos.map((i) => i.email));
    const novos = linhas.filter((l) => !jaExistem.has(l.email)).length;

    setImportando(true);
    try {
      await importarInscritos(linhas);
      try {
        localStorage.setItem(MAPA_KEY, JSON.stringify(mapa));
      } catch {
        /* ignore */
      }
      toast.success("Inscritos importados", {
        description: `${novos} novos e ${linhas.length - novos} atualizados.`,
      });
      setCsv(null);
      setReloadKey((k) => k + 1);
    } catch (err) {
      toast.error("Não foi possível importar", { description: err instanceof Error ? err.message : undefined });
    } finally {
      setImportando(false);
    }
  };

  /* --- ajuste de times --- */
  const salvarTime = async (valor: string | null) => {
    if (!alvo) return;
    const ids = alvo.tipo === "pessoa" ? [alvo.inscrito.id] : alvo.ids;
    setSaving(true);
    try {
      await atualizarTime(ids, valor);
      setInscritos((prev) => prev.map((i) => (ids.includes(i.id) ? { ...i, time_corrigido: valor } : i)));
      toast.success("Time atualizado");
      setAlvo(null);
    } catch (err) {
      toast.error("Não foi possível atualizar", { description: err instanceof Error ? err.message : undefined });
    } finally {
      setSaving(false);
    }
  };

  const filtros: { id: Filtro; label: string }[] = [
    { id: "todos", label: "Todos" },
    { id: "pendente", label: "Pendentes" },
    { id: "aprovado", label: "Aprovados" },
    { id: "recusado", label: "Recusados" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader user={user} onLogout={logout} />

      <SiteHero title="Inscritos" subtitle="Times, pessoas sem time e inscrições pendentes">
        <p>
          Exporte os convidados do Luma em CSV e importe aqui sempre que quiser atualizar. A aprovação
          continua sendo feita no Luma.
        </p>
      </SiteHero>

      <main className="mx-auto max-w-6xl space-y-6 bg-white px-4 pb-12 pt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome, e-mail ou time..."
              aria-label="Buscar inscrito"
              className={fieldCls + " pl-9"}
            />
          </div>
          <div className="flex gap-2">
            <button className={btnOutline} onClick={() => setReloadKey((k) => k + 1)} disabled={loading}>
              <RefreshCw className="h-4 w-4" /> Recarregar
            </button>
            <button className={btnPrimary} onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4" /> Importar CSV do Luma
            </button>
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onArquivo} />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando inscritos…
          </div>
        ) : error ? (
          <div className="space-y-3 py-12 text-center">
            <p className="text-sm text-red-700">{error}</p>
            <button className={btnOutline} onClick={() => setReloadKey((k) => k + 1)}>
              <RefreshCw className="h-4 w-4" /> Tentar novamente
            </button>
          </div>
        ) : inscritos.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">
            Nenhum inscrito ainda. No Luma, exporte os convidados em CSV e use “Importar CSV do Luma”.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <Stat label="Inscritos" valor={stats.total} />
              <Stat label="Times formados" valor={stats.times} />
              <Stat label="Sem time" valor={stats.semTime} destaque={stats.semTime > 0} />
              <Stat label="Pendentes" valor={stats.pendentes} />
              <Stat label="Pendentes com time" valor={stats.pendComTime} />
              <Stat label="Pendentes sem time" valor={stats.pendSemTime} destaque={stats.pendSemTime > 0} />
            </div>

            <p className="text-xs text-slate-500">
              {stats.aprovados} aprovados
              {stats.foraDoLimite > 0 &&
                ` · ${stats.foraDoLimite} ${stats.foraDoLimite === 1 ? "time fora" : "times fora"} do limite de ${MIN_TIME} a ${MAX_TIME} pessoas`}
              . Recusados não entram na contagem de times nem de “sem time”.
            </p>

            <div className="flex flex-wrap gap-1.5">
              {filtros.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFiltro(f.id)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    filtro === f.id ? "bg-[#0B2545] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {semTimeVisiveis.length > 0 && (
              <section className="space-y-2 rounded-lg border border-amber-300 bg-amber-50/50 p-4">
                <h2 className="text-lg font-bold text-[#0B2545]">
                  Sem time <span className="text-sm font-medium text-slate-500">({semTimeVisiveis.length})</span>
                </h2>
                <ul className="divide-y divide-amber-200/70">
                  {semTimeVisiveis.map((i) => (
                    <PessoaLinha key={i.id} i={i} onMover={() => setAlvo({ tipo: "pessoa", inscrito: i })} />
                  ))}
                </ul>
              </section>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {gruposVisiveis.map((g) => {
                const ativos = g.membros.filter((m) => classificar(m.status) !== "recusado").length;
                const fora = ativos < MIN_TIME || ativos > MAX_TIME;
                const pend = g.membros.filter((m) => classificar(m.status) === "pendente").length;
                return (
                  <section key={g.nome} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <h3 className="truncate font-bold text-[#0B2545]">{g.nome}</h3>
                      <button
                        type="button"
                        onClick={() => setAlvo({ tipo: "time", nome: g.nome, ids: g.membros.map((m) => m.id) })}
                        aria-label={`Renomear ${g.nome}`}
                        className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-[#0B2545]"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                      <span>
                        {ativos} {ativos === 1 ? "pessoa" : "pessoas"}
                      </span>
                      {pend > 0 && <span className="text-amber-700">· {pend} pendente{pend > 1 ? "s" : ""}</span>}
                      {fora && (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-800">
                          <AlertTriangle className="h-3 w-3" /> fora de {MIN_TIME}–{MAX_TIME}
                        </span>
                      )}
                    </div>
                    <ul className="divide-y divide-slate-100">
                      {g.visiveis.map((i) => (
                        <PessoaLinha key={i.id} i={i} onMover={() => setAlvo({ tipo: "pessoa", inscrito: i })} />
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>

            {gruposVisiveis.length === 0 && semTimeVisiveis.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-500">Nenhum inscrito encontrado.</p>
            )}
          </>
        )}
      </main>

      {csv && <MapaDialog csv={csv} importando={importando} onImportar={importar} onClose={() => setCsv(null)} />}

      {alvo && (
        <TimeDialog
          key={alvo.tipo === "pessoa" ? alvo.inscrito.id : alvo.nome}
          alvo={alvo}
          sugestoes={nomesDeTimes}
          saving={saving}
          onSalvar={salvarTime}
          onClose={() => setAlvo(null)}
        />
      )}
    </div>
  );
}
