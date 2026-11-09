-- ============================================================
-- RxFácil — Setup Supabase
-- Execute no SQL Editor do seu projeto Supabase
-- ============================================================

-- 1. TABELA DE RECEITAS
CREATE TABLE IF NOT EXISTS receitas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_paciente TEXT NOT NULL,
  data_nascimento DATE,
  cpf_cns TEXT,
  endereco_paciente TEXT,
  tipo_receita TEXT NOT NULL DEFAULT 'saude_mental',
  medicamentos JSONB NOT NULL DEFAULT '[]',
  medico TEXT,
  crm TEXT,
  especialidade TEXT,
  unidade TEXT,
  incluir_data BOOLEAN DEFAULT true,
  data_receita DATE,
  observacoes TEXT,
  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now()
);

-- 2. TABELA DE ASSINATURAS
CREATE TABLE IF NOT EXISTS assinaturas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plano TEXT NOT NULL, -- 'mensal' | 'trimestral' | 'anual'
  ativa BOOLEAN DEFAULT true,
  validade TIMESTAMPTZ NOT NULL,
  mp_payment_id TEXT, -- ID do pagamento no Mercado Pago
  mp_subscription_id TEXT, -- ID da assinatura no Mercado Pago
  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now()
);

-- 3. ÍNDICES
CREATE INDEX IF NOT EXISTS receitas_user_id_idx ON receitas(user_id);
CREATE INDEX IF NOT EXISTS receitas_nome_paciente_idx ON receitas(nome_paciente);
CREATE INDEX IF NOT EXISTS assinaturas_user_id_idx ON assinaturas(user_id);
CREATE INDEX IF NOT EXISTS assinaturas_ativa_idx ON assinaturas(ativa);

-- 4. TRIGGER para atualizar atualizado_em automaticamente
CREATE OR REPLACE FUNCTION update_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER receitas_atualizado_em
  BEFORE UPDATE ON receitas
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

CREATE OR REPLACE TRIGGER assinaturas_atualizado_em
  BEFORE UPDATE ON assinaturas
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

-- 5. ROW LEVEL SECURITY (RLS)
ALTER TABLE receitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE assinaturas ENABLE ROW LEVEL SECURITY;

-- Usuário só vê/altera suas próprias receitas
CREATE POLICY "receitas_select" ON receitas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "receitas_insert" ON receitas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "receitas_update" ON receitas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "receitas_delete" ON receitas FOR DELETE USING (auth.uid() = user_id);

-- Usuário só vê suas próprias assinaturas
CREATE POLICY "assinaturas_select" ON assinaturas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "assinaturas_insert" ON assinaturas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "assinaturas_update" ON assinaturas FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- TESTE: inserir uma assinatura ativa manualmente (opcional)
-- Substitua <SEU_USER_ID> pelo UUID do seu usuário no Auth
-- ============================================================
-- INSERT INTO assinaturas (user_id, plano, ativa, validade)
-- VALUES ('<SEU_USER_ID>', 'anual', true, now() + interval '1 year');
