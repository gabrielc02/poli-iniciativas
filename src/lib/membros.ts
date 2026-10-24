
import { supabase } from "@/lib/supabase";

export type Membro = {
  id: string;
  nome: string;
  cargo: string | null;
  curso: string | null;
  ano_ingresso_curso: number | null;
  email: string | null;
  telefone: string | null;
  status: string | null;
  image: string | null;
};

export async function getMembros(): Promise<Membro[]> {
  const { data, error } = await supabase
    .from("membros")
    .select("*")
    .order("nome", { ascending: true });

  if (error) {
    throw new Error(`Erro ao buscar membros: ${error.message}`);
  }

  return (data ?? []) as Membro[];
}

export async function criarMembro(
  membro: Omit<Membro, "id">
): Promise<Membro> {
  const { data, error } = await supabase
    .from("membros")
    .insert(membro)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao criar membro: ${error.message}`);
  }

  return data as Membro;
}

export async function atualizarMembro(
  id: string,
  alteracoes: Partial<Omit<Membro, "id">>
): Promise<Membro> {
  const { data, error } = await supabase
    .from("membros")
    .update(alteracoes)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar membro: ${error.message}`);
  }

  return data as Membro;
}

export async function excluirMembro(id: string): Promise<void> {
  const { error } = await supabase
    .from("membros")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Erro ao excluir membro: ${error.message}`);
  }
}
