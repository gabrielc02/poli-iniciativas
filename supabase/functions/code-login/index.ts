
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });

  if (req.method !== "POST") {
    return json({ error: "Método não permitido." }, 405);
  }

  try {
    const accessCode = Deno.env.get("ACCESS_CODE");
    const email = Deno.env.get("ACCESS_USER_EMAIL");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");

    const secretKeysRaw = Deno.env.get("SUPABASE_SECRET_KEYS");
    const secretKey = secretKeysRaw
      ? JSON.parse(secretKeysRaw).default
      : Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!accessCode || !email || !supabaseUrl || !secretKey) {
      console.error("Configuração de autenticação incompleta.");
      return json({ error: "Erro interno de configuração." }, 500);
    }

    const body = await req.json();
    const code = body?.code;

    if (typeof code !== "string" || code.length > 256) {
      return json({ error: "Código inválido." }, 400);
    }

    if (code !== accessCode) {
      return json({ error: "Código de acesso inválido." }, 401);
    }

    const admin = createClient(supabaseUrl, secretKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Gera um token de autenticação para a conta autorizada.
    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

    if (error || !data?.properties?.hashed_token) {
      console.error("Falha ao gerar token de acesso.");
      return json({ error: "Não foi possível autenticar." }, 500);
    }

    return json({
      token_hash: data.properties.hashed_token,
    });
  } catch (error) {
    console.error(
      "Falha na autenticação:",
      error instanceof Error ? error.message : "Erro desconhecido",
    );
    return json({ error: "Erro ao processar o acesso." }, 500);
  }
});
