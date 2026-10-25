import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  Award, Send, Loader2, CheckCircle2, FileSpreadsheet, Download,
  ListChecks, Plus, Pencil, Trash2, MessageSquare, ChevronDown, User as UserIcon, FileText, ScrollText, Users,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteHero } from "@/components/SiteHero";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { User } from "@/lib/initiatives";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/automacoes")({
  head: () => ({
    meta: [
      { title: "Central de Automações Rápidas | Grêmio Politécnico" },
      { name: "description", content: "Mini-automações para o dia a dia do Grêmio Politécnico da USP." },
      { property: "og:title", content: "Central de Automações Rápidas | Grêmio Politécnico" },
      { property: "og:description", content: "Mini-automações para o dia a dia do Grêmio Politécnico da USP." },
    ],
  }),
  component: Automations,
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const btnCta =
  "inline-flex w-full items-center justify-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-bold text-accent-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:pointer-events-none disabled:opacity-70";
const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-secondary disabled:opacity-70";

function AutomationCard({ icon, title, desc, tag, children }: { icon: ReactNode; title: string; desc: string; tag: string; children: ReactNode }) {
  return (
    <article className="group flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated">
      <div className="flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground transition group-hover:bg-accent group-hover:text-accent-foreground">
          {icon}
        </div>
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">{tag}</span>
      </div>
      <h3 className="mt-5 text-lg font-bold text-primary">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{desc}</p>
      <div className="mt-6 space-y-3">{children}</div>
    </article>
  );
}

/* 1. Certificados */
function Certificates() {
  const input = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<"idle" | "running" | "done">("idle");
  const [progress, setProgress] = useState(0);
  const [file, setFile] = useState("");
  const total = 247;

  const run = async (name: string) => {
    setFile(name); setState("running"); setProgress(0);
    for (let p = 0; p <= 100; p += 5) { setProgress(p); await sleep(90); }
    setState("done");
    toast.success("Automação executada com sucesso!", { description: `${total} certificados gerados a partir de ${name}.` });
  };

  return (
    <AutomationCard icon={<Award className="h-6 w-6" />} tag="Eventos" title="Gerador de Certificados"
      desc="Faça o upload do CSV do Even3 e gere todos os PDFs de certificados formatados de uma só vez para impressão.">
      <input ref={input} type="file" accept=".csv" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) run(f.name); e.target.value = ""; }} />
      {state === "running" && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><FileSpreadsheet className="h-3.5 w-3.5" />{file}</span>
            <span>{Math.round((progress / 100) * total)}/{total}</span>
          </div>
          <Progress value={progress} />
        </div>
      )}
      {state === "done" ? (
        <>
          <div className="flex items-center gap-2 rounded-md bg-success/10 p-3 text-sm font-medium text-success">
            <CheckCircle2 className="h-4 w-4" /> {total} PDFs prontos para impressão
          </div>
          <div className="flex gap-2">
            <button className={btnPrimary + " flex-1"} onClick={() => toast.info("Download simulado: certificados.zip")}>
              <Download className="h-4 w-4" /> Baixar ZIP
            </button>
            <button className="rounded-md border border-border px-3 text-sm font-medium text-foreground hover:bg-muted" onClick={() => setState("idle")}>Nova</button>
          </div>
        </>
      ) : (
        <>
          <button className={btnCta} disabled={state === "running"} onClick={() => input.current?.click()}>
            {state === "running" ? <><Loader2 className="h-4 w-4 animate-spin" /> Gerando...</> : "Iniciar Geração"}
          </button>
          {state === "idle" && (
            <button className="w-full text-xs font-medium text-secondary underline-offset-2 hover:underline" onClick={() => run("inscritos_even3_semana.csv")}>
              Usar CSV de exemplo
            </button>
          )}
        </>
      )}
    </AutomationCard>
  );
}

/* 5. Lista de Tarefas */
type TaskStatus = "pendente" | "em andamento" | "espera" | "feito";
type TaskComment = { id: string; autor: string; texto: string; data: string };
type Task = { id: string; titulo: string; responsavel: string; status: TaskStatus; comentarios: TaskComment[] };
type TaskDraft = { titulo: string; responsavel: string; status: TaskStatus };

