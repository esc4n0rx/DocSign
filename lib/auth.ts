import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { Usuario, AuthUser } from '@/types/auth'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key'

// Cliente com service role para operações administrativas
function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return [] },
        setAll() {},
      },
    }
  )
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const supabase = await createClient()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      console.log('Erro ao buscar usuário do auth:', error)
      return null
    }

    // Usar service client para buscar dados do usuário (bypassa RLS)
    const serviceSupabase = createServiceClient()
    const { data: usuarioData, error: usuarioError } = await serviceSupabase
      .from('usuarios')
      .select('*')
      .eq('id', user.id)
      .single()

    if (usuarioError) {
      console.log('Erro ao buscar dados do usuário:', usuarioError)
      return null
    }

    return {
      id: user.id,
      email: user.email!,
      usuario: usuarioData
    }
  } catch (error) {
    console.error('Erro ao buscar usuário:', error)
    return null
  }
}

export async function authenticateByMatricula(matricula: string, senha: string): Promise<AuthUser | null> {
  console.log('Tentando autenticar usuário:', matricula)
  
  try {
    // Usar service client para busca inicial (bypassa RLS)
    const serviceSupabase = createServiceClient()
    
    console.log('Buscando usuário por matrícula...')
    const { data: usuario, error: usuarioError } = await serviceSupabase
      .from('usuarios')
      .select('*')
      .eq('matricula', matricula)
      .eq('status', 'Ativo')
      .single()

    console.log('Resultado da busca por matrícula:', { usuario: !!usuario, error: usuarioError })

    if (usuarioError || !usuario) {
      console.log('Usuário não encontrado ou inativo:', usuarioError)
      return null
    }

    // Usar client normal para autenticação
    const supabase = await createClient()
    
    console.log('Tentando fazer login com email:', usuario.email)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: usuario.email,
      password: senha,
    })

    console.log('Resultado do login:', { 
      user: !!authData.user, 
      session: !!authData.session, 
      error: authError 
    })

    if (authError || !authData.user) {
      console.log('Erro na autenticação:', authError)
      return null
    }

    // Atualizar último acesso usando service client
    await serviceSupabase
      .from('usuarios')
      .update({ ultimo_acesso: new Date().toISOString() })
      .eq('id', authData.user.id)

    console.log('Login bem-sucedido para usuário:', usuario.matricula)

    return {
      id: authData.user.id,
      email: authData.user.email!,
      usuario
    }
  } catch (error) {
    console.error('Erro na autenticação:', error)
    return null
  }
}

export function generateJWT(user: AuthUser): string {
  const payload = {
    sub: user.id,
    email: user.email,
    matricula: user.usuario?.matricula,
    permissao: user.usuario?.permissao,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 horas
  }

  return jwt.sign(payload, JWT_SECRET)
}

export function verifyJWT(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

// Função adicional para criar usuários (nova)
export async function createUser(userData: {
  nome: string
  email: string
  matricula: string
  permissao: 'Admin' | 'Editor' | 'Visualizador'
  status: 'Ativo' | 'Inativo'
  senha: string
}): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    const serviceSupabase = createServiceClient()
    
    // Verificar se matrícula já existe
    const { data: existingUser } = await serviceSupabase
      .from('usuarios')
      .select('matricula')
      .eq('matricula', userData.matricula)
      .single()

    if (existingUser) {
      return { success: false, error: 'Matrícula já cadastrada' }
    }

    // Criar usuário no Supabase Auth
    const { data: authUser, error: authError } = await serviceSupabase.auth.admin.createUser({
      email: userData.email,
      password: userData.senha,
      email_confirm: true,
      user_metadata: { 
        matricula: userData.matricula, 
        nome: userData.nome 
      }
    })

    if (authError || !authUser.user) {
      return { success: false, error: authError?.message || 'Erro ao criar usuário no auth' }
    }

    // Criar registro na tabela usuarios
    const { data: usuario, error: usuarioError } = await serviceSupabase
      .from('usuarios')
      .insert({
        id: authUser.user.id,
        matricula: userData.matricula,
        nome: userData.nome,
        email: userData.email,
        permissao: userData.permissao,
        status: userData.status
      })
      .select()
      .single()

    if (usuarioError) {
      // Se falhou, limpar o usuário do auth
      await serviceSupabase.auth.admin.deleteUser(authUser.user.id)
      return { success: false, error: 'Erro ao salvar dados do usuário' }
    }

    return { success: true, user: usuario }
    
  } catch (error) {
    console.error('Erro ao criar usuário:', error)
    return { success: false, error: 'Erro interno do servidor' }
  }
}