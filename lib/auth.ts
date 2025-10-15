import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { randomUUID } from 'crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { Usuario, AuthUser } from '@/types/auth'

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key'
const AUTH_COOKIE_NAME = 'auth-token'

// Cliente com service role para operações administrativas
export function createServiceClient() {
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

function sanitizeUsuario(usuario: any): Usuario {
  const { password, ...usuarioSemSenha } = usuario
  return usuarioSemSenha as Usuario
}

export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value

    if (!token) {
      return null
    }

    const payload = verifyJWT(token)

    if (!payload) {
      return null
    }

    const serviceSupabase = createServiceClient()
    const { data: usuarioData, error: usuarioError } = await serviceSupabase
      .from('usuarios')
      .select('id, matricula, nome, email, permissao, status, ultimo_acesso, created_at, updated_at, password')
      .eq('id', payload.sub)
      .single()

    if (usuarioError || !usuarioData || usuarioData.status !== 'Ativo') {
      console.log('Erro ao buscar dados do usuário:', usuarioError)
      return null
    }

    const usuario = sanitizeUsuario(usuarioData)

    return {
      id: usuario.id,
      email: usuario.email,
      usuario,
    }
  } catch (error) {
    console.error('Erro ao buscar usuário:', error)
    return null
  }
}

export async function authenticateByMatricula(matricula: string, senha: string): Promise<AuthUser | null> {
  console.log('Tentando autenticar usuário:', matricula)

  try {
    const serviceSupabase = createServiceClient()

    console.log('Buscando usuário por matrícula...')
    const { data: usuario, error: usuarioError } = await serviceSupabase
      .from('usuarios')
      .select('id, matricula, nome, email, permissao, status, ultimo_acesso, created_at, updated_at, password')
      .eq('matricula', matricula)
      .eq('status', 'Ativo')
      .single()

    console.log('Resultado da busca por matrícula:', { usuario: !!usuario, error: usuarioError })

    if (usuarioError || !usuario) {
      console.log('Usuário não encontrado ou inativo:', usuarioError)
      return null
    }

    if (!usuario.password) {
      console.log('Usuário sem senha cadastrada:', usuario.matricula)
      return null
    }

    const senhaValida = await bcrypt.compare(senha, usuario.password)

    if (!senhaValida) {
      console.log('Senha inválida para usuário:', usuario.matricula)
      return null
    }

    await serviceSupabase
      .from('usuarios')
      .update({ ultimo_acesso: new Date().toISOString() })
      .eq('id', usuario.id)

    console.log('Login bem-sucedido para usuário:', usuario.matricula)

    const usuarioSanitizado = sanitizeUsuario(usuario)

    return {
      id: usuarioSanitizado.id,
      email: usuarioSanitizado.email,
      usuario: usuarioSanitizado
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
}): Promise<{ success: boolean; user?: Usuario; error?: string }> {
  try {
    const serviceSupabase = createServiceClient()

    const { data: existingUser } = await serviceSupabase
      .from('usuarios')
      .select('matricula')
      .eq('matricula', userData.matricula)
      .single()

    if (existingUser) {
      return { success: false, error: 'Matrícula já cadastrada' }
    }

    const { data: existingEmail } = await serviceSupabase
      .from('usuarios')
      .select('email')
      .eq('email', userData.email)
      .single()

    if (existingEmail) {
      return { success: false, error: 'Email já cadastrado' }
    }

    const hashedPassword = await bcrypt.hash(userData.senha, 10)
    const userId = randomUUID()

    const { data: usuario, error: usuarioError } = await serviceSupabase
      .from('usuarios')
      .insert({
        id: userId,
        matricula: userData.matricula,
        nome: userData.nome,
        email: userData.email,
        permissao: userData.permissao,
        status: userData.status,
        password: hashedPassword,
      })
      .select('id, matricula, nome, email, permissao, status, ultimo_acesso, created_at, updated_at')
      .single()

    if (usuarioError || !usuario) {
      return { success: false, error: 'Erro ao salvar dados do usuário' }
    }

    return { success: true, user: usuario as Usuario }

  } catch (error) {
    console.error('Erro ao criar usuário:', error)
    return { success: false, error: 'Erro interno do servidor' }
  }
}