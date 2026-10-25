import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type MouseEvent as ReactMouseEvent } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Download, Eye, Loader2, Mail, Plus, Trash2, Upload } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteHero } from "@/components/SiteHero";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { User } from "@/lib/initiatives";
import { supabase } from "@/lib/supabase";
import { classificarStatus, getInscritos, type Inscrito } from "@/lib/inscritos";

// Dependências necessárias: npm i pdf-lib jszip

export const Route = createFileRoute("/certificados")({
  head: () => ({
    meta: [
      { title: "Gerador de Certificados | Grêmio Politécnico" },
      { name: "description", content: "Gere os certificados do Hack@Poli a partir da lista de inscritos aprovados." },
      { property: "og:title", content: "Gerador de Certificados | Grêmio Politécnico" },
      { property: "og:description", content: "Gere os certificados do Hack@Poli a partir da lista de inscritos aprovados." },
    ],
  }),
  component: Certificados,
  errorComponent: ({ error, reset }) => (
    <div className="mx-auto max-w-xl space-y-3 p-10 text-center">
      <h1 className="text-lg font-bold text-[#0B2545]">Erro ao carregar o gerador</h1>
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

/* ---------- Configuração do template ---------- */

const PAGE_W = 842; // largura da página em pontos (A4 paisagem); a altura segue a proporção da arte
const CFG_KEY = "gremio:certificados:cfg";

type FonteKey = "helvetica" | "helveticaBold" | "times" | "timesBold" | "courier";

const fontes: Record<
  FonteKey,
  { label: string; std: "Helvetica" | "HelveticaBold" | "TimesRoman" | "TimesRomanBold" | "Courier"; css: string; bold: boolean }
> = {
  helvetica: { label: "Sans-serif", std: "Helvetica", css: "Arial, Helvetica, sans-serif", bold: false },
  helveticaBold: { label: "Sans-serif negrito", std: "HelveticaBold", css: "Arial, Helvetica, sans-serif", bold: true },
  times: { label: "Serifada", std: "TimesRoman", css: "'Times New Roman', Times, serif", bold: false },
  timesBold: { label: "Serifada negrito", std: "TimesRomanBold", css: "'Times New Roman', Times, serif", bold: true },
  courier: { label: "Monoespaçada", std: "Courier", css: "'Courier New', Courier, monospace", bold: false },
};

type Cfg = {
  x: number; // posição horizontal do centro do nome (0 a 1)
  y: number; // posição vertical do centro do nome (0 a 1, de cima para baixo)
  fonte: FonteKey;
  tamanho: number; // pontos
  cor: string; // #rrggbb
  larguraMax: number; // % da largura da página; nomes maiores encolhem para caber
};

const cfgPadrao: Cfg = { x: 0.5, y: 0.5, fonte: "helveticaBold", tamanho: 36, cor: "#0B2545", larguraMax: 70 };

type Tpl = { nome: string; bytes: Uint8Array; largura: number; altura: number; previewUrl: string };

/* ---------- Helpers ---------- */

const fieldCls =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#0B2545] focus:ring-1 focus:ring-[#0B2545]";
const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-md bg-[#0B2545] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1a4a7a] disabled:opacity-60";
const btnOutline =
  "inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-[#0B2545] transition hover:bg-slate-50 disabled:opacity-60";

const MINUSCULAS = new Set(["da", "de", "do", "das", "dos", "e", "di", "du"]);

// Nomes todos em maiúsculas ou todos em minúsculas viram "Nome Sobrenome"; os demais ficam como estão.
function formatarNome(n: string): string {
  const t = n.trim().replace(/\s+/g, " ");
  if (!t) return "";
  if (t !== t.toUpperCase() && t !== t.toLowerCase()) return t;
  return t
    .toLowerCase()
    .split(" ")
    .map((p, i) => (i > 0 && MINUSCULAS.has(p) ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join(" ");
}

function hexParaRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
  if (!m) return [0, 0, 0];
  return [parseInt(m[1]!, 16) / 255, parseInt(m[2]!, 16) / 255, parseInt(m[3]!, 16) / 255];
}

function nomeDeArquivo(nome: string, usados: Set<string>): string {
  const base = `Certificado - ${nome.replace(/[\\/:*?"<>|]/g, "").trim() || "participante"}`;
  let arquivo = `${base}.pdf`;
  for (let n = 2; usados.has(arquivo.toLowerCase()); n++) arquivo = `${base} (${n}).pdf`;
  usados.add(arquivo.toLowerCase());
  return arquivo;
}

function baixar(blob: Blob, arquivo: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = arquivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

const pdfBlob = (bytes: Uint8Array) => new Blob([new Uint8Array(bytes)], { type: "application/pdf" });

// Reduz a arte (máx. 2400 px de largura) e converte para JPEG: PDFs menores e sem problema de transparência.
async function prepararArte(file: File): Promise<{ bytes: Uint8Array; largura: number; altura: number }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("Não foi possível ler a imagem. Use PNG ou JPG."));
      i.src = url;
    });
    const escala = Math.min(1, 2400 / img.naturalWidth);
    const w = Math.round(img.naturalWidth * escala);
    const h = Math.round(img.naturalHeight * escala);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Seu navegador não conseguiu processar a imagem.");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
    if (!blob) throw new Error("Falha ao converter a imagem.");
    return { bytes: new Uint8Array(await blob.arrayBuffer()), largura: w, altura: h };
  } finally {
    URL.revokeObjectURL(url);
  }
}

type PdfLib = typeof import("pdf-lib");

async function montarPdf(lib: PdfLib, tpl: Tpl, cfg: Cfg, nome: string): Promise<Uint8Array> {
  const doc = await lib.PDFDocument.create();
  const img = await doc.embedJpg(tpl.bytes);
  const W = PAGE_W;
  const H = (W * tpl.altura) / tpl.largura;
  const page = doc.addPage([W, H]);
  page.drawImage(img, { x: 0, y: 0, width: W, height: H });

  const font = await doc.embedFont(lib.StandardFonts[fontes[cfg.fonte].std]);
  let size = cfg.tamanho;
  const larguraMax = (W * cfg.larguraMax) / 100;
  const larguraTexto = font.widthOfTextAtSize(nome, size);
  if (larguraTexto > larguraMax) size = (size * larguraMax) / larguraTexto;

  const w = font.widthOfTextAtSize(nome, size);
  const [r, g, b] = hexParaRgb(cfg.cor);
  page.drawText(nome, {
    x: cfg.x * W - w / 2,
    y: H - cfg.y * H - size * 0.36, // centraliza a altura das letras no ponto escolhido
    size,
    font,
    color: lib.rgb(r, g, b),
  });

  doc.setTitle(`Certificado - ${nome}`);
  return doc.save();
}

/* ---------- Tipos da página ---------- */

type Linha = { id: string; origem: "luma" | "manual"; nomeBase: string; email: string; checkin: boolean };
type Manual = { id: string; nome: string; email: string };
type ItemGerar = { id: string; nome: string; email: string };
type Gerado = ItemGerar & { arquivo: string; bytes: Uint8Array };
type Resultado = { assinatura: string; itens: Gerado[]; falhas: { nome: string; motivo: string }[] };

const uid = () => Math.random().toString(36).slice(2, 10);

/* ---------- Diálogos ---------- */

function ManualDialog({ onSalvar, onClose }: { onSalvar: (nome: string, email: string) => void; onClose: () => void }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      toast.error("Digite o nome que aparecerá no certificado.");
      return;
    }
    onSalvar(nome.trim(), email.trim());
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#0B2545]">Certificado manual</DialogTitle>
          <DialogDescription>
            Para quem não está na lista (mentor, convidado, organização...). O e-mail é opcional, mas sem ele o
            certificado só pode ser baixado.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <label className="block space-y-1 text-xs font-medium text-slate-600">
            Nome no certificado *
            <input autoFocus className={fieldCls} value={nome} onChange={(e) => setNome(e.target.value)} />
          </label>
          <label className="block space-y-1 text-xs font-medium text-slate-600">
            E-mail
            <input type="email" className={fieldCls} value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className={btnOutline} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className={btnPrimary}>
              Adicionar
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EnviarDialog({ itens, onClose }: { itens: Gerado[]; onClose: () => void }) {
  const [sel, setSel] = useState<Set<string>>(() => new Set(itens.filter((i) => i.email).map((i) => i.id)));
  const semEmail = itens.filter((i) => !i.email).length;

  const alternar = (id: string) =>
    setSel((prev) => {
      const novo = new Set(prev);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });

  const confirmar = () => {
    // TODO (próxima etapa): chamar a função do Supabase que envia pelo Resend, anexando o PDF de cada pessoa.
    toast.info("O envio por e-mail será ativado na próxima etapa.", {
      description: `${sel.size} destinatários estavam selecionados.`,
    });
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-[#0B2545]">Confirmar envio dos certificados</DialogTitle>
          <DialogDescription>
            Desmarque quem não deve receber. O nome é o que está impresso no certificado.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between text-xs">
          <div className="flex gap-3">
            <button
              type="button"
              className="font-medium text-[#1a4a7a] hover:underline"
              onClick={() => setSel(new Set(itens.filter((i) => i.email).map((i) => i.id)))}
            >
              Marcar todos
            </button>
            <button type="button" className="font-medium text-[#1a4a7a] hover:underline" onClick={() => setSel(new Set())}>
              Desmarcar todos
            </button>
          </div>
          <span className="text-slate-500">
            {sel.size} de {itens.length} selecionados
          </span>
        </div>

        <ul className="max-h-[50vh] divide-y divide-slate-100 overflow-y-auto rounded-md border border-slate-200">
          {itens.map((i) => (
            <li key={i.id} className="flex items-center gap-3 px-3 py-2">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={sel.has(i.id)}
                disabled={!i.email}
                onChange={() => alternar(i.id)}
                aria-label={`Enviar para ${i.nome}`}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#0B2545]">{i.nome}</p>
                {i.email ? (
                  <p className="truncate text-xs text-slate-500">{i.email}</p>
                ) : (
                  <p className="text-xs font-medium text-red-700">sem e-mail: só dá para baixar o PDF</p>
                )}
              </div>
            </li>
          ))}
        </ul>

        {semEmail > 0 && (
          <p className="flex items-start gap-2 rounded-md bg-amber-50 p-3 text-xs text-amber-800">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {semEmail} {semEmail === 1 ? "certificado está" : "certificados estão"} sem e-mail e não podem ser enviados.
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button className={btnOutline} onClick={onClose}>
            Cancelar
          </button>
          <button className={btnPrimary} onClick={confirmar} disabled={sel.size === 0}>
            <Mail className="h-4 w-4" /> Confirmar envio ({sel.size})
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Página ---------- */

function Certificados() {
  const navigate = useNavigate();
  const [user, setU] = useState<User | null>(null);

  const [inscritos, setInscritos] = useState<Inscrito[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [cfg, setCfg] = useState<Cfg>(cfgPadrao);
  const [tpl, setTpl] = useState<Tpl | null>(null);
  const [lendoArte, setLendoArte] = useState(false);
  const [previewW, setPreviewW] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [nomes, setNomes] = useState<Record<string, string>>({}); // nome editado no certificado, por linha
  const [marcados, setMarcados] = useState<Set<string>>(new Set());
  const [manuais, setManuais] = useState<Manual[]>([]);
  const iniciou = useRef(false);

  const [gerando, setGerando] = useState<{ atual: number; total: number } | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  const [manualOpen, setManualOpen] = useState(false);
  const [enviarOpen, setEnviarOpen] = useState(false);

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

  // Posição/fonte do nome ficam salvas neste navegador (a arte precisa ser enviada de novo a cada visita).
  useEffect(() => {
    try {
      const salvo = localStorage.getItem(CFG_KEY);
      if (salvo) setCfg({ ...cfgPadrao, ...(JSON.parse(salvo) as Partial<Cfg>) });
    } catch {
      /* ignore */
    }
  }, []);

  const atualizarCfg = (patch: Partial<Cfg>) =>
    setCfg((prev) => {
      const novo = { ...prev, ...patch };
      try {
        localStorage.setItem(CFG_KEY, JSON.stringify(novo));
      } catch {
        /* ignore */
      }
      return novo;
    });

  // Seleção inicial: quem fez check-in; se ninguém tiver check-in, todos os aprovados.
  useEffect(() => {
    if (iniciou.current || inscritos.length === 0) return;
    iniciou.current = true;
    const aprovados = inscritos.filter((i) => classificarStatus(i.status) === "aprovado");
    const comCheckin = aprovados.filter((i) => i.checked_in_at);
    setMarcados(new Set((comCheckin.length > 0 ? comCheckin : aprovados).map((i) => i.id)));
  }, [inscritos]);

  // Largura do preview, para o texto de exemplo ter a mesma proporção do PDF.
  useEffect(() => {
    const el = imgRef.current;
    if (!el || !tpl) return;
    const medir = () => setPreviewW(el.clientWidth);
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, [tpl]);

  const linhas: Linha[] = useMemo(
    () => [
      ...inscritos
        .filter((i) => classificarStatus(i.status) === "aprovado")
        .map((i) => ({
          id: i.id,
          origem: "luma" as const,
          nomeBase: i.nome ?? i.email.split("@")[0] ?? "",
          email: i.email,
          checkin: !!i.checked_in_at,
        })),
      ...manuais.map((m) => ({ id: m.id, origem: "manual" as const, nomeBase: m.nome, email: m.email, checkin: false })),
    ],
    [inscritos, manuais],
  );

  const nomeDe = (l: Linha) => nomes[l.id] ?? (l.origem === "manual" ? l.nomeBase : formatarNome(l.nomeBase));
  const temCheckin = linhas.some((l) => l.checkin);

  const itens: ItemGerar[] = linhas
    .filter((l) => marcados.has(l.id))
    .map((l) => ({ id: l.id, nome: nomeDe(l).trim(), email: l.email.trim() }));

  // Identifica o "estado" atual (arte, estilo e destinatários); se mudar depois de gerar, os PDFs ficam desatualizados.
  const assinatura = JSON.stringify({ t: tpl ? [tpl.nome, tpl.bytes.length] : null, cfg, i: itens.map((x) => [x.id, x.nome]) });
  const desatualizado = resultado !== null && resultado.assinatura !== assinatura;

  const nomeExemplo = itens.reduce((maior, i) => (i.nome.length > maior.length ? i.nome : maior), "") || "Maria da Silva Santos";

  if (!user) return null;

  const logout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  /* --- arte --- */
  const onArte = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setLendoArte(true);
    try {
      const prep = await prepararArte(file);
      setTpl((antigo) => {
        if (antigo) URL.revokeObjectURL(antigo.previewUrl);
        return { nome: file.name, ...prep, previewUrl: URL.createObjectURL(file) };
      });
      toast.success("Arte carregada. Clique na imagem para marcar onde o nome vai ficar.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível carregar a arte.");
    } finally {
      setLendoArte(false);
    }
  };

  const marcarPosicao = (e: ReactMouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    atualizarCfg({
      x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
    });
  };

  /* --- participantes --- */
  const alternar = (id: string) =>
    setMarcados((prev) => {
      const novo = new Set(prev);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });

  const marcarCheckin = () => setMarcados(new Set(linhas.filter((l) => l.checkin || l.origem === "manual").map((l) => l.id)));
  const marcarTodos = () => setMarcados(new Set(linhas.map((l) => l.id)));

  const adicionarManual = (nome: string, email: string) => {
    const m: Manual = { id: `manual-${uid()}`, nome, email };
    setManuais((prev) => [...prev, m]);
    setMarcados((prev) => new Set(prev).add(m.id));
    setManualOpen(false);
  };

  const removerManual = (id: string) => {
    setManuais((prev) => prev.filter((m) => m.id !== id));
    setMarcados((prev) => {
      const novo = new Set(prev);
      novo.delete(id);
      return novo;
    });
  };

  /* --- geração --- */
  const validar = (): boolean => {
    if (!tpl) {
      toast.error("Envie a arte do certificado primeiro.");
      return false;
    }
    if (itens.length === 0) {
      toast.error("Marque pelo menos uma pessoa.");
      return false;
    }
    const vazios = itens.filter((i) => !i.nome).length;
    if (vazios > 0) {
      toast.error(`${vazios} ${vazios === 1 ? "pessoa está" : "pessoas estão"} sem nome no certificado.`);
      return false;
    }
    return true;
  };

  const carregarPdfLib = async (): Promise<PdfLib | null> => {
    try {
      return await import("pdf-lib");
    } catch {
      toast.error("Biblioteca de PDF não encontrada", { description: "Rode: npm i pdf-lib jszip" });
      return null;
    }
  };

  const gerar = async () => {
    if (!validar() || !tpl) return;
    const lib = await carregarPdfLib();
    if (!lib) return;

    const assinaturaInicial = assinatura;
    const lista = itens;
    const gerados: Gerado[] = [];
    const falhas: Resultado["falhas"] = [];
    const usados = new Set<string>();

    setResultado(null);
    setGerando({ atual: 0, total: lista.length });

    for (const [k, it] of lista.entries()) {
      try {
        const bytes = await montarPdf(lib, tpl, cfg, it.nome);
        gerados.push({ ...it, arquivo: nomeDeArquivo(it.nome, usados), bytes });
      } catch (err) {
        falhas.push({ nome: it.nome, motivo: err instanceof Error ? err.message : "erro desconhecido" });
      }
      setGerando({ atual: k + 1, total: lista.length });
      await new Promise((r) => setTimeout(r)); // deixa a tela atualizar
    }

    setResultado({ assinatura: assinaturaInicial, itens: gerados, falhas });
    setGerando(null);
    if (falhas.length === 0) toast.success(`${gerados.length} certificados gerados com sucesso`);
    else toast.warning(`${gerados.length} gerados, ${falhas.length} com erro`);
  };

  // Gera um único PDF com o nome mais longo da seleção, para conferir se cabe e se a posição está certa.
  const testar = async () => {
    if (!tpl) {
      toast.error("Envie a arte do certificado primeiro.");
      return;
    }
    const lib = await carregarPdfLib();
    if (!lib) return;
    try {
      const bytes = await montarPdf(lib, tpl, cfg, nomeExemplo);
      window.open(URL.createObjectURL(pdfBlob(bytes)), "_blank");
    } catch (err) {
      toast.error("Não foi possível gerar o teste", { description: err instanceof Error ? err.message : undefined });
    }
  };

  const baixarZip = async () => {
    if (!resultado) return;
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      for (const g of resultado.itens) zip.file(g.arquivo, g.bytes);
      baixar(await zip.generateAsync({ type: "blob" }), "certificados.zip");
    } catch {
      toast.error("Não foi possível montar o ZIP", { description: "Rode: npm i jszip" });
    }
  };

  const fonte = fontes[cfg.fonte];
  const exemploPx = previewW ? (cfg.tamanho / PAGE_W) * previewW : 0;

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader user={user} onLogout={logout} />

      <SiteHero title="Gerador de Certificados" subtitle="Arte, participantes aprovados e PDFs prontos em poucos cliques">
        <p>
          1. Envie a arte e marque onde fica o nome. 2. Confira quem recebe. 3. Gere os PDFs e confirme o envio.
        </p>
      </SiteHero>

      <main className="mx-auto max-w-6xl space-y-10 bg-white px-4 pb-16 pt-6">
        {/* 1. Template */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-[#0B2545]">1. Arte do certificado</h2>

          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
            <div className="space-y-2">
              {tpl ? (
                <div
                  className="relative cursor-crosshair overflow-hidden rounded-lg border border-slate-300 bg-slate-50"
                  onClick={marcarPosicao}
                >
                  <img ref={imgRef} src={tpl.previewUrl} alt="Arte do certificado" className="block w-full select-none" draggable={false} />
                  {/* limite de largura do nome */}
                  <div
                    className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 border border-dashed border-sky-400/70"
                    style={{
                      left: `${cfg.x * 100}%`,
                      top: `${cfg.y * 100}%`,
                      width: `${cfg.larguraMax}%`,
                      height: `${exemploPx * 1.4}px`,
                    }}
                  />
                  <span
                    className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap leading-none"
                    style={{
                      left: `${cfg.x * 100}%`,
                      top: `${cfg.y * 100}%`,
                      fontSize: `${exemploPx}px`,
                      color: cfg.cor,
                      fontFamily: fonte.css,
                      fontWeight: fonte.bold ? 700 : 400,
                    }}
                  >
                    {nomeExemplo}
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex h-56 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 text-sm text-slate-500 transition hover:border-[#0B2545] hover:text-[#0B2545]"
                >
                  <Upload className="h-6 w-6" />
                  Envie a arte do certificado (PNG ou JPG, sem o nome)
                </button>
              )}
              <p className="text-xs text-slate-500">
                {tpl
                  ? "Clique na arte para posicionar o nome. A caixa tracejada é a largura máxima: nomes maiores encolhem para caber."
                  : "Exporte do Canva em paisagem, sem o nome, e envie a imagem aqui."}
              </p>
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onArte} />
            </div>

            <div className="space-y-3">
              <button className={btnOutline + " w-full"} onClick={() => fileRef.current?.click()} disabled={lendoArte}>
                {lendoArte ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {tpl ? "Trocar arte" : "Enviar arte"}
              </button>

              <label className="block space-y-1 text-xs font-medium text-slate-600">
                Fonte
                <select className={fieldCls} value={cfg.fonte} onChange={(e) => atualizarCfg({ fonte: e.target.value as FonteKey })}>
                  {(Object.keys(fontes) as FonteKey[]).map((k) => (
                    <option key={k} value={k}>
                      {fontes[k].label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1 text-xs font-medium text-slate-600">
                Tamanho: {cfg.tamanho} pt
                <input type="range" min={14} max={90} value={cfg.tamanho} className="w-full"
                  onChange={(e) => atualizarCfg({ tamanho: Number(e.target.value) })} />
              </label>

              <label className="block space-y-1 text-xs font-medium text-slate-600">
                Largura máxima do nome: {cfg.larguraMax}%
                <input type="range" min={30} max={95} value={cfg.larguraMax} className="w-full"
                  onChange={(e) => atualizarCfg({ larguraMax: Number(e.target.value) })} />
              </label>

              <label className="flex items-center justify-between gap-3 text-xs font-medium text-slate-600">
                Cor do texto
                <input type="color" value={cfg.cor} className="h-8 w-14 cursor-pointer rounded border border-slate-300"
                  onChange={(e) => atualizarCfg({ cor: e.target.value })} />
              </label>

              <button className={btnOutline + " w-full"} onClick={testar} disabled={!tpl}>
                <Eye className="h-4 w-4" /> Testar com o nome mais longo
              </button>
              <p className="text-[11px] leading-snug text-slate-500">
                A posição e o estilo ficam salvos neste navegador; a arte precisa ser enviada de novo a cada visita.
                Os PDFs usam fontes padrão (Helvetica, Times, Courier); confira acentos no teste.
              </p>
            </div>
          </div>
        </section>

        {/* 2. Participantes */}
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-[#0B2545]">
              2. Quem recebe <span className="text-sm font-medium text-slate-500">({marcados.size} marcados)</span>
            </h2>
            <div className="flex flex-wrap gap-2">
              <button className={btnOutline + " px-3 py-1.5 text-xs"} onClick={marcarCheckin} disabled={!temCheckin}
                title={temCheckin ? "" : "Reimporte o CSV do Luma com a coluna de check-in"}>
                Só com check-in
              </button>
              <button className={btnOutline + " px-3 py-1.5 text-xs"} onClick={marcarTodos}>
                Todos aprovados
              </button>
              <button className={btnOutline + " px-3 py-1.5 text-xs"} onClick={() => setMarcados(new Set())}>
                Desmarcar todos
              </button>
              <button className={btnPrimary + " px-3 py-1.5 text-xs"} onClick={() => setManualOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> Certificado manual
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando inscritos…
            </div>
          ) : error ? (
            <div className="space-y-3 py-8 text-center">
              <p className="text-sm text-red-700">{error}</p>
              <button className={btnOutline} onClick={() => setReloadKey((k) => k + 1)}>
                Tentar novamente
              </button>
            </div>
          ) : linhas.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              Nenhum inscrito aprovado ainda. Importe o CSV do Luma na página de inscritos ou adicione certificados manuais.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-bold text-slate-600">
                  <tr>
                    <th className="w-10 p-2.5" />
                    <th className="p-2.5">Nome no certificado</th>
                    <th className="p-2.5">E-mail</th>
                    <th className="p-2.5">Origem</th>
                    <th className="w-10 p-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {linhas.map((l) => (
                    <tr key={l.id} className="border-t border-slate-100">
                      <td className="p-2.5">
                        <input type="checkbox" className="h-4 w-4" checked={marcados.has(l.id)} onChange={() => alternar(l.id)}
                          aria-label={`Incluir ${nomeDe(l)}`} />
                      </td>
                      <td className="p-1.5">
                        <input className={fieldCls + " py-1.5"} value={nomeDe(l)}
                          onChange={(e) => setNomes((prev) => ({ ...prev, [l.id]: e.target.value }))} />
                      </td>
                      <td className="p-2.5 text-xs text-slate-600">{l.email || <em>sem e-mail</em>}</td>
                      <td className="p-2.5">
                        {l.origem === "manual" ? (
                          <span className="rounded bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-800">Manual</span>
                        ) : l.checkin ? (
                          <span className="rounded bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-800">Check-in</span>
                        ) : (
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">Aprovado</span>
                        )}
                      </td>
                      <td className="p-2.5">
                        {l.origem === "manual" && (
                          <button type="button" onClick={() => removerManual(l.id)} aria-label={`Remover ${l.nomeBase}`}
                            className="text-slate-400 transition hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* 3. Gerar e enviar */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-[#0B2545]">3. Gerar e enviar</h2>

          <div className="flex flex-wrap items-center gap-3">
            <button className={btnPrimary} onClick={gerar} disabled={!!gerando}>
              {gerando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {gerando ? `Gerando ${gerando.atual}/${gerando.total}…` : `Gerar certificados (${itens.length})`}
            </button>
            <button className={btnOutline} onClick={() => setEnviarOpen(true)}
              disabled={!resultado || resultado.itens.length === 0 || desatualizado || !!gerando}>
              <Mail className="h-4 w-4" /> Enviar por e-mail
            </button>
          </div>

          {desatualizado && (
            <p className="flex items-start gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              A arte, o estilo ou a lista mudou depois da última geração. Gere de novo antes de baixar ou enviar.
            </p>
          )}

          {resultado && (
            <div className="space-y-3 rounded-lg border border-slate-200 p-4">
              {resultado.itens.length > 0 && (
                <p className="flex items-center gap-2 text-sm font-semibold text-green-800">
                  <CheckCircle2 className="h-4 w-4" /> {resultado.itens.length}{" "}
                  {resultado.itens.length === 1 ? "certificado gerado" : "certificados gerados"} com sucesso
                </p>
              )}

              {resultado.falhas.length > 0 && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                  <p className="font-semibold">{resultado.falhas.length} com erro:</p>
                  <ul className="mt-1 list-disc pl-5 text-xs">
                    {resultado.falhas.map((f) => (
                      <li key={f.nome}>
                        {f.nome}: {f.motivo}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs">
                    Geralmente é um caractere que a fonte padrão não suporta. Ajuste o nome na tabela e gere de novo.
                  </p>
                </div>
              )}

              {resultado.itens.length > 0 && (
                <>
                  <button className={btnOutline} onClick={baixarZip}>
                    <Download className="h-4 w-4" /> Baixar tudo (ZIP)
                  </button>
                  <ul className="max-h-60 divide-y divide-slate-100 overflow-y-auto rounded-md border border-slate-100">
                    {resultado.itens.map((g) => (
                      <li key={g.id} className="flex items-center justify-between gap-3 px-3 py-1.5 text-sm">
                        <span className="truncate text-[#0B2545]">{g.nome}</span>
                        <button type="button" className="inline-flex items-center gap-1 text-xs font-medium text-[#1a4a7a] hover:underline"
                          onClick={() => baixar(pdfBlob(g.bytes), g.arquivo)}>
                          <Download className="h-3.5 w-3.5" /> PDF
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </section>
      </main>

      {manualOpen && <ManualDialog onSalvar={adicionarManual} onClose={() => setManualOpen(false)} />}
      {enviarOpen && resultado && <EnviarDialog itens={resultado.itens} onClose={() => setEnviarOpen(false)} />}
    </div>
  );
}
