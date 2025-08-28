-- Script para criar usuário master (executar apenas uma vez)
-- Este script deve ser executado no SQL Editor do Supabase Dashboard

DO $$
BEGIN
  -- Verificar se já existe um usuário master
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE matricula = 'MASTER001') THEN
    -- Criar usuário de autenticação no auth.users
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      invited_at,
      confirmation_token,
      confirmation_sent_at,
      recovery_token,
      recovery_sent_at,
      email_change_token_new,
      email_change,
      email_change_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      created_at,
      updated_at,
      phone,
      phone_confirmed_at,
      phone_change,
      phone_change_token,
      phone_change_sent_at,
      email_change_token_current,
      email_change_confirm_status,
      banned_until,
      reauthentication_token,
      reauthentication_sent_at,
      is_sso_user,
      deleted_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@docmanager.com',
      crypt('admin123', gen_salt('bf')),
      NOW(),
      NULL,
      '',
      NULL,
      '',
      NULL,
      '',
      '',
      NULL,
      NULL,
      '{"provider": "email", "providers": ["email"]}',
      '{"matricula": "MASTER001"}',
      FALSE,
      NOW(),
      NOW(),
      NULL,
      NULL,
      '',
      '',
      NULL,
      '',
      0,
      NULL,
      '',
      NULL,
      FALSE,
      NULL
    );

    -- Inserir na tabela usuarios
    INSERT INTO public.usuarios (
      id,
      matricula,
      nome,
      email,
      permissao,
      status,
      created_at,
      updated_at
    ) VALUES (
      (SELECT id FROM auth.users WHERE email = 'admin@docmanager.com'),
      'MASTER001',
      'Administrador Master',
      'admin@docmanager.com',
      'Admin',
      'Ativo',
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