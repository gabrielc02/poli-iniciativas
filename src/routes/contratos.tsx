import { useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteHero } from "@/components/SiteHero";
import {
  EXEMPLO_EMPRESA,
  GREMIO_CAMPOS,
  CSS_CONTRATO,
  MODELO_CSV,
  PROPOSTAS,
  TITULO_CONTRATO,
  baixarArquivo,
  baixarWord,
  contarPendencias,
  contratoHTML,
  decodificar,
  documentoImpressao,
  documentoWord,
  formatarCNPJ,
  gremioPadrao,
  imprimir,
  montarZip,
  normalizarEmpresas,
  parseCSV,
  slug,
  variaveis,
} from "../lib/contratos";
import type { EmpresaLinha, Gremio, Proposta } from "../lib/contratos";

// Se o projeto não usa rotas por arquivo, remova esta linha e registre ContratosPage como a página /contratos.
export const Route = createFileRoute("/contratos")({ component: ContratosPage });

const PROPOSTAS_ORDEM: Proposta[] = ["apoio", "retorno", "principal"];

function ContratosPage() {
  const [texto, setTexto] = useState("");
  const [arquivo, setArquivo] = useState("");
  const [gremio, setGremio] = useState<Gremio>(gremioPadrao);
  const [override, setOverride] = useState<Record<number, Proposta>>({});
  const [aba, setAba] = useState<"modelo" | "empresa">("modelo");
  const [selId, setSelId] = useState<number | null>(null);
  const [propModelo] = useState<Proposta>("retorno");
  const [evento, setEvento] = useState("nomeEvento");
  const [direitosPatrocinada, setDireitosPatrocinada] = useState("");
  const [qtdAssinaturasGremio, setQtdAssinaturasGremio] = useState(2);
  const [qtdAssinaturasPatrocinador, setQtdAssinaturasPatrocinador] = useState(1);
  const [assinaturaPatrocinador2, setAssinaturaPatrocinador2] = useState({ nome: "", cargo: "" });
  const [assinaturaPatrocinador3, setAssinaturaPatrocinador3] = useState({ nome: "", cargo: "" });
  const [mostrarCampos, setMostrarCampos] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const linhas = useMemo<EmpresaLinha[]>(
    () =>
      normalizarEmpresas(parseCSV(texto)).map((l) => {
        const o = override[l.id];
        if (!o) return { ...l, proposta: "retorno" as Proposta };
        return { ...l, proposta: "retorno" as Proposta, valor: l.valorInformado ? l.valor : PROPOSTAS.retorno.valorPadrao };
      }),
    [texto, override],
  );

  const htmls = useMemo(() => linhas.map((l) => contratoHTML(l.proposta, { ...variaveis(l, gremio), evento_nome: evento, direitos_patrocinada: direitosPatrocinada, qtd_assinaturas_gremio: String(qtdAssinaturasGremio), qtd_assinaturas_patrocinador: String(qtdAssinaturasPatrocinador), rep_empresa2_nome: assinaturaPatrocinador2.nome, rep_empresa2_cargo: assinaturaPatrocinador2.cargo, rep_empresa3_nome: assinaturaPatrocinador3.nome, rep_empresa3_cargo: assinaturaPatrocinador3.cargo })), [linhas, gremio, evento, direitosPatrocinada, qtdAssinaturasGremio, qtdAssinaturasPatrocinador, assinaturaPatrocinador2, assinaturaPatrocinador3]);
  const pendencias = useMemo(() => htmls.map(contarPendencias), [htmls]);

  const sel = linhas.find((l) => l.id === selId) ?? linhas[0] ?? null;
  const selIdx = sel ? linhas.indexOf(sel) : -1;

  const previewHtml = useMemo(() => {
    if (aba === "modelo") {
      const v = variaveis(
        { ...EXEMPLO_EMPRESA, proposta: propModelo, valor: PROPOSTAS[propModelo].valorPadrao },
        gremio,
      );
      return contratoHTML(propModelo, { ...v, evento_nome: evento, direitos_patrocinada: direitosPatrocinada, qtd_assinaturas_gremio: String(qtdAssinaturasGremio), qtd_assinaturas_patrocinador: String(qtdAssinaturasPatrocinador), rep_empresa2_nome: assinaturaPatrocinador2.nome, rep_empresa2_cargo: assinaturaPatrocinador2.cargo, rep_empresa3_nome: assinaturaPatrocinador3.nome, rep_empresa3_cargo: assinaturaPatrocinador3.cargo }, mostrarCampos ? "campos" : "empresa");
    }
    return sel ? htmls[selIdx] : "";
  }, [aba, propModelo, mostrarCampos, gremio, sel, selIdx, htmls, evento, direitosPatrocinada, qtdAssinaturasGremio, qtdAssinaturasPatrocinador, assinaturaPatrocinador2, assinaturaPatrocinador3]);

  const grupos = useMemo(() => {
    const m = new Map<string, (typeof GREMIO_CAMPOS)[number][]>();
    for (const c of GREMIO_CAMPOS) m.set(c.grupo, [...(m.get(c.grupo) ?? []), c]);
    return Array.from(m.entries());
  }, []);
  const faltando = GREMIO_CAMPOS.filter((c) => !gremio[c.key].trim()).length;

  const nomeDoc = (l: EmpresaLinha) => `Contrato_HackPoli_${slug(l.empresa)}.doc`;

  async function lerArquivo(f?: File) {
    if (!f) return;
    setTexto(decodificar(await f.arrayBuffer()));
    setArquivo(f.name);
    setOverride({});
    setSelId(null);
    setAba("empresa");
  }

  function baixarUm() {
    if (!sel) return;
    baixarWord(nomeDoc(sel), documentoWord(htmls[selIdx], TITULO_CONTRATO));
  }

  function baixarTodos() {
    const arquivos = linhas.map((l, i) => ({
      nome: nomeDoc(l),
      conteudo: "ufeff" + documentoWord(htmls[i], TITULO_CONTRATO),
    }));
    baixarArquivo("Contratos_HackPoli.zip", montarZip(arquivos) as BlobPart, "application/zip");
  }

  function baixarModeloCSV() {
    baixarArquivo("modelo_empresas.csv", "ufeff" + MODELO_CSV, "text/csv;charset=utf-8");
  }

  const totalPend = pendencias.reduce((s, n) => s + n, 0);

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader user={null} onLogout={() => {}} />
      <SiteHero title="Contratos de patrocínio" subtitle="Configure os dados das partes e gere contratos personalizados">
        <p>Informe os dados do evento, os direitos oferecidos ao patrocinador e os signatários. Depois, confira a prévia e exporte os contratos.</p>
      </SiteHero>
      <main className="ct">
      <style>{CSS_PAGINA}</style>
      <style>{CSS_CONTRATO}</style>

      <div className="ct-grade">
        <div className="ct-coluna">
          <section className="ct-bloco" aria-labelledby="ct-lista">
            <h2 id="ct-lista">1. Lista de empresas</h2>
            <label className="ct-campo"><span>Nome do evento</span><input type="text" value={evento} onChange={(e) => setEvento(e.target.value)} /></label>
            <label className="ct-campo"><span>Direitos da Patrocinada (descreva o que será oferecido)</span><textarea rows={5} value={direitosPatrocinada} onChange={(e) => setDireitosPatrocinada(e.target.value)} placeholder="Descreva os direitos e contrapartidas acordados com o patrocinador." /></label>
            <div className="ct-campo"><span>Quantidade de assinaturas</span><div className="ct-grade-assin ct-qtd-gremio"><label>Grêmio<select value={qtdAssinaturasGremio} onChange={(e) => setQtdAssinaturasGremio(Number(e.target.value))}><option value={1}>1 assinatura</option><option value={2}>2 assinaturas</option><option value={3}>3 assinaturas</option></select></label></div><div className="ct-grade-assin ct-qtd-empresa"><label>Empresa<select value={qtdAssinaturasPatrocinador} onChange={(e) => setQtdAssinaturasPatrocinador(Number(e.target.value))}><option value={1}>1 assinatura</option><option value={2}>2 assinaturas</option><option value={3}>3 assinaturas</option></select></label></div></div>
            <p className="ct-ajuda">
              Colunas: <b>empresa</b> e <b>cnpj</b>. Opcionais: proposta (apoio, retorno ou principal), valor, endereço,
              representante e cargo.
            </p>
            <div className="ct-acoes">
              <button type="button" onClick={() => inputRef.current?.click()}>
                Enviar planilha (.csv)
              </button>
              <button type="button" className="ct-sec" onClick={baixarModeloCSV}>
                Baixar planilha modelo
              </button>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,.txt,text/csv"
                hidden
                onChange={(e) => {
                  void lerArquivo(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </div>
            <label className="ct-campo">
              <span>Ou cole a lista aqui{arquivo ? ` (última: ${arquivo})` : ""}</span>
              <textarea
                rows={4}
                value={texto}
                placeholder={"empresa;cnpjnEmpresa Exemplo Ltda.;11.444.777/0001-61"}
                onChange={(e) => {
                  setTexto(e.target.value);
                  setOverride({});
                  setSelId(null);
                }}
              />
            </label>

            {linhas.length > 0 && (
              <>
                <p className="ct-resumo">
                  {linhas.length} {linhas.length === 1 ? "empresa" : "empresas"} · {totalPend} campos a preencher nos
                  contratos
                </p>
                <ul className="ct-lista">
                  {linhas.map((l, i) => (
                    <li key={l.id} className={l.id === sel?.id && aba === "empresa" ? "ct-ativa" : ""}>
                      <button
                        type="button"
                        className="ct-nome"
                        aria-pressed={l.id === sel?.id && aba === "empresa"}
                        onClick={() => {
                          setSelId(l.id);
                          setAba("empresa");
                        }}
                      >
                        <strong>{l.empresa || "(sem nome)"}</strong>
                        <small>{l.cnpj ? formatarCNPJ(l.cnpj) : "CNPJ ausente"}</small>
                      </button>

                      <span className={pendencias[i] ? "ct-chip ct-aviso" : "ct-chip"}>
                        {pendencias[i] ? `${pendencias[i]} a preencher` : "completo"}
                      </span>
                      {l.avisos.length > 0 && <p className="ct-alerta">{l.avisos.join("; ")}</p>}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          <section className="ct-bloco" aria-labelledby="ct-gremio">
            <details open={faltando > 0}>
              <summary id="ct-gremio">
                2. Dados do Grêmio <span className="ct-chip">{faltando ? `${faltando} em branco` : "completo"}</span>
              </summary>
              <p className="ct-ajuda">Valem para todos os contratos. O que ficar em branco sai destacado em amarelo.</p>
              {grupos.filter(([grupo]) => !grupo.startsWith("Quem assina pelo Grêmio") || Number(grupo.match(/\((\d)\)/)?.[1] ?? 0) <= qtdAssinaturasGremio).map(([grupo, campos]) => (
                <fieldset key={grupo}>
                  <legend>{grupo}</legend>
                  {campos.map((c) => (
                    <label key={c.key} className="ct-campo">
                      <span>
                        {c.label}
                        {c.dica ? <em> · {c.dica}</em> : null}
                      </span>
                      {c.longo ? (
                        <textarea
                          rows={2}
                          value={gremio[c.key]}
                          onChange={(e) => setGremio({ ...gremio, [c.key]: e.target.value })}
                        />
                      ) : (
                        <input
                          type="text"
                          value={gremio[c.key]}
                          onChange={(e) => setGremio({ ...gremio, [c.key]: e.target.value })}
                        />
                      )}
                    </label>
                  ))}
                  {grupo.startsWith("Quem assina pelo Grêmio") && (() => {
                    const numero = Number(grupo.match(/\((\d)\)/)?.[1] ?? 1);
                    const chave = (`assin${numero}Imagem`) as "assin1Imagem" | "assin2Imagem" | "assin3Imagem";
                    return (
                      <label className="ct-campo">
                        <span>Imagem da assinatura (opcional · PNG/JPG)</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (!["image/png", "image/jpeg"].includes(file.type)) {
                              e.target.value = "";
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = () => {
                              if (typeof reader.result === "string") {
                                setGremio((atual) => ({ ...atual, [chave]: reader.result as string }));
                              }
                            };
                            reader.readAsDataURL(file);
                            e.target.value = "";
                          }}
                        />
                        {gremio[chave] && (
                          <div className="ct-assinatura-preview">
                            <img src={gremio[chave]} alt={`Prévia da assinatura ${numero}`} />
                            <button type="button" className="ct-sec" onClick={() => setGremio((atual) => ({ ...atual, [chave]: "" }))}>Remover imagem</button>
                          </div>
                        )}
                      </label>
                    );
                  })()}
                </fieldset>
              ))}
            </details>
          </section>
        </div>

        <section className="ct-previa" aria-label="Pré-visualização">
          <div className="ct-barra">
            <div className="ct-abas" role="tablist">
              <button type="button" role="tab" aria-selected={aba === "modelo"} onClick={() => setAba("modelo")}>
                Template
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={aba === "empresa"}
                disabled={!sel}
                onClick={() => setAba("empresa")}
              >
                Contrato da empresa
              </button>
            </div>

            {aba === "modelo" ? (
              <div className="ct-opcoes">

                <label className="ct-check">
                  <input type="checkbox" checked={mostrarCampos} onChange={(e) => setMostrarCampos(e.target.checked)} />
                  Mostrar nomes dos campos
                </label>
              </div>
            ) : (
              <div className="ct-opcoes">
                <button type="button" onClick={baixarUm} disabled={!sel}>
                  Baixar .doc
                </button>
                <button
                  type="button"
                  className="ct-sec"
                  disabled={!sel}
                  onClick={() => imprimir(documentoImpressao(previewHtml, TITULO_CONTRATO))}
                >
                  Salvar em PDF
                </button>
                <button type="button" className="ct-sec" disabled={linhas.length === 0} onClick={baixarTodos}>
                  Baixar todos (.zip)
                </button>
              </div>
            )}
          </div>

          {aba === "empresa" && !sel ? (
            <p className="ct-vazio">Envie a planilha para ver o contrato de cada empresa.</p>
          ) : (
            <div className="ct-papel">
              <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
            </div>
          )}
        </section>
      </div>
      </main>
    </div>
  );
}

const CSS_PAGINA = `
.ct{--ct-fundo:#f4f5f7;--ct-painel:#fff;--ct-borda:#d6dae1;--ct-texto:#1b2430;--ct-suave:#5a6575;--ct-acento:#1d4f9f;--ct-acento-txt:#fff;--ct-aviso:#fff3a3;
  background:var(--ct-fundo);color:var(--ct-texto);font-family:system-ui,-apple-system,"Segoe UI",sans-serif;font-size:15px;line-height:1.45;padding:24px;min-height:100vh;box-sizing:border-box}
.ct *{box-sizing:border-box}
.ct-topo{max-width:1320px;margin:0 auto 18px}
.ct-topo h1{font-size:24px;margin:0 0 4px}
.ct-topo p{margin:0;color:var(--ct-suave)}
.ct-grade{max-width:1320px;margin:0 auto;display:grid;grid-template-columns:minmax(320px,430px) minmax(0,1fr);gap:20px;align-items:start}
.ct-coluna{display:flex;flex-direction:column;gap:16px}
.ct-bloco{background:var(--ct-painel);border:1px solid var(--ct-borda);border-radius:8px;padding:16px}
.ct-bloco h2,.ct-bloco summary{font-size:16px;margin:0 0 8px;font-weight:600;cursor:default}
.ct-bloco summary{cursor:pointer}
.ct-ajuda{color:var(--ct-suave);font-size:13px;margin:4px 0 10px}
.ct-acoes,.ct-opcoes{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.ct button{font:inherit;border:1px solid var(--ct-acento);background:var(--ct-acento);color:var(--ct-acento-txt);border-radius:6px;padding:7px 12px;cursor:pointer}
.ct button.ct-sec{background:transparent;color:var(--ct-acento)}
.ct button:disabled{opacity:.45;cursor:not-allowed}
.ct button:focus-visible,.ct select:focus-visible,.ct input:focus-visible,.ct textarea:focus-visible{outline:2px solid var(--ct-acento);outline-offset:2px}
.ct-campo{display:block;margin:10px 0 0}
.ct-campo span{display:block;font-size:13px;color:var(--ct-suave);margin-bottom:3px}
.ct-campo em{font-style:normal;opacity:.85}
.ct-grade-assin{display:grid;grid-template-columns:1fr 1fr;gap:10px}.ct-grade-assin label{font-size:13px;color:var(--ct-suave)}.ct-qtd-gremio{grid-template-columns:minmax(0,1fr);max-width:100%}.ct-qtd-empresa{grid-template-columns:minmax(0,1fr);max-width:100%;margin-top:8px}
.ct-grade-assin{display:grid;grid-template-columns:1fr 1fr;gap:10px}.ct-grade-assin label{font-size:13px;color:var(--ct-suave)}.ct-qtd-gremio{grid-template-columns:minmax(0,1fr);max-width:100%}.ct-qtd-empresa{grid-template-columns:minmax(0,1fr);max-width:100%;margin-top:8px}
.ct input[type=text],.ct textarea,.ct select{font:inherit;width:100%;border:1px solid var(--ct-borda);border-radius:6px;padding:6px 8px;background:#fff;color:var(--ct-texto)}
.ct textarea{resize:vertical}
.ct fieldset{border:0;border-top:1px solid var(--ct-borda);margin:12px 0 0;padding:6px 0 0}
.ct legend{font-size:13px;font-weight:600;padding:0 6px 0 0}
.ct-resumo{font-size:13px;color:var(--ct-suave);margin:14px 0 6px}
.ct-lista{list-style:none;margin:0;padding:0;max-height:340px;overflow:auto;border:1px solid var(--ct-borda);border-radius:6px}
.ct-lista li{display:grid;grid-template-columns:1fr auto;gap:6px 8px;padding:8px;border-bottom:1px solid var(--ct-borda);align-items:center}
.ct-lista li:last-child{border-bottom:0}
.ct-lista li.ct-ativa{background:#e8effa}
.ct-lista select{width:auto;max-width:170px;padding:4px 6px;font-size:13px}
.ct .ct-nome{background:transparent;border:0;color:inherit;text-align:left;padding:0;display:flex;flex-direction:column;min-width:0}
.ct-nome strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ct-nome small{color:var(--ct-suave)}
.ct-chip{display:inline-block;font-size:12px;border:1px solid var(--ct-borda);border-radius:99px;padding:1px 8px;color:var(--ct-suave);margin-left:6px;font-weight:400}
.ct-lista .ct-chip{margin-left:0;justify-self:start}
.ct-chip.ct-aviso{background:var(--ct-aviso);border-color:#e3d46a;color:#4d4300}
.ct-alerta{grid-column:1/-1;margin:0;font-size:12px;color:#8a3b00}
.ct-previa{min-width:0}
.ct-barra{display:flex;flex-wrap:wrap;gap:10px 16px;justify-content:space-between;align-items:center;margin-bottom:12px}
.ct-abas{display:flex;gap:6px}
.ct .ct-abas button{background:transparent;color:var(--ct-texto);border-color:var(--ct-borda)}
.ct .ct-abas button[aria-selected=true]{background:var(--ct-acento);color:var(--ct-acento-txt);border-color:var(--ct-acento)}
.ct-opcoes label{font-size:13px;color:var(--ct-suave)}
.ct-opcoes select{width:auto}
.ct-check{display:flex;gap:6px;align-items:center}
.ct-papel{background:#fff;border:1px solid var(--ct-borda);border-radius:4px;box-shadow:0 1px 3px rgba(0,0,0,.08);padding:clamp(18px,4vw,56px);max-width:850px;overflow-x:auto}
.ct-vazio{background:var(--ct-painel);border:1px dashed var(--ct-borda);border-radius:8px;padding:28px;color:var(--ct-suave);text-align:center}\n.ct-assinatura-preview{display:flex;align-items:center;gap:12px;margin-top:8px;flex-wrap:wrap}.ct-assinatura-preview img{max-width:220px;max-height:70px;object-fit:contain;border:1px solid var(--ct-borda);padding:4px;background:#fff}
@media (max-width:960px){.ct{padding:14px}.ct-grade{grid-template-columns:1fr}}
`;
