-- ============================================================
-- RxFácil — Setup Supabase (versão corrigida)
-- Cole tudo isso no SQL Editor e clique em Run
-- ============================================================

-- 1. FUNÇÃO de atualização (precisa vir PRIMEIRO)
CREATE OR REPLACE FUNCTION update_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. TABELA DE RECEITAS
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

CREATE OR REPLACE TRIGGER receitas_atualizado_em
  BEFORE UPDATE ON receitas
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

ALTER TABLE receitas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "receitas_select" ON receitas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "receitas_insert" ON receitas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "receitas_update" ON receitas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "receitas_delete" ON receitas FOR DELETE USING (auth.uid() = user_id);

-- 3. TABELA DE CONFIGURAÇÕES
CREATE TABLE IF NOT EXISTS configuracoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  medico TEXT,
  crm TEXT,
  especialidade TEXT,
  unidade TEXT,
  endereco_unidade TEXT,
  cnes TEXT,
  telefone_unidade TEXT,
  cidade TEXT,
  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE TRIGGER configuracoes_atualizado_em
  BEFORE UPDATE ON configuracoes
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "config_select" ON configuracoes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "config_insert" ON configuracoes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "config_update" ON configuracoes FOR UPDATE USING (auth.uid() = user_id);

-- 4. TABELA DE ASSINATURAS
CREATE TABLE IF NOT EXISTS assinaturas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plano TEXT NOT NULL,
  ativa BOOLEAN DEFAULT true,
  validade TIMESTAMPTZ NOT NULL,
  mp_payment_id TEXT,
  mp_subscription_id TEXT,
  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE TRIGGER assinaturas_atualizado_em
  BEFORE UPDATE ON assinaturas
  FOR EACH ROW EXECUTE FUNCTION update_atualizado_em();

ALTER TABLE assinaturas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "assinaturas_select" ON assinaturas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "assinaturas_insert" ON assinaturas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "assinaturas_update" ON assinaturas FOR UPDATE USING (auth.uid() = user_id);

-- 5. ÍNDICES
CREATE INDEX IF NOT EXISTS receitas_user_id_idx ON receitas(user_id);
CREATE INDEX IF NOT EXISTS assinaturas_user_id_idx ON assinaturas(user_id);
