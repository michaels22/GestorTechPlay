import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Conectar usando as variáveis de ambiente do Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Fazer request direto para a API SQL do Supabase
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'apikey': serviceKey
      },
      body: JSON.stringify({
        sql: `
          -- Criar tabela transacoes
          CREATE TABLE IF NOT EXISTS transacoes (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            valor DECIMAL(10, 2) NOT NULL,
            tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('entrada', 'saida')),
            descricao TEXT NOT NULL,
            data_transacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          -- Enable RLS
          ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;

          -- Create policy
          DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON transacoes;
          CREATE POLICY "Enable all operations for authenticated users" ON transacoes
            FOR ALL USING (true);
        `
      })
    })

    const result = await response.text()
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Tabela transacoes configurada com sucesso!',
        result 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Erro:', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})