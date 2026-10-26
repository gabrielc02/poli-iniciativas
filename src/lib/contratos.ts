// Gerador de contratos de patrocínio do Hack@Poli (Grêmio Politécnico da USP).
// Lógica pura (sem React): leitura da planilha, template do contrato, exportação.

export type Proposta = "apoio" | "retorno" | "principal";

export const PROPOSTAS: Record<Proposta, { nome: string; valorPadrao: number }> = {
  apoio: { nome: "Apoio Estudantil", valorPadrao: 1300 },
  retorno: { nome: "Parceria com Retorno", valorPadrao: 5600 },
  principal: { nome: "Parceria Principal", valorPadrao: 13100 },
};

/* ------------------------------------------------------------------ */
/* Dados do Grêmio (preenchidos uma vez, valem para todos os contratos) */
/* ------------------------------------------------------------------ */

export type Gremio = {
  cnpj: string;
  endereco: string;
  assin1Nome: string;
  assin1Cargo: string;
  assin1Cpf: string;
  assin1Imagem: string;
  assin2Nome: string;
  assin2Cargo: string;
  assin2Cpf: string;
  assin2Imagem: string;
  assin3Nome: string;
  assin3Cargo: string;
  assin3Cpf: string;
  assin3Imagem: string;
  dadosBancarios: string;
  formaPagamento: string;
  prazoPagamento: string;
  documentoFiscal: string;
  avisoPrevio: string;
  devolucao: string;
  prazoTema: string;
  cidade: string;
  data: string;
};

export function dataPorExtenso(d: Date = new Date()): string {
  return d.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
}

export function gremioPadrao(): Gremio {
  return {
    cnpj: "62.841.382/0001-33",
    endereco: "Av. Professor Almeida Prado, 128, Travessa 2, São Paulo - SP",
    assin1Nome: "",
    assin1Cargo: "",
    assin1Cpf: "",
    assin1Imagem: "",
    assin2Nome: "",
    assin2Cargo: "",
    assin2Cpf: "",
    assin2Imagem: "",
    assin3Nome: "",
    assin3Cargo: "",
    assin3Cpf: "",
    assin3Imagem: "",
    dadosBancarios: "",
    formaPagamento: "transferência bancária",
    prazoPagamento: "",
    documentoFiscal: "",
    avisoPrevio: "",
    devolucao: "",
    prazoTema: "",
    cidade: "São Paulo",
    data: dataPorExtenso(),
  };
}

export const GREMIO_CAMPOS: {
  key: keyof Gremio;
  label: string;
  grupo: string;
  dica?: string;
  longo?: boolean;
}[] = [
  { key: "cnpj", label: "CNPJ do Grêmio", grupo: "Entidade" },
  { key: "endereco", label: "Endereço da sede", grupo: "Entidade", longo: true },
  { key: "assin1Nome", label: "Nome", grupo: "Quem assina pelo Grêmio (1)" },
  { key: "assin1Cargo", label: "Cargo", grupo: "Quem assina pelo Grêmio (1)" },
  { key: "assin1Cpf", label: "CPF", grupo: "Quem assina pelo Grêmio (1)" },
  { key: "assin2Nome", label: "Nome", grupo: "Quem assina pelo Grêmio (2)" },
  { key: "assin2Cargo", label: "Cargo", grupo: "Quem assina pelo Grêmio (2)" },
  { key: "assin2Cpf", label: "CPF", grupo: "Quem assina pelo Grêmio (2)" },
  { key: "assin3Nome", label: "Nome", grupo: "Quem assina pelo Grêmio (3)" },
  { key: "assin3Cargo", label: "Cargo", grupo: "Quem assina pelo Grêmio (3)" },
  { key: "assin3Cpf", label: "CPF", grupo: "Quem assina pelo Grêmio (3)" },
  { key: "dadosBancarios", label: "Dados para pagamento", grupo: "Pagamento", dica: "banco, agência, conta ou chave PIX", longo: true },
  { key: "formaPagamento", label: "Forma de pagamento", grupo: "Pagamento" },
  { key: "prazoPagamento", label: "Pagar até", grupo: "Pagamento", dica: "ex.: 06 de novembro de 2026" },
  { key: "documentoFiscal", label: "Documento emitido", grupo: "Pagamento", dica: "ex.: recibo" },
  { key: "avisoPrevio", label: "Aviso prévio para rescindir", grupo: "Condições a definir", dica: "ex.: 5 (cinco) dias" },
  { key: "devolucao", label: "Devolução se o evento for cancelado", grupo: "Condições a definir", dica: "ex.: 50% (cinquenta por cento)" },
  { key: "prazoTema", label: "Prazo para a empresa definir o tema", grupo: "Condições a definir", dica: "só vale para a Parceria Principal" },
  { key: "cidade", label: "Cidade", grupo: "Contrato" },
  { key: "data", label: "Data", grupo: "Contrato" },
];

/* ------------------------------------------------------------------ */
/* Leitura da planilha                                                 */
/* ------------------------------------------------------------------ */