const taskStatuses: TaskStatus[] = ["pendente", "em andamento", "espera", "feito"];
const statusLabel: Record<TaskStatus, string> = {
  pendente: "Pendente",
  "em andamento": "Em andamento",
  espera: "Em espera",
  feito: "Feito",
};
const statusStyle: Record<TaskStatus, string> = {
  pendente: "bg-primary/10 text-primary",
  "em andamento": "bg-warning/10 text-warning",
  espera: "bg-muted text-muted-foreground",
  feito: "bg-success/10 text-success",
};

const TASKS_KEY = "gremio:tarefas";
const uid = () => Math.random().toString(36).slice(2, 10);
const now = () =>
  new Date().toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

const seed = (titulo: string, responsavel: string, status: TaskStatus, comentarios: [string, string][] = []): Task => ({
  id: uid(),
  titulo,
  responsavel,
  status,
  comentarios: comentarios.map(([autor, texto]) => ({ id: uid(), autor, texto, data: "20/10, 19:00" })),
});

// Tarefas iniciais baseadas na ata da primeira reunião aberta do Hack@Poli 2026
const seedTasks: Task[] = [
  seed("Buscar patrocinadores", "Todo mundo", "em andamento"),
  seed("Escrever mensagens padrão", "Tarsila", "pendente"),
  seed("Fazer apresentação institucional", "Tarsila", "espera"),
  seed("Reservar o lugar (Inova)", "Tarsila", "em andamento", [["Ata", "Só falta assinar os documentos!"]]),
  seed("Oferecimento de AEx", "JUSP", "em andamento", [["Ata", "Quase aprovado!"]]),
  seed("Definição dos entregáveis", "Claude", "feito"),
  seed("Fazer planilha de contatos", "Tarsila", "feito"),
  seed("Administração do Even3", "Tarsila", "em andamento"),
  seed("Mentorias: convidar os mentores", "Tarsila", "pendente"),
  seed("Identidade visual", "Samueu", "feito"),
  seed("Divulgação: posts no Instagram do Grêmio", "Arthur", "pendente"),
  seed("Divulgação: booms no WhatsApp", "Nicoly", "pendente"),
  seed("Coordenação geral", "", "pendente"),
  seed("Cadastro na abertura (QR code e crachás)", "Nicoly", "pendente"),
  seed("Comprar materiais (crachás, banner...)", "Victor", "pendente"),
  seed("Geral do espaço (wifi, cadeiras...)", "Tarsila", "pendente"),
  seed("Comissão avaliadora", "Tarsila", "pendente"),
  seed("Mentorias: receber, instruir e auxiliar", "Arthur", "pendente"),
  seed("Coffee break", "Tarsila", "pendente"),
  seed("Audiovisual (microfones, telão)", "Tarsila", "pendente"),
  seed("Fotos durante o evento", "JUSP", "pendente"),
  seed("Fazer os certificados", "", "pendente"),
  seed("Documento separado do regulamento", "Stitch", "pendente"),
  seed("Escrever critérios de avaliação do regulamento", "Todo mundo", "pendente"),
];

const fieldCls =
  "w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary";

function TaskForm({ initial, submitLabel, onSubmit, onCancel }: {
  initial: TaskDraft;
  submitLabel: string;
  onSubmit: (v: TaskDraft) => void;
  onCancel: () => void;
}) {
  const [v, setV] = useState<TaskDraft>(initial);
  return (
    <form
      className="space-y-3 rounded-lg border border-border bg-muted/40 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!v.titulo.trim()) { toast.error("Dê um título para a tarefa."); return; }
        onSubmit({ ...v, titulo: v.titulo.trim(), responsavel: v.responsavel.trim() });
      }}
    >
      <input autoFocus className={fieldCls} placeholder="Título da tarefa" value={v.titulo}
        onChange={(e) => setV({ ...v, titulo: e.target.value })} />
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={fieldCls} placeholder="Responsável" value={v.responsavel}
          onChange={(e) => setV({ ...v, responsavel: e.target.value })} />
        <select className={fieldCls} value={v.status}
          onChange={(e) => setV({ ...v, status: e.target.value as TaskStatus })}>
          {taskStatuses.map((s) => <option key={s} value={s}>{statusLabel[s]}</option>)}
        </select>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">
          Cancelar
        </button>
        <button type="submit" className={btnPrimary}>{submitLabel}</button>
      </div>
    </form>
  );
}

