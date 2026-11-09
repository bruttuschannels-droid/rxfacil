-- ============================================================
-- RxFácil — SQL para Admin panel
-- Execute este arquivo no Supabase SQL Editor
-- ============================================================

-- 1. Tabela profiles (espelho de auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  nome TEXT,
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- 2. Trigger para popular profiles automaticamente ao criar usuário
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, nome)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', NEW.email)
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 3. Preencher profiles com usuários existentes (retroativo)
INSERT INTO profiles (user_id, email, nome)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'nome_completo', email)
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- 4. RLS para profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Admin pode ver todos os profiles
CREATE POLICY "admin_ver_profiles" ON profiles
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid())
  );

-- Usuário vê só o próprio profile
CREATE POLICY "user_ver_proprio_profile" ON profiles
  FOR SELECT
  USING (user_id = auth.uid());

-- 5. Tabela admins
CREATE TABLE IF NOT EXISTS admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- RLS para admins
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Qualquer autenticado pode verificar se ele mesmo é admin
CREATE POLICY "verificar_proprio_admin" ON admins
  FOR SELECT
  USING (user_id = auth.uid());

-- 6. Dar permissão ao admin de ver e editar assinaturas de qualquer user
CREATE POLICY "admin_ver_todas_assinaturas" ON assinaturas
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid())
  );

CREATE POLICY "admin_inserir_assinatura" ON assinaturas
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid())
  );

CREATE POLICY "admin_atualizar_assinatura" ON assinaturas
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM admins WHERE admins.user_id = auth.uid())
  );

-- ============================================================
-- 7. INSIRA SEU USER_ID AQUI para se tornar admin
-- (substitua o UUID abaixo pelo seu)
-- Para encontrar: Supabase → Authentication → Users → copie seu ID
-- ============================================================
-- INSERT INTO admins (user_id) VALUES ('SEU-UUID-AQUI');