export function parseCSV(texto: string): string[][] {
  const t = texto.replace(/^\uFEFF/, "");
  const primeira = t.split(/\r?\n/, 1)[0] ?? "";
  const conta = (c: string) => primeira.split(c).length - 1;
  const delim = [";", "\t", ","]
    .map((c) => [c, conta(c)] as const)
    .sort((a, b) => b[1] - a[1])[0][0];

  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let aspas = false;
  const fechaLinha = () => {
    row.push(cur);
    cur = "";
    if (row.some((c) => c.trim() !== "")) rows.push(row);
    row = [];
  };
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (aspas) {
      if (ch === '"') {
        if (t[i + 1] === '"') {
          cur += '"';
          i++;
        } else aspas = false;
      } else cur += ch;
    } else if (ch === '"') aspas = true;
    else if (ch === delim) {
      row.push(cur);
      cur = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && t[i + 1] === "\n") i++;
      fechaLinha();
    } else cur += ch;
  }
  fechaLinha();
  return rows.map((r) => r.map((c) => c.trim()));
}

const norm = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

type Campo = "empresa" | "cnpj" | "proposta" | "valor" | "endereco" | "representante" | "cargo";

const ALIAS: Record<string, Campo> = {
  empresa: "empresa",
  nome: "empresa",
  nomedaempresa: "empresa",
  nomeempresa: "empresa",
  razaosocial: "empresa",
  company: "empresa",
  cnpj: "cnpj",
  cnpjdaempresa: "cnpj",
  proposta: "proposta",
  plano: "proposta",
  modalidade: "proposta",
  tipo: "proposta",
  tier: "proposta",
  valor: "valor",
  valorpatrocinio: "valor",
  valordopatrocinio: "valor",
  endereco: "endereco",
  enderecodaempresa: "endereco",
  sede: "endereco",
  representante: "representante",
  responsavel: "representante",
  signatario: "representante",
  nomerepresentante: "representante",
  cargo: "cargo",
  cargorepresentante: "cargo",
};

export function soDigitos(s: string): string {
  return s.replace(/\D/g, "");
}

