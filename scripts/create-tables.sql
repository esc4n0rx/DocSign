-- Tabela de usuários (complementar à auth.users do Supabase)
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matricula VARCHAR(50) UNIQUE NOT NULL,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  permissao VARCHAR(50) NOT NULL DEFAULT 'Visualizador' CHECK (permissao IN ('Admin', 'Editor', 'Visualizador')),
  status VARCHAR(20) NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo')),
  password TEXT NOT NULL,
  ultimo_acesso TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Tabela de colaboradores (mantendo estrutura existente)
CREATE TABLE IF NOT EXISTS public.colaboradores (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  matricula VARCHAR(50) UNIQUE NOT NULL,
  cargo VARCHAR(255) NOT NULL,
  departamento VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo', 'Férias', 'Licença Médica')),
  email VARCHAR(255) UNIQUE NOT NULL,
  telefone VARCHAR(20),
  data_admissao DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Tabela de documentos
CREATE TABLE IF NOT EXISTS public.documentos (
  id SERIAL PRIMARY KEY,
  colaborador_id INTEGER REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(10) NOT NULL,
  tamanho VARCHAR(20),
  categoria VARCHAR(100),
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- RLS (Row Level Security)
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para usuarios (só pode ver/editar próprios dados, exceto admins)
CREATE POLICY "Usuários podem ver próprios dados" ON public.usuarios
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins podem ver todos os usuários" ON public.usuarios
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE id = auth.uid() AND permissao = 'Admin'
    )
  );

-- Políticas para colaboradores (baseada em permissões)
CREATE POLICY "Usuários podem ver colaboradores" ON public.colaboradores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE id = auth.uid() AND status = 'Ativo'
    )
  );

CREATE POLICY "Editores e Admins podem modificar colaboradores" ON public.colaboradores
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE id = auth.uid() 
      AND permissao IN ('Admin', 'Editor') 
      AND status = 'Ativo'
    )
  );

-- Políticas para documentos
CREATE POLICY "Usuários podem ver documentos" ON public.documentos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE id = auth.uid() AND status = 'Ativo'
    )
  );

CREATE POLICY "Editores e Admins podem modificar documentos" ON public.documentos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.usuarios 
      WHERE id = auth.uid() 
      AND permissao IN ('Admin', 'Editor') 
      AND status = 'Ativo'
    )
  );

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON public.usuarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_colaboradores_updated_at BEFORE UPDATE ON public.colaboradores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documentos_updated_at BEFORE UPDATE ON public.documentos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_usuarios_matricula ON public.usuarios(matricula);
CREATE INDEX IF NOT EXISTS idx_colaboradores_matricula ON public.colaboradores(matricula);
CREATE INDEX IF NOT EXISTS idx_documentos_colaborador_id ON public.documentos(colaborador_id);