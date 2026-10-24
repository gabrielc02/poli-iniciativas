import { supabase } from "@/lib/supabase";

export type Parceiro = {
  id: string;
  nome_organizacao: string;
  ponto_de_contato: string | null;
  ramo: string | null;
  linkedin: string | null;
  email: string | null;
  telefone: string | null;
  status: string | null;
  observacoes: string | null;
};

export type ParceiroInput = Omit<Parceiro, "id">;

export async function getParceiros(): Promise<Parceiro[]> {
  const { data, error } = await supabase
    .from("parceiros")
    .select("*")
    .order("nome_organizacao", { ascending: true });

  if (error) throw error;

  return (data ?? []) as Parceiro[];
}

export async function criarParceiro(
  parceiro: ParceiroInput,
): Promise<Parceiro> {
  const { data, error } = await supabase
    .from("parceiros")
    .insert(parceiro)
    .select()
    .single();

  if (error) throw error;

  return data as Parceiro;
}

export async function atualizarParceiro(
  id: string,
  parceiro: ParceiroInput,
): Promise<Parceiro> {
  const { data, error } = await supabase
    .from("parceiros")
    .update(parceiro)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data as Parceiro;
}

export async function excluirParceiro(id: string): Promise<void> {
  const { error } = await supabase
    .from("parceiros")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
