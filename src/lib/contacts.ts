/** Contact CRM schema backed by data/contatosEmpresas.csv */

export const CONTACT_STATUSES = [
  "Novo",
  "Disparo Agendado",
  "Abordado",
  "Interessado",
  "Reunião Agendada",
  "Sem Interesse",
  "Inativo",
] as const;

export type ContactStatus = (typeof CONTACT_STATUSES)[number];

export type Contact = {
  id: string;
  empresa: string;
  nome: string;
  email: string;
  numero: string;
  linkedin: string;
  responsavel: string;
  status: ContactStatus;
  observacoes: string;
  ramo: string;
};

const CSV_HEADERS = [
  "Empresa",
  "Nome",
  "Email",
  "Número",
  "Linkedin",
  "Responsável",
  "Status",
  "Observações",
  "Ramo",
] as const;

const CSV_URL = "/data/contatosEmpresas.csv";

export const STATUS_BADGE_CLASS: Record<ContactStatus, string> = {
  Novo: "border-transparent bg-muted text-muted-foreground",
  "Disparo Agendado": "border-transparent bg-sky-100 text-sky-800",
  Abordado: "border-transparent bg-amber-100 text-amber-900",
  Interessado: "border-transparent bg-emerald-100 text-emerald-800",
  "Reunião Agendada": "border-transparent bg-violet-100 text-violet-800",
  "Sem Interesse": "border-transparent bg-red-100 text-red-800",
  Inativo: "border-transparent bg-slate-200 text-slate-600",
};

function isContactStatus(value: string): value is ContactStatus {
  return (CONTACT_STATUSES as readonly string[]).includes(value);
}

/** Minimal RFC4180-ish CSV parser (quoted fields, commas, newlines). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let i = 0;
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    // Skip trailing empty line
    if (row.length === 1 && row[0] === "" && rows.length > 0) {
      row = [];
      return;
    }
    rows.push(row);
    row = [];
  };

  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += ch;
      i += 1;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (ch === ",") {
      pushField();
      i += 1;
      continue;
    }
    if (ch === "\n" || ch === "\r") {
      pushField();
      pushRow();
      if (ch === "\r" && text[i + 1] === "\n") i += 1;
      i += 1;
      continue;
    }
    field += ch;
    i += 1;
  }
  if (field.length > 0 || row.length > 0) {
    pushField();
    pushRow();
  }
  return rows;
}

function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function parseContactsCsv(text: string): Contact[] {
  const rows = parseCsv(text.trim());
  const headerRow = rows[0];
  if (!headerRow || rows.length < 2) return [];

  const header = headerRow.map((h) => h.trim());
  const index = (name: string) => header.indexOf(name);

  const col = {
    empresa: index("Empresa"),
    nome: index("Nome"),
    email: index("Email"),
    numero: index("Número"),
    linkedin: index("Linkedin"),
    responsavel: index("Responsável"),
    status: index("Status"),
    observacoes: index("Observações"),
    ramo: index("Ramo"),
  };

  return rows.slice(1).map((cells, i) => {
    const rawStatus = (cells[col.status] ?? "Novo").trim();
    const status: ContactStatus = isContactStatus(rawStatus) ? rawStatus : "Novo";
    return {
      id: `contact-${i + 1}`,
      empresa: (cells[col.empresa] ?? "").trim(),
      nome: (cells[col.nome] ?? "").trim(),
      email: (cells[col.email] ?? "").trim(),
      numero: (cells[col.numero] ?? "").trim(),
      linkedin: (cells[col.linkedin] ?? "").trim(),
      responsavel: (cells[col.responsavel] ?? "").trim(),
      status,
      observacoes: (cells[col.observacoes] ?? "").trim(),
      ramo: (cells[col.ramo] ?? "").trim(),
    };
  });
}

export function contactsToCsv(contacts: Contact[]): string {
  const lines = [
    CSV_HEADERS.join(","),
    ...contacts.map((c) =>
      [
        c.empresa,
        c.nome,
        c.email,
        c.numero,
        c.linkedin,
        c.responsavel,
        c.status,
        c.observacoes,
        c.ramo,
      ]
        .map(escapeCsvField)
        .join(","),
    ),
  ];
  return lines.join("\n") + "\n";
}

/** Loads contacts from the served CSV at /data/contatosEmpresas.csv (mirrors data/). */
export async function loadContactsFromCsv(): Promise<Contact[]> {
  const res = await fetch(CSV_URL, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Não foi possível carregar ${CSV_URL} (${res.status})`);
  }
  const text = await res.text();
  return parseContactsCsv(text);
}

export function filterContacts(contacts: Contact[], query: string): Contact[] {
  const q = query.trim().toLowerCase();
  if (!q) return contacts;
  return contacts.filter(
    (c) =>
      c.empresa.toLowerCase().includes(q) ||
      c.nome.toLowerCase().includes(q) ||
      c.status.toLowerCase().includes(q),
  );
}

export function normalizeLinkedinUrl(url: string): string {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}