export function formatarCNPJ(d: string): string {
  const x = soDigitos(d);
  if (x.length !== 14) return d;
  return x.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

export function cnpjValido(d: string): boolean {
  const x = soDigitos(d);
  if (x.length !== 14 || /^(\d)\1+$/.test(x)) return false;
  const dv = (len: number) => {
    const pesos = len === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let s = 0;
    for (let i = 0; i < len; i++) s += Number(x[i]) * pesos[i];
    const r = s % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return dv(12) === Number(x[12]) && dv(13) === Number(x[13]);
}

export function parseValor(s: string): number | null {
  let v = s.replace(/R\$|\s/gi, "");
  if (!v) return null;
  if (v.includes(",")) v = v.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(v)) v = v.replace(/\./g, "");
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function parseProposta(s: string): Proposta | null {
  const n = norm(s);
  if (!n) return null;
  const d = soDigitos(s);
  if (n.includes("princip") || d === "1" || d.startsWith("131")) return "principal";
  if (n.includes("retorno") || d === "2" || d.startsWith("56")) return "retorno";
  if (n.includes("apoio") || n.includes("estud") || d === "3" || d.startsWith("13")) return "apoio";
  return null;
}

export type EmpresaLinha = {
  id: number;
  empresa: string;
  cnpj: string;
  proposta: Proposta;
  valor: number;
  valorInformado: boolean;
  endereco: string;
  representante: string;
  cargo: string;
  avisos: string[];
};

export function normalizarEmpresas(rows: string[][]): EmpresaLinha[] {
  if (rows.length === 0) return [];
  const mapa = rows[0].map((h) => ALIAS[norm(h)]);
  const temCabecalho = mapa.includes("empresa");
  const colunas: (Campo | undefined)[] = temCabecalho ? mapa : ["empresa", "cnpj", "proposta", "valor"];
  const dados = temCabecalho ? rows.slice(1) : rows;

  return dados.map((r, i) => {
    const pega = (c: Campo) => {
      const idx = colunas.indexOf(c);
      return idx >= 0 ? (r[idx] ?? "").trim() : "";
    };
    const avisos: string[] = [];
    const empresa = pega("empresa");
    if (!empresa) avisos.push("sem nome da empresa");

    let cnpj = soDigitos(pega("cnpj"));
    if (cnpj.length === 12 || cnpj.length === 13) cnpj = cnpj.padStart(14, "0");
    if (!cnpj) avisos.push("CNPJ ausente");
    else if (!cnpjValido(cnpj)) avisos.push("CNPJ com dígitos verificadores inválidos");

    const textoProposta = pega("proposta");
    let proposta = parseProposta(textoProposta);
    if (!proposta) {
      if (textoProposta) avisos.push(`proposta "${textoProposta}" não reconhecida, usando Apoio Estudantil`);
      proposta = "apoio";
    }
    const v = parseValor(pega("valor"));
    return {
      id: i,
      empresa,
      cnpj,
      proposta,
      valor: v ?? PROPOSTAS[proposta].valorPadrao,
      valorInformado: v !== null,
      endereco: pega("endereco"),
      representante: pega("representante"),
      cargo: pega("cargo"),
      avisos,
    };
  });
}

/* ------------------------------------------------------------------ */
/* Valor por extenso                                                   */
/* ------------------------------------------------------------------ */

const UN = ["zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
const DZ = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
const CT = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

function ate999(n: number): string {
  if (n === 100) return "cem";
  const c = Math.floor(n / 100);
  const r = n % 100;
  const p: string[] = [];
  if (c) p.push(CT[c]);
  if (r) {
    if (r < 20) p.push(UN[r]);
    else {
      const d = Math.floor(r / 10);
      const u = r % 10;
      p.push(u ? `${DZ[d]} e ${UN[u]}` : DZ[d]);
    }
  }
  return p.join(" e ");
}

function inteiroPorExtenso(n: number): string {
  if (n === 0) return "zero";
  const milhoes = Math.floor(n / 1_000_000);
  const mil = Math.floor((n % 1_000_000) / 1000);
  const cent = n % 1000;
  const p: string[] = [];
  if (milhoes) p.push(milhoes === 1 ? "um milhão" : `${ate999(milhoes)} milhões`);
  if (mil) p.push(mil === 1 ? "mil" : `${ate999(mil)} mil`);
  if (cent) p.push(ate999(cent));
  if (p.length === 1) return p[0];
  const ultimo = cent || mil;
  const sep = ultimo < 100 || ultimo % 100 === 0 ? " e " : " ";
  return p.slice(0, -1).join(" ") + sep + p[p.length - 1];
}

export function valorPorExtenso(valor: number): string {
  const centavosTotal = Math.round(valor * 100);
  const reais = Math.floor(centavosTotal / 100);
  const cent = centavosTotal % 100;
  if (reais >= 1_000_000_000 || centavosTotal <= 0) return "";
  const partes: string[] = [];
  if (reais > 0) {
    const de = reais >= 1_000_000 && reais % 1_000_000 === 0 ? "de " : "";
    partes.push(`${inteiroPorExtenso(reais)} ${reais === 1 ? "real" : de + "reais"}`);
  }
  if (cent > 0) partes.push(`${inteiroPorExtenso(cent)} ${cent === 1 ? "centavo" : "centavos"}`);
  return partes.join(" e ");
}

export function formatarValor(n: number): string {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ------------------------------------------------------------------ */
/* Template do contrato                                                */
/* ------------------------------------------------------------------ */

type Clausula = { titulo: string; itens: string[] };

const ORDINAIS = ["PRIMEIRA", "SEGUNDA", "TERCEIRA", "QUARTA", "QUINTA", "SEXTA", "SÉTIMA", "OITAVA", "NONA", "DÉCIMA", "DÉCIMA PRIMEIRA", "DÉCIMA SEGUNDA", "DÉCIMA TERCEIRA", "DÉCIMA QUARTA", "DÉCIMA QUINTA", "DÉCIMA SEXTA"];

export const TITULO_CONTRATO = "CONTRATO DE PATROCÍNIO PARA O “nomeEvento”";

export const PARTES: string[] = [
  "**PATROCINADA:** GRÊMIO POLITÉCNICO DA USP, associação sem fins lucrativos, representativa dos estudantes da Escola Politécnica da Universidade de São Paulo, inscrita no CNPJ sob o nº {{gremio_cnpj}}, com sede em {{gremio_endereco}}, telefone (11) 91514-8780 e e-mail administrativo@gremiopolitecnico.com, neste ato representada na forma de seu Estatuto Social, doravante denominada simplesmente “Patrocinada”;",
  "**PATROCINADORA:** {{empresa}}, inscrita no CNPJ sob o nº {{cnpj}}, com sede em {{endereco}}, neste ato representada na forma de seu Contrato Social, doravante denominada simplesmente “Patrocinadora”.",
  "As partes identificadas acima celebram o presente Contrato de Patrocínio, que será regido pelas cláusulas e condições a seguir.",
];

const CONTATO_INSCRITOS =
  "Entrar em contato com os inscritos que, no formulário de inscrição, tiverem consentido de forma expressa e específica com o compartilhamento de seus dados com patrocinadores, observada a Cláusula Nona.";
const PALESTRA =
  "Realizar uma atividade na programação do Evento, na forma de palestra ou mentoria, em data e formato a serem acordados entre as partes.";
const AGRADECIMENTO =
  "Receber agradecimento público, como apoiadora do Evento, nas redes sociais do Grêmio Politécnico.";

function direitos(p: Proposta): string[] {
  if (p === "apoio")
    return ["Ter a sua logomarca nos materiais de divulgação do Evento.", AGRADECIMENTO];
  if (p === "retorno")
    return [
      "Ter a sua logomarca nos materiais de divulgação do Evento e visibilidade junto aos participantes durante a sua realização.",
      PALESTRA,
      CONTATO_INSCRITOS,
      "Oferecer sua ferramenta ou produto às equipes, de forma opcional para os participantes, com o apoio da Patrocinada na divulgação dessa possibilidade.",
      AGRADECIMENTO,
    ];
  return [
    "Ter o seu nome associado ao nome do Evento nos materiais e na comunicação, mantida a identificação do Grêmio Politécnico da USP e da Escola Politécnica.",
    "Definir, em conjunto com a Patrocinada, o tema do case do Evento, até {{prazo_tema}}. Na ausência de definição até essa data, a escolha do tema caberá à Patrocinada.",
    "Ter sua ferramenta ou produto como base da experiência do Evento, na forma acordada entre as partes.",
    "Ter acesso às métricas de uso de sua própria ferramenta ou produto durante o Evento.",
    PALESTRA,
    CONTATO_INSCRITOS,
    AGRADECIMENTO,
  ];
}

export function montarClausulas(p: Proposta): Clausula[] {
  const lgpd =
    p === "apoio"
      ? [
          "As partes observarão a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados) em qualquer operação de tratamento de dados pessoais decorrente deste contrato.",
          "A modalidade contratada não inclui o compartilhamento de dados pessoais dos inscritos com a Patrocinadora.",
        ]
      : [
          "As partes observarão a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados) em qualquer operação de tratamento de dados pessoais decorrente deste contrato.",
          "Os dados dos inscritos somente serão compartilhados com a Patrocinadora quando o titular tiver consentido de forma expressa e específica no ato da inscrição, e apenas para as finalidades informadas ao titular.",
          "A Patrocinadora compromete-se a utilizar os dados recebidos exclusivamente para as finalidades consentidas pelo titular e a atender prontamente a pedidos de exclusão ou de revogação do consentimento.",
        ];

  const exclusividade =
    p === "principal"
      ? [
          "Ressalvado o disposto no item 8.2, este contrato não gera exclusividade de patrocínio, podendo a Patrocinada firmar contratos com outras empresas, inclusive do mesmo ramo de atividade da Patrocinadora.",
          "Na modalidade Parceria Principal, a associação do nome da Patrocinadora ao nome do Evento e a definição do tema do case são exclusivas da Patrocinadora.",
        ]
      : [
          "Este contrato não gera exclusividade de patrocínio, podendo a Patrocinada firmar contratos com outras empresas, inclusive do mesmo ramo de atividade da Patrocinadora.",
        ];

  return [
    {
      titulo: "DO OBJETO",
      itens: [
        "O presente contrato tem por objeto o patrocínio, pela Patrocinadora, da primeira edição de {{evento_nome}} (“Evento”), hackathon promovido pela Patrocinada, na modalidade **{{proposta_nome}}**, nos termos da proposta previamente apresentada à Patrocinadora e das condições deste contrato.",
        "O Evento reúne até 80 estudantes de engenharia, organizados em equipes de 2 a 5 pessoas, que desenvolvem Business Model Canvas, protótipo e pitch para uma banca.",
      ],
    },
    {
      titulo: "DA REALIZAÇÃO DO EVENTO E DA DIVULGAÇÃO",
      itens: [
        "O Evento será realizado de 11 a 14 de novembro de 2026, sendo os dias 11, 12 e 13 em formato online e o dia 14 em formato presencial, no Espaço Ocean do Inova USP, na Av. Prof. Lúcio Martins Rodrigues, 370, Butantã, São Paulo/SP.",
        "A divulgação da Patrocinadora ocorrerá nos materiais e canais de comunicação do Evento, antes e durante a sua realização, nos termos da Cláusula Quarta.",
      ],
    },
    {
      titulo: "DO VALOR E DA FORMA DE PAGAMENTO",
      itens: [
        "A Patrocinadora compromete-se a contribuir, a título de patrocínio, com a quantia de R$ {{valor}} ({{valor_extenso}}), mediante {{forma_pagamento}}, a ser paga até {{prazo_pagamento}}.",
        "O pagamento será realizado em favor da Patrocinada, conforme os seguintes dados: {{dados_bancarios}}.",
        "A Patrocinada emitirá {{documento_fiscal}} correspondente ao valor recebido.",
        "O não pagamento integral do valor no prazo estabelecido autoriza a Patrocinada a rescindir este contrato por culpa da Patrocinadora, ficando desobrigada de prestar os benefícios da Cláusula Quarta, sem prejuízo da cobrança dos valores devidos.",
      ],
    },
    { titulo: "DOS DIREITOS DA PATROCINADORA", itens: ["{{direitos_patrocinada}}"] },
    {
      titulo: "DOS DEVERES DA PATROCINADA",
      itens: [
        "Realizar o Evento nas datas e formatos previstos na Cláusula Segunda e reservar à Patrocinadora os espaços de divulgação correspondentes à modalidade contratada.",
        "Divulgar a Patrocinadora conforme a Cláusula Quarta, utilizando a logomarca e os materiais por ela fornecidos.",
        "Utilizar o nome e a logomarca da Patrocinadora apenas para identificá-la como apoiadora do Evento, inclusive em comunicações posteriores sobre a edição e para referenciá-la como parceira da primeira edição.",
        "Cumprir a legislação federal, estadual e municipal aplicável às suas atividades e as normas da Universidade de São Paulo aplicáveis ao Evento.",
      ],
    },
    {
      titulo: "DOS DEVERES DA PATROCINADORA",
      itens: [
        "Efetuar o pagamento do valor previsto na Cláusula Terceira no prazo estabelecido.",
        "Fornecer a sua logomarca em formato adequado para reprodução (vetorial ou em alta resolução), assim que solicitada pela Patrocinada.",
        "Respeitar o regulamento do Evento e as normas do espaço em que ele for realizado.",
      ],
    },
    {
      titulo: "DA PROPRIEDADE DAS SOLUÇÕES DESENVOLVIDAS",
      itens: [
        "As soluções, protótipos e demais materiais desenvolvidos pelos participantes pertencem aos próprios participantes, nos termos do regulamento do Evento.",
        "O patrocínio não confere à Patrocinadora direitos de propriedade ou de exploração sobre tais soluções, podendo a Patrocinadora contatar equipes que manifestem interesse, a critério destas.",
      ],
    },
    { titulo: "DA EXCLUSIVIDADE", itens: exclusividade },
    { titulo: "DA PROTEÇÃO DE DADOS PESSOAIS", itens: lgpd },
    {
      titulo: "DA RESCISÃO E DO CANCELAMENTO",
      itens: [
        "Este contrato poderá ser rescindido por qualquer das partes, mediante notificação por escrito com antecedência mínima de {{aviso_previo}}.",
        "Qualquer das partes poderá rescindir este contrato por justa causa, mediante notificação por escrito, nos casos de: (a) falência, recuperação judicial ou liquidação da outra parte; (b) descumprimento, pela outra parte, das obrigações assumidas neste contrato; (c) acordo entre as partes.",
        "Em caso de cancelamento do Evento por caso fortuito ou força maior, sem culpa das partes, a Patrocinada devolverá {{devolucao}} dos valores pagos, podendo o Evento ser realizado em data diferente, desde que acordado entre as partes.",
      ],
    },
    {
      titulo: "DO SIGILO E DA CONFIDENCIALIDADE",
      itens: [
        "Cada parte manterá sigilo sobre as informações não públicas da outra a que tiver acesso em razão deste contrato, durante a sua vigência e pelo prazo de 5 (cinco) anos após o seu término, não podendo divulgá-las, cedê-las ou utilizá-las para fins diversos do contrato sem autorização prévia e por escrito.",
        "A obrigação de sigilo estende-se a prepostos, representantes e quaisquer terceiros que tenham acesso às informações por intermédio de cada parte.",
      ],
    },
    {
      titulo: "DA BOA-FÉ E DA CONDUTA ÉTICA",
      itens: [
        "As partes observarão a legislação brasileira de combate à corrupção, em especial a Lei nº 12.846/2013, e não oferecerão ou pagarão, direta ou indiretamente, vantagem indevida a qualquer pessoa, pública ou privada, em razão deste contrato.",
        "As partes não admitem nem apoiam, sob qualquer forma, o uso de mão de obra infantil ou o trabalho forçado ou irregular no desenvolvimento de suas atividades.",
      ],
    },
    {
      titulo: "DA NATUREZA EVENTUAL E DA RESPONSABILIDADE",
      itens: [
        "O presente contrato tem natureza de parceria eventual, não criando vínculo societário, empregatício ou de responsabilidade solidária ou subsidiária entre as partes.",
        "Cada parte responde por seus próprios atos e omissões, bem como pelos de seus prepostos e contratados, perante a outra parte e terceiros, nos termos da lei.",
      ],
    },
    {
      titulo: "DAS DISPOSIÇÕES FINAIS",
      itens: [
        "Este contrato não poderá ser cedido ou transferido, total ou parcialmente, sem o consentimento prévio e por escrito da outra parte.",
        "Alterações somente terão validade se formalizadas por termo aditivo firmado pelas partes; acordos verbais não obrigam as partes.",
        "A tolerância quanto ao descumprimento de qualquer cláusula não constitui novação nem renúncia a direitos.",
        "Este contrato substitui quaisquer tratativas anteriores sobre o mesmo objeto, ressalvada a proposta mencionada na Cláusula Primeira.",
        "As notificações serão feitas por escrito, para os endereços indicados neste contrato ou outros comunicados por escrito, e consideradas entregues no seu recebimento.",
      ],
    },
    {
      titulo: "DA ASSINATURA ELETRÔNICA",
      itens: [
        "Este instrumento é assinado eletronicamente pelas partes, que reconhecem a autoria e a integridade das assinaturas, nos termos do art. 10, § 2º, da Medida Provisória nº 2.200-2/2001 e demais normas aplicáveis, e declaram que os signatários possuem poderes para assiná-lo.",
      ],
    },
    {
      titulo: "DO FORO",
      itens: ["Fica eleito o foro da Comarca de São Paulo para dirimir conflitos oriundos deste contrato, com exclusão de qualquer outro."],
    },
  ];
}

/* ------------------------------------------------------------------ */
/* Preenchimento e HTML                                                */
/* ------------------------------------------------------------------ */

export type Vars = Record<string, string>;

const ROTULOS: Record<string, string> = {
  empresa: "nome da empresa",
  cnpj: "CNPJ da empresa",
  endereco: "endereço da empresa",
  proposta_nome: "modalidade",
  evento_nome: "nome do evento",
  direitos_patrocinada: "direitos oferecidos ao patrocinador",
  valor: "valor",
  valor_extenso: "valor por extenso",
  gremio_cnpj: "CNPJ do Grêmio",
  gremio_endereco: "endereço do Grêmio",
  forma_pagamento: "forma de pagamento",
  prazo_pagamento: "prazo de pagamento",
  dados_bancarios: "dados para pagamento",
  documento_fiscal: "recibo ou nota fiscal",
  aviso_previo: "aviso prévio",
  devolucao: "devolução em caso de cancelamento",
  prazo_tema: "prazo para definir o tema",
  cidade: "cidade",
  data: "data",
  gremio_assin1_nome: "nome de quem assina pelo Grêmio",
  gremio_assin1_cargo: "cargo",
  gremio_assin1_cpf: "CPF",
  gremio_assin1_imagem: "assinatura do primeiro signatário",
  gremio_assin2_nome: "nome de quem assina pelo Grêmio",
  gremio_assin2_cargo: "cargo",
  gremio_assin2_cpf: "CPF",
  gremio_assin2_imagem: "assinatura do segundo signatário",
  gremio_assin3_nome: "nome de quem assina pelo Grêmio",
  gremio_assin3_cargo: "cargo",
  gremio_assin3_cpf: "CPF",
  gremio_assin3_imagem: "assinatura do terceiro signatário",
  rep_empresa2_nome: "segundo representante da empresa",
  rep_empresa2_cargo: "cargo do segundo representante",
  rep_empresa3_nome: "terceiro representante da empresa",
  rep_empresa3_cargo: "cargo do terceiro representante",
  rep_empresa_nome: "representante da empresa",
  rep_empresa_cargo: "cargo do representante",
};

export type Modo = "empresa" | "campos";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function preencher(texto: string, vars: Vars, modo: Modo): string {
  const seguro = esc(texto).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  const out = seguro.replace(/\{\{(\w+)\}\}/g, (_m, k: string) => {
    const rot = esc(ROTULOS[k] ?? k);
    if (modo === "campos") return `<span class="campo">${rot}</span>`;
    const v = vars[k];
    return v && v.trim() ? esc(v) : `<mark class="pend">[A PREENCHER: ${rot}]</mark>`;
  });
  return out;
}

const LINHA = "______________________________";

export function variaveis(
  e: { empresa: string; cnpj: string; endereco: string; representante: string; cargo: string; proposta: Proposta; valor: number },
  g: Gremio,
): Vars {
  return {
    empresa: e.empresa,
    evento_nome: "Hack@Poli",
    direitos_patrocinada: "",
    cnpj: e.cnpj ? formatarCNPJ(e.cnpj) : "",
    endereco: e.endereco,
    proposta_nome: PROPOSTAS[e.proposta].nome,
    valor: formatarValor(e.valor),
    valor_extenso: valorPorExtenso(e.valor),
    gremio_cnpj: g.cnpj,
    gremio_endereco: g.endereco,
    forma_pagamento: g.formaPagamento,
    prazo_pagamento: g.prazoPagamento,
    dados_bancarios: g.dadosBancarios,
    documento_fiscal: g.documentoFiscal,
    aviso_previo: g.avisoPrevio,
    devolucao: g.devolucao,
    prazo_tema: g.prazoTema,
    cidade: g.cidade,
    data: g.data,
    gremio_assin1_nome: g.assin1Nome,
    gremio_assin1_cargo: g.assin1Cargo,
    gremio_assin1_cpf: g.assin1Cpf,
    gremio_assin1_imagem: g.assin1Imagem,
    gremio_assin2_nome: g.assin2Nome,
    gremio_assin2_cargo: g.assin2Cargo,
    gremio_assin2_cpf: g.assin2Cpf,
    gremio_assin2_imagem: g.assin2Imagem,
    gremio_assin3_nome: g.assin3Nome,
    gremio_assin3_cargo: g.assin3Cargo,
    gremio_assin3_cpf: g.assin3Cpf,
    gremio_assin3_imagem: g.assin3Imagem,
    rep_empresa2_nome: "",
    rep_empresa2_cargo: "",
    rep_empresa3_nome: "",
    rep_empresa3_cargo: "",
    rep_empresa_nome: e.representante || LINHA,
    rep_empresa_cargo: e.cargo || LINHA,
  };
}

export const EXEMPLO_EMPRESA = {
  empresa: "Empresa Exemplo Ltda.",
  cnpj: "11444777000161",
  endereco: "Rua Exemplo, 123, São Paulo/SP",
  representante: "Nome do Representante",
  cargo: "Diretor(a)",
};

export function contratoHTML(proposta: Proposta, vars: Vars, modo: Modo = "empresa"): string {
  const f = (t: string) => preencher(t, vars, modo);
  const partes: string[] = [];
  partes.push(`<h1>${esc(`CONTRATO DE PATROCÍNIO PARA O “${vars.evento_nome || "nomeEvento"}”`)}</h1>`);
  partes.push(`<h2>IDENTIFICAÇÃO DAS PARTES CONTRATANTES</h2>`);
  PARTES.forEach((p) => partes.push(`<p>${f(p)}</p>`));
  montarClausulas(proposta).forEach((c, i) => {
    partes.push(`<h3>CLÁUSULA ${ORDINAIS[i]} – ${esc(c.titulo)}</h3>`);
    c.itens.forEach((it, j) => {
      if (it === "{{direitos_patrocinada}}" && vars.direitos_patrocinada?.trim()) {
        vars.direitos_patrocinada.split(/\n+/).map((x) => x.trim()).filter(Boolean).forEach((direito, k) =>
          partes.push(`<p><span class="n">${i + 1}.${k + 1}</span> ${f(direito)}</p>`),
        );
      } else if (it === "{{direitos_patrocinada}}") {
        partes.push(`<p><span class="n">${i + 1}.${j + 1}</span> A definir entre as partes.</p>`);
      } else {
        partes.push(`<p><span class="n">${i + 1}.${j + 1}</span> ${f(it)}</p>`);
      }
    });
  });
  partes.push(`<p>E, por estarem justas e contratadas, as partes assinam este instrumento eletronicamente.</p>`);
  partes.push(`<p class="data">${f("{{cidade}}, {{data}}.")}</p>`);
  const bloco = (titulo: string, nome: string, cargo: string, cpf?: string) => {
    const patrocinadora = titulo === "PATROCINADORA";
    const campoNome = patrocinadora ? LINHA.slice(0, 28) : f(nome);
    const campoCargo = patrocinadora ? LINHA.slice(0, 28) : f(cargo);
    const imagem = patrocinadora ? "" : vars[nome.replace(/[{}]/g, "").replace("gremio_assin", "gremio_assin").replace("_nome", "_imagem")] || "";
    const imagemHtml = imagem.startsWith("data:image/") ? `<div class="assin-imagem"><img src="${imagem}" alt="Assinatura" /></div>` : "";
    return `<td>${imagemHtml}<div class="linha"></div><strong>${titulo}</strong><br/>Nome: ${campoNome}<br/>Cargo: ${campoCargo}<br/>CPF: ${cpf ? f(cpf) : LINHA.slice(0, 18)}</td>`;
  };
  const qtdGremio = Math.min(3, Math.max(1, Number(vars.qtd_assinaturas_gremio || 2)));
  const qtdPatrocinador = Math.min(3, Math.max(1, Number(vars.qtd_assinaturas_patrocinador || 1)));
  const assinaturasGremio = [
    ["{{gremio_assin1_nome}}", "{{gremio_assin1_cargo}}", "{{gremio_assin1_cpf}}"],
    ["{{gremio_assin2_nome}}", "{{gremio_assin2_cargo}}", "{{gremio_assin2_cpf}}"],
    ["{{gremio_assin3_nome}}", "{{gremio_assin3_cargo}}", "{{gremio_assin3_cpf}}"],
  ];
  const assinaturasPatrocinador = [
    ["{{rep_empresa_nome}}", "{{rep_empresa_cargo}}", ""],
    ["{{rep_empresa2_nome}}", "{{rep_empresa2_cargo}}", ""],
    ["{{rep_empresa3_nome}}", "{{rep_empresa3_cargo}}", ""],
  ];
  const cellsGremio = assinaturasGremio
    .slice(0, qtdGremio)
    .map((a) => bloco("GRÊMIO POLITÉCNICO DA USP (Patrocinada)", a[0]!, a[1]!, a[2]));
  const cellsPatrocinador = assinaturasPatrocinador
    .slice(0, qtdPatrocinador)
    .map((a) => bloco("PATROCINADORA", a[0]!, a[1]!, a[2] || undefined));
  partes.push(`<table class="assin assin-gremio"><tr>${cellsGremio.join("")}</tr></table>`);
  partes.push(`<table class="assin assin-patrocinador"><tr>${cellsPatrocinador.join("")}</tr></table>`);
  return `<div class="contrato">${partes.join("\n")}</div>`;
}

export function contarPendencias(html: string): number {
  return (html.match(/class="pend"/g) ?? []).length;
}

export const CSS_CONTRATO = `
.contrato{font-family:"Times New Roman",Times,serif;font-size:12pt;line-height:1.45;color:#000;text-align:justify}
.contrato h1{font-size:14pt;text-align:center;margin:0 0 18pt;font-weight:bold}
.contrato h2{font-size:12pt;margin:14pt 0 6pt;font-weight:bold}
.contrato h3{font-size:12pt;margin:14pt 0 6pt;font-weight:bold;text-align:left}
.contrato p{margin:0 0 6pt}
.contrato .n{font-weight:bold;margin-right:4pt}
.contrato .data{margin-top:14pt}
.contrato mark.pend{background:#fff3a3;color:#000;padding:0 2px}
.contrato .campo{background:#dbe7fb;color:#13376e;padding:0 3px;border-radius:2px;font-family:Arial,sans-serif;font-size:10pt}
.contrato table.assin{width:100%;margin-top:28pt;border-collapse:collapse}
.contrato table.assin{table-layout:fixed}.contrato table.assin td{vertical-align:top;padding:0 8pt 18pt;font-size:11pt;text-align:left}.contrato table.assin.assin-gremio{margin-top:28pt}.contrato table.assin.assin-gremio td{text-align:center}.contrato table.assin.assin-patrocinador{margin-top:0}.contrato table.assin.assin-patrocinador td{text-align:center}
.contrato .linha{border-top:1px solid #000;margin:8pt 0 4pt}.contrato .assin-imagem{height:30pt;display:flex;align-items:flex-end;justify-content:center;margin-bottom:2pt}.contrato .assin-imagem img{max-width:150pt;max-height:28pt;object-fit:contain}
`;

export function documentoWord(corpo: string, titulo: string): string {
  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>${esc(titulo)}</title><!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]--><style>@page Section1{size:21cm 29.7cm;margin:2.5cm}div.Section1{page:Section1}${CSS_CONTRATO}</style></head><body><div class="Section1">${corpo}</div></body></html>`;
}

export function documentoImpressao(corpo: string, titulo: string): string {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(titulo)}</title><style>@page{size:A4;margin:2.5cm}body{margin:0}${CSS_CONTRATO}</style></head><body>${corpo}</body></html>`;
}

/* ------------------------------------------------------------------ */
/* Arquivos: nome, ZIP, download                                       */
/* ------------------------------------------------------------------ */

export function slug(s: string): string {
  const x = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return x.slice(0, 60) || "empresa";
}

const TABELA_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = TABELA_CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export function montarZip(arquivos: { nome: string; conteudo: string }[]): Uint8Array {
  const enc = new TextEncoder();
  const agora = new Date();
  const hora = (agora.getHours() << 11) | (agora.getMinutes() << 5) | Math.floor(agora.getSeconds() / 2);
  const dia = ((agora.getFullYear() - 1980) << 9) | ((agora.getMonth() + 1) << 5) | agora.getDate();

  const usados = new Set<string>();
  const locais: Uint8Array[] = [];
  const centrais: Uint8Array[] = [];
  let offset = 0;

  for (const a of arquivos) {
    let nome = a.nome;
    let n = 2;
    while (usados.has(nome)) nome = a.nome.replace(/(\.[^.]+)?$/, `_${n++}$1`);
    usados.add(nome);

    const nomeB = enc.encode(nome);
    const dados = enc.encode(a.conteudo);
    const crc = crc32(dados);

    const loc = new Uint8Array(30 + nomeB.length + dados.length);
    const lv = new DataView(loc.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0x0800, true);
    lv.setUint16(8, 0, true);
    lv.setUint16(10, hora, true);
    lv.setUint16(12, dia, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, dados.length, true);
    lv.setUint32(22, dados.length, true);
    lv.setUint16(26, nomeB.length, true);
    lv.setUint16(28, 0, true);
    loc.set(nomeB, 30);
    loc.set(dados, 30 + nomeB.length);
    locais.push(loc);

    const cen = new Uint8Array(46 + nomeB.length);
    const cv = new DataView(cen.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x0800, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, hora, true);
    cv.setUint16(14, dia, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, dados.length, true);
    cv.setUint32(24, dados.length, true);
    cv.setUint16(28, nomeB.length, true);
    cv.setUint32(42, offset, true);
    cen.set(nomeB, 46);
    centrais.push(cen);

    offset += loc.length;
  }

  const tamCentral = centrais.reduce((s, c) => s + c.length, 0);
  const fim = new Uint8Array(22);
  const fv = new DataView(fim.buffer);
  fv.setUint32(0, 0x06054b50, true);
  fv.setUint16(8, arquivos.length, true);
  fv.setUint16(10, arquivos.length, true);
  fv.setUint32(12, tamCentral, true);
  fv.setUint32(16, offset, true);

  const total = offset + tamCentral + fim.length;
  const out = new Uint8Array(total);
  let pos = 0;
  for (const p of [...locais, ...centrais, fim]) {
    out.set(p, pos);
    pos += p.length;
  }
  return out;
}

export function baixarArquivo(nome: string, conteudo: BlobPart, tipo: string): void {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function baixarWord(nome: string, docHtml: string): void {
  baixarArquivo(nome, "\ufeff" + docHtml, "application/msword;charset=utf-8");
}

export function imprimir(docHtml: string): void {
  const f = document.createElement("iframe");
  f.setAttribute("aria-hidden", "true");
  f.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  document.body.appendChild(f);
  const d = f.contentWindow?.document;
  if (!d || !f.contentWindow) return;
  d.open();
  d.write(docHtml);
  d.close();
  const w = f.contentWindow;
  w.onafterprint = () => f.remove();
  setTimeout(() => {
    w.focus();
    w.print();
  }, 300);
  setTimeout(() => f.remove(), 120000);
}

export function decodificar(buf: ArrayBuffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buf);
  } catch {
    return new TextDecoder("windows-1252").decode(buf);
  }
}

export const MODELO_CSV =
  "empresa;cnpj;proposta;valor;endereco;representante;cargo\n" +
  "Empresa Exemplo Ltda.;11.444.777/0001-61;apoio;;Rua Exemplo, 123, São Paulo/SP;;\n" +
  "Startup Modelo S.A.;;retorno;;;Maria Silva;Diretora\n" +
  "Grupo Teste;;principal;13100;;;\n";
