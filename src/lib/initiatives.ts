import semana from "@/assets/sem_recp_2026.jpg";
import hacka from "@/assets/hackaPoli_2026.png";


export type Initiative = {
  id: string;
  name: string;
  category: "Evento" | "Infraestrutura" | "Cultura" | "Esporte" | "Educação" | "Tecnologia";
  date: string;
  image: string;
  status: "andamento" | "concluido";
};

export const ongoing: Initiative[] = [
  { id: "1", name: "HackaPoli - 2026", category: "Evento", date: "Nov 2026", image: hacka, status: "andamento" },
];

export const past: Initiative[] = [
  { id: "2", name: "Semana de Recepção dos Calouros USP - 2026", category: "Evento", date: "Fev 2026", image: semana, status: "concluido" },
];

const KEY = "gpusp-user";
export type User = { name: string; email: string };
export const getUser = (): User | null => {
  try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; }
};
export const setUser = (u: User | null) =>
  u ? localStorage.setItem(KEY, JSON.stringify(u)) : localStorage.removeItem(KEY);
