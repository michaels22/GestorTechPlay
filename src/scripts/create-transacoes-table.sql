-- Script para criar a tabela transacoes no Supabase
-- Execute este SQL no SQL Editor do Supabase Dashboard

-- Tabela para armazenar transações financeiras customizadas
CREATE TABLE IF NOT EXISTS transacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  valor DECIMAL(10, 2) NOT NULL,
  tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  descricao TEXT NOT NULL,
  data_transacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Função para atualizar o updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar automaticamente o updated_at
DROP TRIGGER IF EXISTS update_transacoes_updated_at ON transacoes;
CREATE TRIGGER update_transacoes_updated_at 
    BEFORE UPDATE ON transacoes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
DROP POLICY IF EXISTS "Users can manage their own transactions" ON transacoes;
CREATE POLICY "Users can manage their own transactions" ON transacoes
  FOR ALL USING (auth.role() = 'authenticated');

-- Inserir alguns dados de exemplo (opcional)
-- INSERT INTO transacoes (valor, tipo, descricao) VALUES 
-- (100.00, 'entrada', 'Exemplo de entrada'),
-- (50.00, 'saida', 'Exemplo de saída');