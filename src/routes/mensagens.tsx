import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { CheckCircle2, Copy, ExternalLink, Linkedin, Mail, MessageCircle, RotateCcw } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteHero } from "@/components/SiteHero";
import type { User } from "@/lib/initiatives";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/mensagens")({
  head: () => ({
    meta: [
      { title: "Mensagens Padrão | Grêmio Politécnico" },
      { name: "description", content: "Templates de mensagens do Hack@Poli por mídia: LinkedIn, e-mail e WhatsApp." },
      { property: "og:title", content: "Mensagens Padrão | Grêmio Politécnico" },
      { property: "og:description", content: "Templates de mensagens do Hack@Poli por mídia: LinkedIn, e-mail e WhatsApp." },
    ],
  }),
  component: Mensagens,
});

/* ---------- Dados ---------- */

type Midia = "linkedin" | "email" | "whatsapp";

type Template = {
  id: string;
  midia: Midia;
  finalidade: string;
  assunto?: string; // só para e-mail
  corpo: string;
};

// Espaço do evento (a ata cita "Espaço Ocean"; os templates originais citam "Cosmos"). Ajuste aqui.
const ESPACO = "Cosmos";

const PARAGRAFOS_PROJETO = `O Hack@Poli nasce com a proposta de aproximar estudantes, universidade e empresas por meio da competitividade e de uma experiência intensa de colaboração e inovação. Ele vai acontecer no espaço ${ESPACO} do Inova USP, onde os alunos, expositores e monitores terão muitas oportunidades de interação! Todas as soluções e entregáveis, cuidadosamente desenvolvidos pelas equipes, serão apresentadas em Pitch para uma banca avaliadora no encerramento do evento. Além de uma oportunidade de se aproximar de jovens talentos da Poli, a empresa tem a chance de apresentar desafios reais do mercado e áreas de atuação.`;

const templates: Template[] = [
  {
    id: "linkedin-mentoria",
    midia: "linkedin",
    finalidade: "Convite para mentoria",
    corpo: `Olá, {{contato}}!

Estamos desenvolvendo um novo projeto: o Hack@Poli, um hackathon presencial que acontecerá em novembro de 2026, no prédio do Inova USP. O evento nasce com a proposta de aproximar nossos estudantes da realidade do mercado, desafiando-os a criar soluções inovadoras e desenvolver habilidades práticas em tecnologia e negócios.

Acompanhamos e admiramos muito a sua trajetória profissional. Como um(a) ex-politécnico(a) de grande destaque, gostaríamos de convidá-lo(a) a participar como um(a) de nossos(as) mentores(as). A responsabilidade dos mentores é direcionar as soluções que estão sendo estruturadas pelos alunos ao longo do evento. Sabemos que sua agenda é concorrida, por isso reforço que a participação é flexível: não é necessário permanecer durante toda a duração do hackathon, basta nos informar os horários em que poderia contribuir.

Acredito que sua experiência traria um valor inestimável para a nova geração de engenheiros. Gostaríamos de marcar uma breve conversa para apresentar o projeto com mais detalhes.`,
  },
  {
    id: "email-patrocinio",
    midia: "email",
    finalidade: "Convite para patrocínio",
    assunto: "Convite de parceria: Hack@Poli 2026",
    corpo: `Prezado(a) {{contato}},

Boa tarde, espero que este email o(a) encontre bem! Meu nome é {{remetente}}, sou {{apresentacao}}. Estamos desenvolvendo um novo projeto, o Hack@Poli, e gostaríamos muito de convidar a empresa {{empresa}} a ser um dos primeiros parceiros dessa iniciativa.

${PARAGRAFOS_PROJETO}

Pensamos em {{empresa}} justamente pelo interesse que muitos estudantes demonstram em conhecer e trabalhar na empresa. Acreditamos, por isso, que existe uma sinergia muito interessante entre {{empresa}} e a proposta do Hack@Poli e que podemos gerar grande valor para a empresa, tanto em termos de recrutamento e reconhecimento, quanto de produtividade e inovação!

Gostaríamos de conversar para apresentar melhor o projeto e entender de que forma {{empresa}} poderia participar dessa primeira edição. Seria muito especial contar com a empresa desde o início da construção do Hack@Poli.

Fico à disposição para marcarmos uma conversa.

Atenciosamente,
{{remetente}}`,
  },
  {
    id: "whatsapp-patrocinio",
    midia: "whatsapp",
    finalidade: "Convite para patrocínio",
    corpo: `Boa tarde, tudo bem?? Meu nome é {{remetente}}, sou {{apresentacao}}. Estamos desenvolvendo um novo projeto, o Hack@Poli, e gostaríamos muito de convidar a empresa {{empresa}} a ser um dos primeiros parceiros dessa iniciativa!

${PARAGRAFOS_PROJETO}

Pensamos em {{empresa}} justamente pelo interesse que muitos estudantes demonstram em conhecer e trabalhar na empresa. Acreditamos, por isso, que existe uma sinergia muito interessante entre {{empresa}} e a proposta do Hack@Poli e que podemos gerar grande valor para a empresa, tanto em termos de recrutamento e reconhecimento, quanto de produtividade e inovação!

Gostaríamos de conversar para apresentar melhor o projeto e entender de que forma {{empresa}} poderia participar dessa primeira edição. Seria muito especial contar com a empresa desde o início da construção do Hack@Poli.

Fico à disposição para marcarmos uma conversa!`,
  },
];

