import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Copy,
  Pencil,
  Plus,
  Printer,
  RotateCcw,
  Save,
  Trash2,
  X,
} from "lucide-react";
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

/* ---------- Modelo e conteúdo padrão ---------- */

type Item = { id: string; texto: string; sub: string[] };
type Secao = { id: string; titulo: string; itens: Item[] };

type ItemBruto = string | { texto: string; sub: string[] };
type SecaoBruta = { titulo: string; itens: ItemBruto[] };

// "[]" no texto = informação ainda a definir (data do encerramento, responsável pelo pagamento).
const secoesPadrao: SecaoBruta[] = [
  {
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
    titulo: "Desafio",
    itens: [
      "O desafio a ser resolvido consistirá em um case de temática relevante para a sociedade, definido e divulgado pela Comissão Organizadora previamente ao evento;",
      "O tema busca aproximar os participantes de problemas reais, estimulando o desenvolvimento de soluções tecnológicas e de negócio;",
      "Os detalhes completos do desafio serão comunicados aos inscritos conforme cronograma do evento.",
    ],
  },
  {
    titulo: "Programação",
    itens: [
      "A programação do Hack@Poli contempla palestras, mentorias, workshops e avaliações para seleção das melhores soluções desenvolvidas;",
      "A grade completa de atividades será divulgada previamente aos participantes e está sujeita a alterações, caso necessário.",
    ],
  },
  {
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
    titulo: "Comunicação",
    itens: [
      "A Comissão Organizadora se comunicará com os participantes preferencialmente por e-mail e/ou canais oficiais do Grêmio Politécnico;",
      "É de responsabilidade do participante acompanhar programação, resultados e eventuais alterações do evento;",
      "Recomenda-se aos participantes desabilitar filtros de spam que possam bloquear comunicações oficiais.",
    ],
  },
];

const STORAGE_KEY = "gremio:regulamento:v1";

const uid = () => Math.random().toString(36).slice(2, 10);

const criarPadrao = (): Secao[] =>
  secoesPadrao.map((s) => ({
    id: uid(),
    titulo: s.titulo,
    itens: s.itens.map((it) =>
      typeof it === "string"
        ? { id: uid(), texto: it, sub: [] }
        : { id: uid(), texto: it.texto, sub: [...it.sub] },
    ),
  }));

// Valida o que veio do localStorage e gera ids novos.
function lerSalvo(raw: string | null): Secao[] | null {
  if (!raw) return null;
  try {
    const x: unknown = JSON.parse(raw);
    if (!Array.isArray(x)) return null;
    const ok = x.every(
      (s) =>
        s &&
        typeof s.titulo === "string" &&
        Array.isArray(s.itens) &&
        s.itens.every(
          (i: { texto?: unknown; sub?: unknown }) => typeof i?.texto === "string" && Array.isArray(i.sub),
        ),
    );
    if (!ok) return null;
    return x.map((s) => ({
      id: uid(),
      titulo: s.titulo as string,
      itens: (s.itens as { texto: string; sub: string[] }[]).map((i) => ({
        id: uid(),
        texto: i.texto,
        sub: i.sub.filter((v) => typeof v === "string"),
      })),
    }));
  } catch {
    return null;
  }
}

/* ---------- Helpers ---------- */

const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-secondary disabled:opacity-70";
const btnOutline =
  "inline-flex items-center justify-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted";
const inputCls =
  "w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary";

const slug = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const anchorId = (s: Secao, i: number) => slug(s.titulo) || `secao-${i + 1}`;

function mover<T>(arr: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= arr.length) return arr;
  const copia = [...arr];
  [copia[i], copia[j]] = [copia[j] as T, copia[i] as T];
  return copia;
}

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

const comoTexto = (secoes: Secao[]) =>
  [
    "REGULAMENTO HACK@POLI 2026",
    ...secoes.map((s) =>
      [
        "",
        s.titulo.toUpperCase(),
        ...s.itens.flatMap((it) => [`• ${it.texto}`, ...it.sub.map((x) => `    - ${x}`)]),
      ].join("\n"),
    ),
  ].join("\n");

