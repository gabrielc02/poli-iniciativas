import semana from "@/assets/semana.jpg";
import interpoli from "@/assets/interpoli.jpg";
import triedro from "@/assets/triedro.jpg";
import idiomas from "@/assets/idiomas.jpg";

export type Initiative = {
  id: string;
  name: string;
  category: "Evento" | "Infraestrutura" | "Cultura" | "Esporte" | "Educação" | "Tecnologia";
  date: string;
  image: string;
  status: "andamento" | "concluido";
};

export const ongoing: Initiative[] = [
  { id: "1", name: "Semana de Engenharia 2026", category: "Evento", date: "Nov 2026", image: semana, status: "andamento" },
  { id: "2", name: "InterPoli", category: "Esporte", date: "Dez 2026", image: interpoli, status: "andamento" },
  { id: "3", name: "Reforma do Triedro", category: "Infraestrutura", date: "Mar 2027", image: triedro, status: "andamento" },
  { id: "4", name: "Curso Poliglota - Intensivo", category: "Educação", date: "Jan 2027", image: idiomas, status: "andamento" },
  { id: "5", name: "Mostra Cultural Poli", category: "Cultura", date: "Fev 2027", image: semana, status: "andamento" },
];

export const past: Initiative[] = [
  { id: "6", name: "SAPO 2025", category: "Evento", date: "Ago 2025", image: semana, status: "concluido" },
  { id: "7", name: "Hackathon Poli-USP", category: "Tecnologia", date: "Mai 2025", image: idiomas, status: "concluido" },
  { id: "8", name: "Bolsas de Idiomas Q1", category: "Educação", date: "Mar 2025", image: idiomas, status: "concluido" },
  { id: "9", name: "Festa do Biênio", category: "Cultura", date: "Out 2025", image: interpoli, status: "concluido" },
  { id: "10", name: "Revitalização do Grêmio", category: "Infraestrutura", date: "Jul 2025", image: triedro, status: "concluido" },
];

const KEY = "gpusp-user";
export type User = { name: string; email: string };
export const getUser = (): User | null => {
  try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; }
};
export const setUser = (u: User | null) =>
  u ? localStorage.setItem(KEY, JSON.stringify(u)) : localStorage.removeItem(KEY);