const midias: { id: Midia; label: string; icon: ReactNode }[] = [
  { id: "linkedin", label: "LinkedIn", icon: <Linkedin className="h-5 w-5" /> },
  { id: "email", label: "E-mail", icon: <Mail className="h-5 w-5" /> },
  { id: "whatsapp", label: "WhatsApp", icon: <MessageCircle className="h-5 w-5" /> },
];

/* ---------- Helpers ---------- */

const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-secondary disabled:opacity-70";
const btnOutline =
  "inline-flex items-center justify-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted";
const fieldCls =
  "w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary";

type Vars = { contato: string; empresa: string; remetente: string; apresentacao: string };

// Campos vazios viram marcadores [entre colchetes] para ficar óbvio o que falta preencher.
const fill = (text: string, v: Vars) =>
  text
    .replaceAll("{{contato}}", v.contato.trim() || "[Nome do contato]")
    .replaceAll("{{empresa}}", v.empresa.trim() || "[Empresa]")
    .replaceAll("{{remetente}}", v.remetente.trim() || "[Seu nome]")
    .replaceAll("{{apresentacao}}", v.apresentacao.trim() || "[sua apresentação]");

/* ---------- Página ---------- */

function Mensagens() {
  const navigate = useNavigate();
  const [user, setU] = useState<User | null>(null);

  const [midia, setMidia] = useState<Midia>("linkedin");
  const [templateId, setTemplateId] = useState<string>("linkedin-mentoria");
  const [vars, setVars] = useState<Vars>({
    contato: "",
    empresa: "",
    remetente: "Tarsila",
    apresentacao: "aluna da Escola Politécnica da USP e diretora de projetos do Grêmio Politécnico",
  });
  const [custom, setCustom] = useState<string | null>(null); // edição manual do texto
  const [copied, setCopied] = useState<"corpo" | "assunto" | null>(null);

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

  const disponiveis = useMemo(() => templates.filter((t) => t.midia === midia), [midia]);
  const template = disponiveis.find((t) => t.id === templateId) ?? disponiveis[0];

  const gerado = useMemo(() => fill(template.corpo, vars), [template, vars]);
  const assunto = template.assunto ? fill(template.assunto, vars) : null;
  const texto = custom ?? gerado;

  if (!user) return null;

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  const escolherMidia = (m: Midia) => {
    const primeiro = templates.find((t) => t.midia === m);
    setMidia(m);
    if (primeiro) setTemplateId(primeiro.id);
    setCustom(null);
  };

  const setVar = (k: keyof Vars, value: string) => {
    setVars((v) => ({ ...v, [k]: value }));
    setCustom(null); // volta a gerar a partir do template
  };

  const copiar = async (conteudo: string, qual: "corpo" | "assunto") => {
    try {
      await navigator.clipboard.writeText(conteudo);
    } catch {
      /* ignore */
    }
    setCopied(qual);
    toast.success(qual === "assunto" ? "Assunto copiado!" : "Mensagem copiada!");
    setTimeout(() => setCopied(null), 2000);
  };

  const abrirNoApp = () => {
    const url =
      midia === "email"
        ? `mailto:?subject=${encodeURIComponent(assunto ?? "")}&body=${encodeURIComponent(texto)}`
        : `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader user={user} onLogout={logout} />
      <SiteHero
        title="Mensagens Padrão"
        subtitle="Escolha a mídia, preencha os dados e copie a mensagem pronta"
      />

      <main className="mx-auto grid max-w-6xl gap-8 bg-white px-6 py-10 lg:grid-cols-[340px_1fr]">
        {/* Coluna esquerda: configuração */}
        <section className="space-y-6">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Mídia</p>
            <div className="grid grid-cols-3 gap-2">
              {midias.map((m) => (
                <button
                  key={m.id}
                  onClick={() => escolherMidia(m.id)}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs font-semibold transition ${
                    midia === m.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-primary hover:bg-muted"
                  }`}
                >
                  {m.icon}
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {disponiveis.length > 1 && (
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Finalidade</p>
              <select
                className={fieldCls}
                value={template.id}
                onChange={(e) => { setTemplateId(e.target.value); setCustom(null); }}
              >
                {disponiveis.map((t) => (
                  <option key={t.id} value={t.id}>{t.finalidade}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Dados da mensagem</p>
            <label className="block space-y-1 text-xs font-medium text-muted-foreground">
              Nome do contato
              <input className={fieldCls} placeholder="Ex.: Joana Pelliccione" value={vars.contato}
                onChange={(e) => setVar("contato", e.target.value)} />
            </label>
            {midia !== "linkedin" && (
              <label className="block space-y-1 text-xs font-medium text-muted-foreground">
                Empresa
                <input className={fieldCls} placeholder="Ex.: Nubank" value={vars.empresa}
                  onChange={(e) => setVar("empresa", e.target.value)} />
              </label>
            )}
            {midia !== "linkedin" && (
              <>
                <label className="block space-y-1 text-xs font-medium text-muted-foreground">
                  Seu nome
                  <input className={fieldCls} value={vars.remetente}
                    onChange={(e) => setVar("remetente", e.target.value)} />
                </label>
                <label className="block space-y-1 text-xs font-medium text-muted-foreground">
                  Sua apresentação
                  <textarea rows={3} className={fieldCls} value={vars.apresentacao}
                    onChange={(e) => setVar("apresentacao", e.target.value)} />
                </label>
              </>
            )}
          </div>
        </section>

        {/* Coluna direita: prévia editável */}
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-primary">
              {midias.find((m) => m.id === midia)?.label} · {template.finalidade}
            </h2>
            {custom !== null && (
              <button className="inline-flex items-center gap-1.5 text-xs font-medium text-secondary hover:underline"
                onClick={() => setCustom(null)}>
                <RotateCcw className="h-3.5 w-3.5" /> Restaurar template
              </button>
            )}
          </div>

          {assunto && (
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 p-3">
              <p className="min-w-0 flex-1 truncate text-sm">
                <span className="font-semibold text-primary">Assunto: </span>
                {assunto}
              </p>
              <button className={btnOutline + " px-3 py-1 text-xs"} onClick={() => copiar(assunto, "assunto")}>
                {copied === "assunto" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                Copiar
              </button>
            </div>
          )}

          <textarea
            className={fieldCls + " min-h-[420px] resize-y leading-relaxed"}
            value={texto}
            onChange={(e) => setCustom(e.target.value)}
          />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {texto.length} caracteres · você pode editar o texto antes de copiar
            </p>
            <div className="flex gap-2">
              {midia !== "linkedin" && (
                <button className={btnOutline} onClick={abrirNoApp}>
                  <ExternalLink className="h-4 w-4" />
                  {midia === "email" ? "Abrir no e-mail" : "Abrir no WhatsApp"}
                </button>
              )}
              <button className={btnPrimary} onClick={() => copiar(texto, "corpo")}>
                {copied === "corpo" ? <><CheckCircle2 className="h-4 w-4" /> Copiado</> : <><Copy className="h-4 w-4" /> Copiar mensagem</>}
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
