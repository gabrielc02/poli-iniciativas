import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { CheckCircle2, Copy, Printer } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteHero } from "@/components/SiteHero";
import type { User } from "@/lib/initiatives";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/regulamento")({
  head: () => ({
    meta: [
      { title: "Regulamento Hack@Poli 2026 | Grêmio Politécnico" },
      { name: "description", content: "Regulamento oficial do Hack@Poli 2026: inscrição, participação, desafio, premiação e julgamento." },
      { property: "og:title", content: "Regulamento Hack@Poli 2026 | Grêmio Politécnico" },
      { property: "og:description", content: "Regulamento oficial do Hack@Poli 2026: inscrição, participação, desafio, premiação e julgamento." },
    ],
  }),
  component: Regulamento,
});

/* ---------- Conteúdo ---------- */

// "[]" no texto = informação ainda a definir (data do encerramento, responsável pelo pagamento).
type Item = string | { texto: string; sub: string[] };
type Secao = { id: string; titulo: string; itens: Item[] };

const secoes: Secao[] = [
  {
    id: "inscricao",
    titulo: "Inscrição",
    itens: [
      "Podem se inscrever alunos regularmente matriculados na Escola Politécnica da USP;",
      "O número de participantes será limitado à no máximo 80 alunos, e se houverem mais de 80 inscritos, os critérios de desempate serão definidos pela Comissão Organizadora.",
      "A inscrição deve ser feita por meio de formulário eletrônico, com cadastro de todos os integrantes da equipe;",
      "As equipes devem ter entre 2 (dois) e 5 (cinco) integrantes; alunos sem equipe formada poderão se inscrever individualmente e serão alocados pela Comissão Organizadora;",
      "O preenchimento do formulário não garante vaga automática; a confirmação de participação segue os prazos definidos pela Comissão Organizadora;",
      "Poderá haver limite de vagas, condicionado à estrutura do evento, com possibilidade de processo seletivo em caso de excesso de inscrições.",
    ],
  },
  {
    id: "participacao",
    titulo: "Participação",
    itens: [
      "A participação no Hack@Poli é voluntária, gratuita, nominal e intransferível;",
      "Os participantes deverão realizar check-in presencial no dia do evento, sob pena de perda da vaga;",
      "Cada equipe deve ter ao menos 2 (dois) membros presentes na área do evento durante toda a sua duração, à exceção do horário do almoço, sujeito à desclassificação;",
      "Dados pessoais poderão ser compartilhados entre organização e participantes, respeitando as diretrizes da LGPD;",
      "Não será tolerada conduta desrespeitosa com membros da Comissão Organizadora, voluntários, palestrantes ou demais participantes, sob pena de desclassificação;",
      "Cabe a cada participante levar seu próprio notebook/laptop para uso durante o evento.",
    ],
  },
  {
    id: "desafio",
    titulo: "Desafio",
    itens: [
      "O desafio a ser resolvido consistirá em um case de temática relevante para a sociedade, definido e divulgado pela Comissão Organizadora previamente ao evento;",
      "O tema busca aproximar os participantes de problemas reais, estimulando o desenvolvimento de soluções tecnológicas e de negócio;",
      "Os detalhes completos do desafio serão comunicados aos inscritos conforme cronograma do evento.",
    ],
  },
  {
    id: "programacao",
    titulo: "Programação",
    itens: [
      "A programação do Hack@Poli contempla palestras, mentorias, workshops e avaliações para seleção das melhores soluções desenvolvidas;",
      "A grade completa de atividades será divulgada previamente aos participantes e está sujeita a alterações, caso necessário.",
    ],
  },
  {
    id: "premiacao",
    titulo: "Premiação",
    itens: [
      "No dia [], no encerramento do Hack@Poli, serão divulgados todos os vencedores. Pelo menos 1 (um) membro de cada equipe deve estar presente, sujeito à desclassificação da equipe em caso de ausência;",
      {
        texto: "Apenas receberão a premiação as 03 (três) equipes melhores avaliadas pela banca julgadora fazendo jus aos seguintes prêmios:",
        sub: ["1º colocado – R$ 3.000", "2º colocado – R$ 2.000", "3º colocado – R$ 1.000"],
      },
      "Todos os prêmios oferecidos aos integrantes das 03 (três) equipes vencedoras são pessoais e intransferíveis.",
      "Os valores dos prêmios serão divididos em partes iguais entre os integrantes da equipe vencedora e serão creditados mediante as informações bancárias fornecidas pelos integrantes.",
      "O pagamento dos prêmios é de responsabilidade da [] e deverão ser pagos em até 30 dias após o encerramento do evento.",
    ],
  },
  {
    id: "julgamento",
    titulo: "Julgamento",
    itens: [
      "A banca julgadora será composta por convidados e/ou membros da organização, comprometidos a declarar eventuais conflitos de interesse;",
      "Cada equipe deverá entregar Pitch, Business Model Canvas e o entregável final da solução, conforme prazo estabelecido;",
      "O pitch terá tempo limite definido, seguido de rodada de perguntas e respostas pela banca, e a sua não-apresentação leva à desclassificação da equipe;",
      "Critérios de avaliação incluirão: potencial de impacto, aderência ao desafio, inovação da solução e qualidade da apresentação;",
      "As decisões da banca julgadora são soberanas e irrecorríveis.",
    ],
  },
  {
    id: "comunicacao",
    titulo: "Comunicação",
    itens: [
      "A Comissão Organizadora se comunicará com os participantes preferencialmente por e-mail e/ou canais oficiais do Grêmio Politécnico;",
      "É de responsabilidade do participante acompanhar programação, resultados e eventuais alterações do evento;",
      "Recomenda-se aos participantes desabilitar filtros de spam que possam bloquear comunicações oficiais.",
    ],
  },
];

