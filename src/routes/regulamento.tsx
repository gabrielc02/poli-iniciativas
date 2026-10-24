import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { CheckCircle2, Copy, Printer } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteHero } from "@/components/SiteHero";
import { getUser, setUser, type User } from "@/lib/initiatives";

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

// "[]" no texto = informação ainda a definir (aparece como selo "a definir").
// "[texto](url)" no texto = hiperlink.
type Item = string | { texto: string; sub: string[] };
type Secao = { id: string; titulo: string; itens: Item[] };

const secoes: Secao[] = [
  {
    id: "inscricao",
    titulo: "Inscrição",
    itens: [
      "Podem se inscrever alunos regularmente matriculados na Escola Politécnica da USP;",
      "O número de participantes será limitado a no máximo 80 alunos, distribuídos em 16 a 40 equipes; caso haja mais de 80 inscritos, o critério de escolha será unicamente a ordem de inscrição.",
      "A inscrição e o cadastro deverão ser feitos integralmente pela plataforma Luma, com cadastro de todos os integrantes da equipe;",
      "As equipes devem ter entre 2 (dois) e 5 (cinco) integrantes; alunos sem equipe formada poderão se inscrever individualmente e serão alocados pela Comissão Organizadora;",
      "O cadastro na plataforma Luma não garante vaga automática; as inscrições se encerram no dia 10 de novembro e as equipes aprovadas serão divulgadas no dia 11 de novembro;",
      "Poderá haver limite de vagas, condicionado à estrutura do evento; em caso de excesso de inscrições, a seleção seguirá exclusivamente a ordem de inscrição.",
    ],
  },
  {
    id: "participacao",
    titulo: "Participação",
    itens: [
      "O Hack@Poli 2026 acontecerá de 11 a 14 de novembro; as atividades dos dias 11, 12 e 13 serão realizadas online e a etapa presencial ocorrerá no dia 14 de novembro, no Espaço Ocean do INOVA USP, localizado na Av. Prof. Lúcio Martins Rodrigues, 370 – Butantã, São Paulo – SP, 05508-020;",
      "A participação no Hack@Poli é voluntária, gratuita, nominal e intransferível;",
      "Os participantes deverão realizar check-in presencial no dia 14 de novembro, entre 8h e 9h, sob pena de perda da vaga;",
      "Cada equipe deve ter ao menos 2 (dois) membros presentes na área do evento durante toda a programação presencial do dia 14 de novembro, à exceção do horário de almoço (12h às 14h), sob pena de desclassificação da equipe;",
      "Dados pessoais poderão ser compartilhados entre organização e participantes, respeitando as diretrizes da [LGPD](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm);",
      "Os dados de contato (e-mail) e os currículos dos participantes só serão compartilhados com os patrocinadores mediante autorização do participante;",
      "O evento contará com cobertura fotográfica, e as imagens poderão ser utilizadas na divulgação do Hack@Poli e compartilhadas com os patrocinadores;",
      "Não será tolerada conduta desrespeitosa com membros da Comissão Organizadora, voluntários, palestrantes ou demais participantes, sob pena de desclassificação;",
      "A Comissão Organizadora disponibilizará a infraestrutura necessária para a atividade, incluindo o espaço do evento e rede Wi-Fi;",
      "O Hack@Poli oferece 60 (sessenta) horas de atividade extensionista (AEx) aos participantes;",
      "Cabe a cada participante levar seu próprio notebook/laptop para uso durante o evento.",
    ],
  },
  {
    id: "desafio",
    titulo: "Desafio",
    itens: [
      "O desafio a ser resolvido consistirá em um case de temática relevante para a sociedade, definido pela Comissão Organizadora e divulgado no dia 11 de novembro, juntamente com as equipes selecionadas;",
      "O tema busca aproximar os participantes de problemas reais, estimulando o desenvolvimento de soluções tecnológicas e de negócio;",
      "No dia 11 de novembro, as equipes poderão, de forma opcional, definir o problema que pretendem atacar e enviá-lo até as 00h do dia 12 de novembro, por formulário, com link de acesso ao arquivo no Drive;",
      "Os problemas enviados serão pré-avaliados pelos mentores quanto à relevância e adequação ao tema, e as equipes receberão um breve feedback ao longo do dia 12 de novembro;",
      "Os detalhes completos do desafio serão comunicados aos inscritos conforme cronograma do evento.",
    ],
  },
  {
    id: "programacao",
    titulo: "Programação",
    itens: [
      "A programação do Hack@Poli contempla palestras, mentorias, workshops e avaliações para seleção das melhores soluções desenvolvidas;",
      {
        texto: "O cronograma previsto é o seguinte:",
        sub: [
          "Terça-feira (10/11) – Encerramento das inscrições",
          "Quarta-feira (11/11) – Divulgação do tema do case e das equipes aprovadas; live para tirar dúvidas sobre o regulamento (horário: []); prazo opcional para envio do problema a ser atacado (até 00h)",
          "Quinta-feira (12/11) – Pré-avaliação dos problemas pelos mentores e feedback às equipes ao longo do dia",
          "Sexta-feira (13/11) – Palestras institucionais dos parceiros e divulgação de processos seletivos (online)",
          "Sábado (14/11), 8h às 9h – Cadastro e chegada dos participantes no prédio do evento",
          "Sábado (14/11), 9h – Fala de abertura (Grêmio Politécnico) e das empresas patrocinadoras; início das mentorias",
          "Sábado (14/11), 11h – Palestra sobre protótipo de média/alta fidelidade",
          "Sábado (14/11), 12h às 14h – Pausa para o almoço",
          "Sábado (14/11), 15h – Palestra sobre pitch",
          "Sábado (14/11), 16h – Início da rodada de pitches, em ordem sorteada",
          "Sábado (14/11), 20h – Finalização das atividades e divulgação dos resultados",
          "Coffee break – horário: []",
        ],
      },
      "As mentorias serão conduzidas por veteranos da área de inovação (politécnicos veteranos, professores e profissionais das empresas parceiras); os mentores poderão ser solicitados pelas equipes ou procurá-las por iniciativa própria;",
      "Ao final de cada atividade, os participantes serão convidados a responder um questionário de feedback;",
      "A grade completa de atividades será divulgada previamente aos participantes e está sujeita a alterações, caso necessário.",
    ],
  },
  {
    id: "premiacao",
    titulo: "Premiação",
    itens: [
      "No dia 14 de novembro, no encerramento do Hack@Poli (previsto para as 20h), serão divulgados todos os vencedores. Pelo menos 1 (um) membro de cada equipe deve estar presente, sujeito à desclassificação da equipe em caso de ausência;",
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
      "Cada equipe deverá entregar o Pitch, o Business Model Canvas e o protótipo da solução, pelo canal oficial e dentro do prazo estabelecido no cronograma (prazo de submissão: []);",
      "O protótipo deverá ser de média/alta fidelidade: uma representação navegável da solução, com as telas principais e o fluxo de uso, feita em ferramenta de design (Figma ou equivalente) ou entregue como aplicação funcional; avaliam-se a clareza do fluxo e a aderência ao problema, não o acabamento de produto;",
      "O Business Model Canvas deverá ter os nove blocos preenchidos a partir do template da Comissão Organizadora, evidenciando a viabilidade da solução, em arquivo único (PDF ou imagem);",
      "Os pitches serão apresentados presencialmente a partir das 16h do dia 14 de novembro, em ordem sorteada, com tempo limite definido, seguido de rodada de perguntas e respostas pela banca, devendo articular problema, solução, protótipo e modelo de negócio, e a sua não-apresentação leva à desclassificação da equipe;",
      "Critérios de avaliação incluirão: potencial de impacto, aderência ao desafio, inovação da solução e qualidade da apresentação;",
      "As decisões da banca julgadora são soberanas e irrecorríveis.",
    ],
  },
  {
    id: "propriedade",
    titulo: "Propriedade intelectual",
    itens: [
      "As soluções desenvolvidas, incluindo a ideia, o protótipo, o Business Model Canvas e demais materiais produzidos, são de propriedade dos integrantes da equipe, independentemente de quem tenha definido ou sugerido o tema do case; o Grêmio Politécnico e os patrocinadores não adquirem direitos sobre elas pela simples participação no evento;",
      "A Comissão Organizadora e a banca julgadora utilizarão os materiais entregues apenas para avaliação e para divulgação do evento (nome da equipe, resumo da solução e pitch), sem exploração comercial das soluções;",
      "As soluções devem ser originais e desenvolvidas pela equipe a partir do case divulgado, sendo permitido o uso de bibliotecas, ferramentas e conteúdos de terceiros, desde que respeitadas as suas licenças;",
      "Cada equipe é responsável por eventual violação de direitos de terceiros em sua solução, e a apresentação de trabalho alheio como próprio sujeita a equipe à desclassificação.",
    ],
  },
  {
    id: "comunicacao",
    titulo: "Comunicação",
    itens: [
      "A Comissão Organizadora se comunicará com os participantes pelos canais oficiais do Grêmio Politécnico, preferencialmente por e-mail, e dúvidas sobre o evento deverão ser enviadas por esses mesmos canais;",
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

// Destaca os trechos "[]" (a definir) e converte "[texto](url)" em hiperlink.
function comPendencias(texto: string): ReactNode {
  const partes = texto.split(/(\[\]|\[[^\]]+\]\([^)]+\))/);
  return partes.map((p, i) => {
    if (p === "[]") {
      return (
        <span key={i} className="rounded bg-warning/10 px-1.5 py-0.5 text-xs font-bold text-warning">a definir</span>
      );
    }
    const link = p.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      return (
        <a key={i} href={link[2]} target="_blank" rel="noopener noreferrer"
          className="font-medium text-primary underline underline-offset-2 transition hover:text-secondary">
          {link[1]}
        </a>
      );
    }
    return <span key={i}>{p}</span>;
  });
}

// Versão em texto puro (para "Copiar texto"): "[LGPD](url)" vira "LGPD (url)".
const semLinks = (t: string) => t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)");

const comoTexto = () =>
  [
    "REGULAMENTO HACK@POLI 2026",
    ...secoes.map((s) =>
      [
        "",
        s.titulo.toUpperCase(),
        ...s.itens.flatMap((it) =>
          typeof it === "string" ? [`• ${semLinks(it)}`] : [`• ${semLinks(it.texto)}`, ...it.sub.map((x) => `    - ${x}`)],
        ),
      ].join("\n"),
    ),
  ].join("\n");

/* ---------- Página ---------- */

function Regulamento() {
  const navigate = useNavigate();
  const [user, setU] = useState<User | null>(null);
  const [copied, setCopied] = useState(false);

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
                          {it.sub.map((x) => <li key={x}>{comPendencias(x)}</li>)}
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
