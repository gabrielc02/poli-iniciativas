import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  Award, Send, MessageCircle, DoorOpen, Loader2, CheckCircle2, Copy, FileSpreadsheet, Download, Zap,
  Users, ListChecks, Plus, Pencil, Trash2, MessageSquare, ChevronDown, User as UserIcon, FileText, ScrollText,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteHero } from "@/components/SiteHero";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getUser, setUser, type User } from "@/lib/initiatives";

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

/* 2. Patrocinadores */
const sponsors = ["Itaú", "Embraer", "Natura", "Ambev", "Petrobras", "Nubank", "Vale", "Stone"];
function Sponsors() {
  const [state, setState] = useState<"idle" | "running" | "done">("idle");
  const [sent, setSent] = useState(0);

  const run = async () => {
    setState("running"); setSent(0);
    for (let i = 1; i <= sponsors.length; i++) { await sleep(350); setSent(i); }
    setState("done");
    toast.success("Automação executada com sucesso!", { description: `${sponsors.length} e-mails enviados com a apresentação institucional.` });
  };

  return (
    <AutomationCard icon={<Send className="h-6 w-6" />} tag="Comercial" title="Disparador de Patrocinadores"
      desc="Envie a apresentação institucional e mensagens padrão para a planilha de contatos de parceiros comerciais.">
      {state !== "idle" && (
        <div className="flex flex-wrap gap-1.5">
          {sponsors.map((s, i) => (
            <span key={s} className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium transition ${i < sent ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
              {i < sent ? <CheckCircle2 className="h-3 w-3" /> : <Loader2 className="h-3 w-3 animate-spin" />} {s}
            </span>
          ))}
        </div>
      )}
      <button className={btnCta} disabled={state === "running"} onClick={run}>
        {state === "running" ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando {sent}/{sponsors.length}...</>
          : state === "done" ? <><CheckCircle2 className="h-4 w-4" /> Enviado · Disparar novamente</> : "Disparar E-mails"}
      </button>
    </AutomationCard>
  );
}

/* 3. WhatsApp */
const templates = [
  { title: "Semana de Engenharia 2026", text: "🚀 *Semana de Engenharia 2026* chegou!\n\nPalestras, workshops e feira de empresas de 09 a 13/11 no Biênio.\n\n👉 Inscreva-se: https://gremiopoli.com/sde2026" },
  { title: "InterPoli", text: "🏆 *InterPoli 2026* — chama a sua engenharia!\n\nInscrições de times abertas até 30/11.\n\n👉 https://gremiopoli.com/interpoli" },
  { title: "Curso Poliglota", text: "🌎 *Curso Poliglota - Intensivo*\n\nInglês, espanhol e alemão com preço de estudante. Vagas limitadas!\n\n👉 https://gremiopoli.com/poliglota" },
];
function WhatsApp() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const copy = async (i: number) => {
    try { await navigator.clipboard.writeText(templates[i]?.text ?? ""); } catch { /* ignore */ }
    setCopied(i); toast.success("Template copiado! Cole no grupo da sua engenharia.");
    setTimeout(() => setCopied(null), 2000);
  };
  return (
    <AutomationCard icon={<MessageCircle className="h-6 w-6" />} tag="Marketing" title="Booms de WhatsApp (Marketing)"
      desc="Copie os templates de texto padrão e links de divulgação prontos para colar nos grupos de engenharia.">
      <button className={btnCta} onClick={() => setOpen(true)}>Abrir Templates</button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-primary">Templates de divulgação</DialogTitle>
            <DialogDescription>Clique em copiar e cole direto no WhatsApp.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-3 overflow-y-auto">
            {templates.map((t, i) => (
              <div key={t.title} className="rounded-lg border border-border bg-muted p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-bold text-primary">{t.title}</p>
                  <button onClick={() => copy(i)} className={btnPrimary + " px-3 py-1 text-xs"}>
                    {copied === i ? <><CheckCircle2 className="h-3.5 w-3.5" /> Copiado</> : <><Copy className="h-3.5 w-3.5" /> Copiar</>}
                  </button>
                </div>
                <pre className="whitespace-pre-wrap font-sans text-sm text-foreground">{t.text}</pre>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </AutomationCard>
  );
}

/* 4. Inova */
/* 4. Lista de Inscritos */
/* 4. Lista de Contatos de Prospecção (Empresas) */
/* 4. Lista de Participantes */
function ContactList() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);

  // Carrega a lista de participantes inscritos no projeto
  const handleLoadParticipants = async () => {
    setOpen(true);
    setLoading(true);
    
    // Simula o delay de leitura da base de inscritos
    await sleep(1200); 
    
    // Mock estruturado apenas com dados dos participantes do projeto
    setParticipants([
      { nome: "Gabriel Santos", curso: "Engenharia Elétrica", email: "gabriel.santos@usp.br", status: "Ativo" },
      { nome: "Beatriz Oliveira", curso: "Engenharia Mecânica", email: "beatriz.oliveira@usp.br", status: "Pendente" },
      { nome: "Lucas Rodrigues", curso: "Engenharia de Computação", email: "lucas.rodrigues@usp.br", status: "Ativo" },
    ]);
    
    setLoading(false);
    toast.success("Lista de participantes carregada!");
  };

  return (
    <AutomationCard 
      icon={<Users className="h-6 w-6" />} 
      tag="Projeto" 
      title="Lista de Participantes"
      desc="Acesse o painel, visualize e gerencie todos os alunos inscritos e membros ativos integrados no projeto atual."
    >
      <button className={btnCta} onClick={handleLoadParticipants}>
        Visualizar Participantes
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Participantes Inscritos</DialogTitle>
            <DialogDescription>
              Visualização rápida dos membros e alunos vinculados ao projeto.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 min-h-[150px] flex flex-col justify-center">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-2 py-8">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
                <span className="text-sm text-muted-foreground animate-pulse">Carregando lista de participantes...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-md border border-border overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-muted border-b border-border font-bold text-muted-foreground">
                        <th className="p-2.5">Nome</th>
                        <th className="p-2.5">Curso / Habilitação</th>
                        <th className="p-2.5">E-mail institucional</th>
                        <th className="p-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {participants.map((p, i) => (
                        <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30">
                          <td className="p-2.5 font-semibold text-primary">{p.nome}</td>
                          <td className="p-2.5 text-muted-foreground">{p.curso}</td>
                          <td className="p-2.5 text-muted-foreground font-mono">{p.email}</td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              p.status === 'Ativo' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex gap-2">
                  <button 
                    className={btnPrimary + " flex-1"} 
                    onClick={() => {
                      setOpen(false);
                      navigate({ to: "/participantes" });
                    }}
                  >
                    Ir para Gerenciador Completo (/participantes)
                  </button>
                  <button 
                    className="rounded-md border border-border px-4 text-sm font-medium text-foreground hover:bg-muted" 
                    onClick={() => setOpen(false)}
                  >
                    Fechar
                  </button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
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

function TaskList() {
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
    const autor = getUser()?.name?.split(" ")[0] ?? "Você";
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

function Automations() {
  const navigate = useNavigate();
  const [user, setU] = useState<User | null>(null);
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
        title="Central de Automações"
        subtitle="Nova iniciativa — tarefas repetitivas do Grêmio em um clique"
      />
      <main className="grid gap-6 bg-white px-6 py-10 sm:grid-cols-2 md:px-10 xl:grid-cols-3">
        <Certificates />
        <Sponsors />
        <WhatsApp />
        <ContactList />
        <TaskList />
        <MessageTemplates />
        <RulesLink />
      </main>
    </div>
  );
}