/* ---------- Helpers ---------- */

const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-secondary disabled:opacity-70";
const btnOutline =
  "inline-flex items-center justify-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted";

// Destaca os trechos "[]" (a definir) para ficarem visíveis até serem preenchidos.
function comPendencias(texto: string): ReactNode {
  const partes = texto.split("[]");
  return partes.map((p, i) => (
    <span key={i}>
      {p}
      {i < partes.length - 1 && (
        <span className="rounded bg-warning/10 px-1.5 py-0.5 text-xs font-bold text-warning">a definir</span>
      )}
    </span>
  ));
}

const comoTexto = () =>
  [
    "REGULAMENTO HACK@POLI 2026",
    ...secoes.map((s) =>
      [
        "",
        s.titulo.toUpperCase(),
        ...s.itens.flatMap((it) =>
          typeof it === "string" ? [`• ${it}`] : [`• ${it.texto}`, ...it.sub.map((x) => `    - ${x}`)],
        ),
      ].join("\n"),
    ),
  ].join("\n");

/* ---------- Página ---------- */

function Regulamento() {
  const navigate = useNavigate();
  const [user, setU] = useState<User | null>(null);
  const [copied, setCopied] = useState(false);

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

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(comoTexto());
    } catch {
      /* ignore */
    }
    setCopied(true);
    toast.success("Regulamento copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="print:hidden">
        <SiteHeader user={user} onLogout={logout} />
      </div>
      <SiteHero
        title="Regulamento Hack@Poli 2026"
        subtitle="Regras de inscrição, participação, premiação e julgamento"
      />

      <main className="mx-auto grid max-w-5xl gap-10 bg-white px-6 py-10 lg:grid-cols-[200px_1fr]">
        <nav className="hidden lg:block print:hidden">
          <div className="sticky top-6 space-y-1">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Seções</p>
            {secoes.map((s, i) => (
              <a key={s.id} href={`#${s.id}`}
                className="block rounded-md px-3 py-1.5 text-sm font-medium text-primary transition hover:bg-muted">
                {i + 1}. {s.titulo}
              </a>
            ))}
          </div>
        </nav>

        <div className="space-y-10">
          <div className="flex flex-wrap gap-2 print:hidden">
            <button className={btnPrimary} onClick={copiar}>
              {copied ? <><CheckCircle2 className="h-4 w-4" /> Copiado</> : <><Copy className="h-4 w-4" /> Copiar texto</>}
            </button>
            <button className={btnOutline} onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> Imprimir / salvar PDF
            </button>
          </div>

          {secoes.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-6">
              <h2 className="mb-4 flex items-baseline gap-3 border-b border-border pb-2 text-xl font-bold text-primary">
                <span className="text-sm font-semibold text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                {s.titulo}
              </h2>
              <ul className="space-y-3 text-sm leading-relaxed text-foreground">
                {s.itens.map((it, j) => (
                  <li key={j} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    <div>
                      <p>{comPendencias(typeof it === "string" ? it : it.texto)}</p>
                      {typeof it !== "string" && (
                        <ul className="mt-2 space-y-1.5 rounded-lg bg-muted p-3 font-semibold text-primary">
                          {it.sub.map((x) => <li key={x}>{x}</li>)}
                        </ul>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