function IconBtn({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md p-1.5 transition disabled:pointer-events-none disabled:opacity-30 ${
        danger ? "text-destructive hover:bg-destructive/10" : "text-muted-foreground hover:bg-muted hover:text-primary"
      }`}
    >
      {children}
    </button>
  );
}

/* ---------- Página ---------- */

function Regulamento() {
  const navigate = useNavigate();
  const [user, setU] = useState<User | null>(null);
  const [copied, setCopied] = useState(false);
  const [secoes, setSecoes] = useState<Secao[]>(criarPadrao);
  const [rascunho, setRascunho] = useState<Secao[] | null>(null); // null = modo leitura

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

  // Carrega a versão editada (se houver) deste navegador.
  useEffect(() => {
    try {
      const salvo = lerSalvo(localStorage.getItem(STORAGE_KEY));
      if (salvo) setSecoes(salvo);
    } catch {
      /* ignore */
    }
  }, []);

  if (!user) return null;

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  const editando = rascunho !== null;

  /* --- leitura --- */
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(comoTexto(secoes));
    } catch {
      /* ignore */
    }
    setCopied(true);
    toast.success("Regulamento copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  /* --- edição --- */
  const iniciarEdicao = () => setRascunho(JSON.parse(JSON.stringify(secoes)) as Secao[]);

  const cancelar = () => {
    if (rascunho && JSON.stringify(rascunho) !== JSON.stringify(secoes)) {
      if (!window.confirm("Descartar as alterações feitas?")) return;
    }
    setRascunho(null);
  };

  const restaurarOriginal = () => {
    if (!window.confirm("Voltar ao texto original? Suas edições no rascunho serão perdidas.")) return;
    setRascunho(criarPadrao());
  };

  const salvar = () => {
    if (!rascunho) return;
    const limpo = rascunho
      .map((s) => ({
        ...s,
        titulo: s.titulo.trim(),
        itens: s.itens
          .map((it) => ({ ...it, texto: it.texto.trim(), sub: it.sub.map((x) => x.trim()).filter(Boolean) }))
          .filter((it) => it.texto),
      }))
      .filter((s) => s.titulo || s.itens.length)
      .map((s) => ({ ...s, titulo: s.titulo || "Nova seção" }));

    setSecoes(limpo);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(limpo));
      toast.success("Regulamento salvo neste navegador");
    } catch {
      toast.warning("Alterações aplicadas, mas não foi possível salvá-las neste navegador.");
    }
    setRascunho(null);
  };

  const atualizar = (fn: (d: Secao[]) => Secao[]) => setRascunho((prev) => (prev ? fn(prev) : prev));
  const editSecao = (si: number, fn: (s: Secao) => Secao) =>
    atualizar((d) => d.map((s, i) => (i === si ? fn(s) : s)));
  const editItem = (si: number, ii: number, fn: (it: Item) => Item) =>
    editSecao(si, (s) => ({ ...s, itens: s.itens.map((it, j) => (j === ii ? fn(it) : it)) }));

  const addSecao = () =>
    atualizar((d) => [...d, { id: uid(), titulo: "", itens: [{ id: uid(), texto: "", sub: [] }] }]);
  const removeSecao = (si: number) => {
    if (!window.confirm("Remover esta seção inteira?")) return;
    atualizar((d) => d.filter((_, i) => i !== si));
  };
  const addItem = (si: number) =>
    editSecao(si, (s) => ({ ...s, itens: [...s.itens, { id: uid(), texto: "", sub: [] }] }));
  const removeItem = (si: number, ii: number) =>
    editSecao(si, (s) => ({ ...s, itens: s.itens.filter((_, j) => j !== ii) }));

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
          {!editando && (
            <div className="sticky top-6 space-y-1">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Seções</p>
              {secoes.map((s, i) => (
                <a
                  key={s.id}
                  href={`#${anchorId(s, i)}`}
                  className="block rounded-md px-3 py-1.5 text-sm font-medium text-primary transition hover:bg-muted"
                >
                  {i + 1}. {s.titulo}
                </a>
              ))}
            </div>
          )}
        </nav>

        <div className="space-y-10">
          {/* Barra de ações */}
          {editando ? (
            <div className="sticky top-0 z-10 space-y-2 rounded-lg border border-border bg-white/95 p-3 shadow-sm backdrop-blur print:hidden">
              <div className="flex flex-wrap gap-2">
                <button className={btnPrimary} onClick={salvar}>
                  <Save className="h-4 w-4" /> Salvar alterações
                </button>
                <button className={btnOutline} onClick={cancelar}>
                  <X className="h-4 w-4" /> Cancelar
                </button>
                <button className={btnOutline} onClick={restaurarOriginal}>
                  <RotateCcw className="h-4 w-4" /> Restaurar texto original
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Use <code className="rounded bg-muted px-1">[]</code> onde a informação ainda está a definir. As
                alterações ficam salvas só neste navegador.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 print:hidden">
              <button className={btnPrimary} onClick={copiar}>
                {copied ? <><CheckCircle2 className="h-4 w-4" /> Copiado</> : <><Copy className="h-4 w-4" /> Copiar texto</>}
              </button>
              <button className={btnOutline} onClick={() => window.print()}>
                <Printer className="h-4 w-4" /> Imprimir / salvar PDF
              </button>
              <button className={btnOutline} onClick={iniciarEdicao}>
                <Pencil className="h-4 w-4" /> Editar regulamento
              </button>
            </div>
          )}

          {/* Modo edição */}
          {editando &&
            rascunho.map((s, si) => (
              <section key={s.id} className="space-y-3 rounded-lg border border-border p-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-muted-foreground">
                    {String(si + 1).padStart(2, "0")}
                  </span>
                  <input
                    className={inputCls + " font-bold text-primary"}
                    placeholder="Título da seção"
                    value={s.titulo}
                    onChange={(e) => editSecao(si, (x) => ({ ...x, titulo: e.target.value }))}
                  />
                  <IconBtn label="Subir seção" disabled={si === 0} onClick={() => atualizar((d) => mover(d, si, -1))}>
                    <ArrowUp className="h-4 w-4" />
                  </IconBtn>
                  <IconBtn
                    label="Descer seção"
                    disabled={si === rascunho.length - 1}
                    onClick={() => atualizar((d) => mover(d, si, 1))}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </IconBtn>
                  <IconBtn label="Remover seção" danger onClick={() => removeSecao(si)}>
                    <Trash2 className="h-4 w-4" />
                  </IconBtn>
                </div>

                {s.itens.map((it, ii) => (
                  <div key={it.id} className="space-y-2 rounded-md bg-muted/40 p-3">
                    <div className="flex gap-2">
                      <textarea
                        className={inputCls}
                        rows={Math.max(2, Math.ceil(it.texto.length / 90))}
                        placeholder="Texto do item"
                        value={it.texto}
                        onChange={(e) => editItem(si, ii, (x) => ({ ...x, texto: e.target.value }))}
                      />
                      <div className="flex flex-col">
                        <IconBtn
                          label="Subir item"
                          disabled={ii === 0}
                          onClick={() => editSecao(si, (x) => ({ ...x, itens: mover(x.itens, ii, -1) }))}
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </IconBtn>
                        <IconBtn
                          label="Descer item"
                          disabled={ii === s.itens.length - 1}
                          onClick={() => editSecao(si, (x) => ({ ...x, itens: mover(x.itens, ii, 1) }))}
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </IconBtn>
                        <IconBtn label="Remover item" danger onClick={() => removeItem(si, ii)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </IconBtn>
                      </div>
                    </div>

                    {it.sub.map((sub, ki) => (
                      <div key={ki} className="ml-6 flex items-center gap-2">
                        <input
                          className={inputCls}
                          placeholder="Subitem"
                          value={sub}
                          onChange={(e) =>
                            editItem(si, ii, (x) => ({
                              ...x,
                              sub: x.sub.map((v, k) => (k === ki ? e.target.value : v)),
                            }))
                          }
                        />
                        <IconBtn
                          label="Remover subitem"
                          danger
                          onClick={() => editItem(si, ii, (x) => ({ ...x, sub: x.sub.filter((_, k) => k !== ki) }))}
                        >
                          <X className="h-3.5 w-3.5" />
                        </IconBtn>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => editItem(si, ii, (x) => ({ ...x, sub: [...x.sub, ""] }))}
                      className="ml-6 inline-flex items-center gap-1 text-xs font-medium text-secondary hover:underline"
                    >
                      <Plus className="h-3 w-3" /> Adicionar subitem
                    </button>
                  </div>
                ))}

                <button className={btnOutline + " px-3 py-1.5 text-xs"} onClick={() => addItem(si)}>
                  <Plus className="h-3.5 w-3.5" /> Adicionar item
                </button>
              </section>
            ))}

          {editando && (
            <button className={btnOutline} onClick={addSecao}>
              <Plus className="h-4 w-4" /> Nova seção
            </button>
          )}

          {/* Modo leitura */}
          {!editando &&
            secoes.map((s, i) => (
              <section key={s.id} id={anchorId(s, i)} className="scroll-mt-6">
                <h2 className="mb-4 flex items-baseline gap-3 border-b border-border pb-2 text-xl font-bold text-primary">
                  <span className="text-sm font-semibold text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                  {s.titulo}
                </h2>
                <ul className="space-y-3 text-sm leading-relaxed text-foreground">
                  {s.itens.map((it) => (
                    <li key={it.id} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      <div>
                        <p>{comPendencias(it.texto)}</p>
                        {it.sub.length > 0 && (
                          <ul className="mt-2 space-y-1.5 rounded-lg bg-muted p-3 font-semibold text-primary">
                            {it.sub.map((x, k) => (
                              <li key={k}>{x}</li>
                            ))}
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
