import { supabase } from "@/lib/supabase";

export type Inscrito = {
  id: string;
  email: string;
  nome: string | null;
  telefone: string | null;
  curso: string | null; // "Qual engenharia você está cursando?"
  ano_ingresso: string | null; // "Em que ano você ingressou na Poli?"
  linkedin: string | null;
  inscrito_em: string | null; // data/hora da inscrição no Luma (ISO)
  checked_in_at: string | null; // data/hora do check-in no Luma (null = não fez check-in)
  status: string | null; // status de aprovação exatamente como veio do Luma
  time_original: string | null; // time informado no formulário do Luma
  time_corrigido: string | null; // ajuste feito na página: null = usar o original, "" = sem time
};

// O que vem do CSV do Luma. Não inclui time_corrigido, para a reimportação nunca apagar os ajustes.
export type InscritoImport = {
  email: string;
  nome: string | null;
  telefone: string | null;
  curso: string | null;
  ano_ingresso: string | null;
  linkedin: string | null;
  inscrito_em: string | null;
  checked_in_at: string | null;
  status: string | null;
  time_original: string | null;
};

export type StatusKey = "aprovado" | "pendente" | "recusado" | "outro";

// Traduz o status do Luma (approved, pending_approval, declined...) para 4 categorias.
export function classificarStatus(status: string | null): StatusKey {
  const n = (status ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  if (/pending|pendente|aguard/.test(n)) return "pendente";
  if (/declin|recus|rejeit|not going|nao vai/.test(n)) return "recusado";
  if (/approv|aprov|going|confirm/.test(n)) return "aprovado";
  return "outro";
}

const COLUNAS =
  "id, email, nome, telefone, curso, ano_ingresso, linkedin, inscrito_em, checked_in_at, status, time_original, time_corrigido";

export async function getInscritos(): Promise<Inscrito[]> {
  const { data, error } = await supabase
    .from("inscritos")
    .select(COLUNAS)
    .order("inscrito_em", { ascending: true, nullsFirst: false });

  if (error) {
    throw new Error(`Erro ao buscar inscritos: ${error.message}`);
  }

  return (data ?? []) as Inscrito[];
}

// Insere os novos e atualiza os existentes (chave: e-mail). Devolve quantas linhas foram enviadas.
export async function importarInscritos(linhas: InscritoImport[]): Promise<number> {
  const TAMANHO_LOTE = 200;

  for (let i = 0; i < linhas.length; i += TAMANHO_LOTE) {
    const lote = linhas.slice(i, i + TAMANHO_LOTE).map((l) => ({
      ...l,
      atualizado_em: new Date().toISOString(),
    }));

    const { error } = await supabase.from("inscritos").upsert(lote, { onConflict: "email" });

    if (error) {
      throw new Error(`Erro ao importar inscritos: ${error.message}`);
    }
  }

  return linhas.length;
}

// Define o time (corrigido) de uma ou mais pessoas.
// time = null -> volta ao time original do Luma; "" -> deixa sem time.
export async function atualizarTime(ids: string[], time: string | null): Promise<void> {
  if (ids.length === 0) return;

  const { error } = await supabase
    .from("inscritos")
    .update({ time_corrigido: time })
    .in("id", ids);

  if (error) {
    throw new Error(`Erro ao atualizar o time: ${error.message}`);
  }
}
