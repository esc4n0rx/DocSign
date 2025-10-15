-- Script para criar usuário master (executar apenas uma vez)
-- Este script deve ser executado no SQL Editor do Supabase Dashboard

DO $$
BEGIN
  -- Verificar se já existe um usuário master
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE matricula = 'MASTER001') THEN
    INSERT INTO public.usuarios (
      matricula,
      nome,
      email,
      permissao,
      status,
      password,
      created_at,
      updated_at
    ) VALUES (
      'MASTER001',
      'Administrador Master',
      'admin@docmanager.com',
      'Admin',
      'Ativo',
      '$scrypt$10$6d91d04840bc39ee61b22f3cc0a79860$52d22fa7f3892e3610ff8d27168f436fb06156f6a4dd961964f69c3cf9f6bcf0',
      NOW(),
      NOW()
    );

    RAISE NOTICE 'Usuário master criado com sucesso!';
    RAISE NOTICE 'Matrícula: MASTER001';
    RAISE NOTICE 'Senha: admin123';
    RAISE NOTICE 'Email: admin@docmanager.com';
  ELSE
    RAISE NOTICE 'Usuário master já existe!';
  END IF;
END $$;