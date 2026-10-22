import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  Award, Send, MessageCircle, DoorOpen, Loader2, CheckCircle2, Copy, FileSpreadsheet, Download, Zap,
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
function Inova({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSending(true); await sleep(1200); setSending(false); setOpen(false);
    toast.success("Automação executada com sucesso!", { description: "Solicitação de reserva enviada ao InovaUSP." });
  };
  const field = "w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring";
  return (
    <AutomationCard icon={<DoorOpen className="h-6 w-6" />} tag="Espaços" title="Verificador de Espaço (Inova)"
      desc="Link direto e preenchimento automático do formulário de reserva de salas da Poli-USP.">
      <button className={btnCta} onClick={() => setOpen(true)}>Acessar Formulário</button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-primary">Reserva de sala · InovaUSP</DialogTitle>
            <DialogDescription className="flex items-center gap-1"><Zap className="h-3.5 w-3.5 text-accent" /> Campos preenchidos automaticamente</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-3">
            <label className="block text-xs font-semibold text-muted-foreground">Responsável<input className={field} defaultValue={user.name} /></label>
            <label className="block text-xs font-semibold text-muted-foreground">E-mail USP<input className={field} defaultValue={user.email} /></label>
            <label className="block text-xs font-semibold text-muted-foreground">Entidade<input className={field} defaultValue="Grêmio Politécnico da USP" /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs font-semibold text-muted-foreground">Sala
                <select className={field} defaultValue="Auditório Inova">
                  <option>Auditório Inova</option><option>Sala Colaborativa 2</option><option>Laboratório Maker</option>
                </select>
              </label>
              <label className="block text-xs font-semibold text-muted-foreground">Data<input type="date" className={field} defaultValue="2026-11-10" /></label>
            </div>
            <div className="flex items-center gap-2 rounded-md bg-success/10 p-2.5 text-xs font-medium text-success">
              <CheckCircle2 className="h-4 w-4" /> Auditório Inova disponível nesta data
            </div>
            <button type="submit" disabled={sending} className={btnCta}>
              {sending ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</> : "Enviar Reserva"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
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
      <main className="grid gap-6 bg-white px-6 py-10 sm:grid-cols-2 md:px-10 xl:grid-cols-4">
        <Certificates />
        <Sponsors />
        <WhatsApp />
        <Inova user={user} />
      </main>
    </div>
  );
}
