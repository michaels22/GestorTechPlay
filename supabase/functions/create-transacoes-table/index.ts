import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // SQL para criar a tabela transacoes
    const { data, error } = await supabaseClient.rpc('exec', {
      sql: `
        -- Criar tabela transacoes se não existir
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

        -- Create policy for authenticated users
        DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON transacoes;
        CREATE POLICY "Enable all operations for authenticated users" ON transacoes
          FOR ALL USING (auth.role() = 'authenticated');

        -- Function for updating updated_at
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ language 'plpgsql';

        -- Trigger for updated_at
        DROP TRIGGER IF EXISTS update_transacoes_updated_at ON transacoes;
        CREATE TRIGGER update_transacoes_updated_at 
            BEFORE UPDATE ON transacoes 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `
    })

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Tabela transacoes criada com sucesso!' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})