function TaskList({ autor }: { autor: string }) {
  const [open, setOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>(seedTasks);
  const loaded = useRef(false);
  const [filter, setFilter] = useState<"todas" | TaskStatus>("todas");
  const [creating, setCreating] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  // Persistência local (navegador)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(TASKS_KEY);
      if (raw) setTasks(JSON.parse(raw));
    } catch { /* ignore */ }
    loaded.current = true;
  }, []);
  useEffect(() => {
    if (!loaded.current) return;
    try { localStorage.setItem(TASKS_KEY, JSON.stringify(tasks)); } catch { /* ignore */ }
  }, [tasks]);

  const done = tasks.filter((t) => t.status === "feito").length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const visible = filter === "todas" ? tasks : tasks.filter((t) => t.status === filter);

  const patch = (id: string, p: Partial<Task>) =>
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...p } : t)));

  const create = (v: TaskDraft) => {
    const t: Task = { id: uid(), ...v, comentarios: [] };
    setTasks((ts) => [t, ...ts]);
    setCreating(false);
    toast.success("Tarefa criada!");
  };

  const save = (id: string, v: TaskDraft) => {
    patch(id, v);
    setEditing(null);
    toast.success("Tarefa atualizada!");
  };

  const remove = (t: Task) => {
    if (!window.confirm(`Excluir a tarefa "${t.titulo}"?`)) return;
    setTasks((ts) => ts.filter((x) => x.id !== t.id));
    setExpanded(null);
    toast.success("Tarefa excluída.");
  };

  const addComment = (t: Task) => {
    const texto = draft.trim();
    if (!texto) return;
    patch(t.id, { comentarios: [...t.comentarios, { id: uid(), autor, texto, data: now() }] });
    setDraft("");
  };

  const removeComment = (t: Task, cid: string) =>
    patch(t.id, { comentarios: t.comentarios.filter((c) => c.id !== cid) });

  const toggle = (id: string) => {
    setExpanded((cur) => (cur === id ? null : id));
    setEditing(null);
    setDraft("");
  };

  return (
    <AutomationCard icon={<ListChecks className="h-6 w-6" />} tag="Projeto" title="Lista de Tarefas"
      desc="Veja todas as tarefas do projeto, quem é o responsável, o status e os comentários. Crie, edite e acompanhe tudo em um só lugar.">
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{done}/{tasks.length} concluídas</span>
          <span>{pct}%</span>
        </div>
        <Progress value={pct} />
      </div>
      <button className={btnCta} onClick={() => setOpen(true)}>Abrir Tarefas</button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-primary">Lista de Tarefas</DialogTitle>
            <DialogDescription>Clique em uma tarefa para ver detalhes, comentar ou editar.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              {(["todas", ...taskStatuses] as const).map((f) => {
                const count = f === "todas" ? tasks.length : tasks.filter((t) => t.status === f).length;
                return (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
                    }`}>
                    {f === "todas" ? "Todas" : statusLabel[f]} · {count}
                  </button>
                );
              })}
            </div>
            <button className={btnPrimary} onClick={() => setCreating((c) => !c)}>
              <Plus className="h-4 w-4" /> Nova tarefa
            </button>
          </div>

          {creating && (
            <TaskForm initial={{ titulo: "", responsavel: "", status: "pendente" }} submitLabel="Criar tarefa"
              onSubmit={create} onCancel={() => setCreating(false)} />
          )}

          <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
            {visible.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma tarefa nesse filtro.</p>
            )}
            {visible.map((t) => {
              const isOpen = expanded === t.id;
              return (
                <div key={t.id} className="rounded-lg border border-border bg-card">
                  <button onClick={() => toggle(t.id)}
                    className="flex w-full items-center gap-3 p-3 text-left hover:bg-muted/40">
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-semibold ${t.status === "feito" ? "text-muted-foreground line-through" : "text-primary"}`}>
                        {t.titulo}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <UserIcon className="h-3 w-3" />
                        {t.responsavel || <em>Sem responsável</em>}
                      </p>
                    </div>
                    {t.comentarios.length > 0 && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MessageSquare className="h-3.5 w-3.5" /> {t.comentarios.length}
                      </span>
                    )}
                    <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${statusStyle[t.status]}`}>
                      {statusLabel[t.status]}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition ${isOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isOpen && (
                    <div className="space-y-4 border-t border-border p-3">
                      {editing === t.id ? (
                        <TaskForm initial={{ titulo: t.titulo, responsavel: t.responsavel, status: t.status }}
                          submitLabel="Salvar" onSubmit={(v) => save(t.id, v)} onCancel={() => setEditing(null)} />
                      ) : (
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                            Status
                            <select className={fieldCls + " w-auto py-1"} value={t.status}
                              onChange={(e) => patch(t.id, { status: e.target.value as TaskStatus })}>
                              {taskStatuses.map((s) => <option key={s} value={s}>{statusLabel[s]}</option>)}
                            </select>
                          </label>
                          <div className="flex gap-2">
                            <button onClick={() => setEditing(t.id)}
                              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted">
                              <Pencil className="h-3.5 w-3.5" /> Editar
                            </button>
                            <button onClick={() => remove(t)}
                              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10">
                              <Trash2 className="h-3.5 w-3.5" /> Excluir
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Comentários</p>
                        {t.comentarios.length === 0 && (
                          <p className="text-xs text-muted-foreground">Nenhum comentário ainda.</p>
                        )}
                        {t.comentarios.map((c) => (
                          <div key={c.id} className="group flex items-start justify-between gap-2 rounded-md bg-muted p-2.5">
                            <div className="text-sm">
                              <p className="text-xs text-muted-foreground">
                                <span className="font-semibold text-primary">{c.autor}</span> · {c.data}
                              </p>
                              <p className="mt-0.5 text-foreground">{c.texto}</p>
                            </div>
                            <button onClick={() => removeComment(t, c.id)} aria-label="Excluir comentário"
                              className="text-muted-foreground opacity-0 transition hover:text-destructive group-hover:opacity-100">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); addComment(t); }}>
                          <input className={fieldCls} placeholder="Escreva um comentário..." value={draft}
                            onChange={(e) => setDraft(e.target.value)} />
                          <button type="submit" className={btnPrimary}><Send className="h-4 w-4" /></button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </AutomationCard>
  );
}

/* 6. Mensagens Padrão (link para /mensagens) */
function MessageTemplates() {
  const navigate = useNavigate();
  return (
    <AutomationCard icon={<FileText className="h-6 w-6" />} tag="Comunicação" title="Mensagens Padrão"
      desc="Gere mensagens prontas de LinkedIn, e-mail e WhatsApp para patrocinadores e mentores, preenchidas com os dados do contato.">
      <button className={btnCta} onClick={() => navigate({ to: "/mensagens" })}>Abrir Mensagens</button>
    </AutomationCard>
  );
}

/* 7. Regulamento (link para /regulamento) */
function RulesLink() {
  const navigate = useNavigate();
  return (
    <AutomationCard icon={<ScrollText className="h-6 w-6" />} tag="Projeto" title="Regulamento"
      desc="Consulte o regulamento oficial do Hack@Poli 2026: inscrição, participação, desafio, premiação e julgamento.">
      <button className={btnCta} onClick={() => navigate({ to: "/regulamento" })}>Abrir Regulamento</button>
    </AutomationCard>
  );
}

/* 8. Inscritos (link para /inscritos) */
function InscritosLink() {
  const navigate = useNavigate();
  return (
    <AutomationCard icon={<Users className="h-6 w-6" />} tag="Inscrições" title="Inscritos"
      desc="Importe o CSV do Luma e veja os inscritos agrupados por time: contagem, pessoas sem time e pendentes com ou sem time.">
      <button className={btnCta} onClick={() => navigate({ to: "/inscritos" })}>Abrir Inscritos</button>
    </AutomationCard>
  );
}

function Automations() {
  const navigate = useNavigate();
  const [user, setU] = useState<User | null>(null);
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
  if (!user) return null;

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader user={user} onLogout={logout} />
      <SiteHero
        title="Central de Automações"
        subtitle="Nova iniciativa — tarefas repetitivas do Grêmio em um clique"
      />
      <main className="grid gap-6 bg-white px-6 py-10 sm:grid-cols-2 md:px-10 xl:grid-cols-3">
        <TaskList autor={user.name.split(" ")[0] ?? "Você"} />
        <InscritosLink />
        <Certificates />
        <MessageTemplates />
        <RulesLink />
      </main>
    </div>
  );
}
