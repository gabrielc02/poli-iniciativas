import { supabase } from "@/lib/supabase";

export type Initiative = {
  id: string;
  name: string;
  category:
    | "Evento"
    | "Infraestrutura"
    | "Cultura"
    | "Esporte"
    | "Educação"
    | "Tecnologia";
  date: string;
  image: string;
  status: "andamento" | "concluido";
};

export async function getInitiatives(): Promise<Initiative[]> {
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();

  const { data, error } = await supabase
    .from("iniciativas")
    .select("id, nome, descricao, status, categoria, data_inicio, image")
    .order("data_inicio", { ascending: false });

  console.log("Dados recebidos:", data);
  console.log("Erro Supabase:", error);

  if (error) {
    throw error;
  }

  return (data ?? []).map((item) => ({
    id: String(item.id),
    name: item.nome,
    category: item.categoria,
    date: item.data_inicio,
    image: item.image,
    status: item.status,
  }));
}

export type User = {
  name: string;
  email: string;
};