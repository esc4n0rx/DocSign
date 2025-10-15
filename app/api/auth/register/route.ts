import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createServiceClient, getAuthUser, createUser } from '@/lib/auth'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function ensureAdmin() {
  const authUser = await getAuthUser()

  if (!authUser) {
    return { response: NextResponse.json({ error: 'Não autorizado' }, { status: 401 }) }
  }

  if (authUser.usuario?.permissao !== 'Admin') {
    return { response: NextResponse.json({ error: 'Apenas administradores podem realizar esta ação' }, { status: 403 }) }
  }

  return { authUser, serviceSupabase: createServiceClient() }
}

export async function POST(request: NextRequest) {
  console.log('=== Iniciando criação de usuário ===')

  try {
    const adminContext = await ensureAdmin()

    if ('response' in adminContext) {
      return adminContext.response
    }

    const body = await request.json()
    const { nome, email, matricula, permissao, status, senha } = body

    if (!nome || !email || !matricula || !permissao || !status || !senha) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      )
    }

    console.log('Criando usuário na tabela usuarios...')

    const result = await createUser({
      nome,
      email,
      matricula,
      permissao,
      status,
      senha,
    })

    if (!result.success || !result.user) {
      return NextResponse.json(
        { error: result.error || 'Erro ao criar usuário' },
        { status: 400 }
      )
    }

    console.log('=== Usuário criado com sucesso ===')

    return NextResponse.json({
      message: 'Usuário criado com sucesso',
      usuario: result.user
    })

  } catch (error) {
    console.error('=== Erro na criação do usuário ===', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const adminContext = await ensureAdmin()

    if ('response' in adminContext) {
      return adminContext.response
    }

    // Buscar todos os usuários
    const { data: usuarios, error } = await adminContext.serviceSupabase
      .from('usuarios')
      .select('id, matricula, nome, email, permissao, status, ultimo_acesso, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar usuários:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar usuários' },
        { status: 500 }
      )
    }

    return NextResponse.json({ usuarios })

  } catch (error) {
    console.error('Erro ao listar usuários:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const adminContext = await ensureAdmin()

    if ('response' in adminContext) {
      return adminContext.response
    }

    const body = await request.json()
    const { id, nome, email, matricula, permissao, status, senha } = body

    if (!id || !nome || !email || !matricula || !permissao || !status) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se matrícula já existe para outro usuário
    const { data: existingUser } = await adminContext.serviceSupabase
      .from('usuarios')
      .select('id, matricula')
      .eq('matricula', matricula)
      .neq('id', id)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Matrícula já cadastrada para outro usuário' },
        { status: 409 }
      )
    }

    const updates: Record<string, any> = {
      matricula,
      nome,
      email,
      permissao,
      status,
    }

    if (senha && senha.trim()) {
      updates.password = await bcrypt.hash(senha, 10)
    }

    const { data: usuario, error: usuarioError } = await adminContext.serviceSupabase
      .from('usuarios')
      .update(updates)
      .eq('id', id)
      .select('id, matricula, nome, email, permissao, status, ultimo_acesso, created_at, updated_at')
      .single()

    if (usuarioError) {
      console.error('Erro ao atualizar usuário:', usuarioError)
      return NextResponse.json(
        { error: 'Erro ao atualizar usuário' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Usuário atualizado com sucesso',
      usuario
    })

  } catch (error) {
    console.error('Erro na atualização do usuário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const adminContext = await ensureAdmin()

    if ('response' in adminContext) {
      return adminContext.response
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')

    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      )
    }

    // Não permitir que admin delete a si mesmo
    if (userId === adminContext.authUser.id) {
      return NextResponse.json(
        { error: 'Não é possível remover seu próprio usuário' },
        { status: 403 }
      )
    }

    // Verificar se usuário existe
    const { data: userToDelete } = await adminContext.serviceSupabase
      .from('usuarios')
      .select('matricula')
      .eq('id', userId)
      .single()

    if (!userToDelete) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Não permitir deletar o usuário master
    if (userToDelete.matricula === 'MASTER001') {
      return NextResponse.json(
        { error: 'Não é possível remover o usuário master' },
        { status: 403 }
      )
    }

    const { error: deleteError } = await adminContext.serviceSupabase
      .from('usuarios')
      .delete()
      .eq('id', userId)

    if (deleteError) {
      console.error('Erro ao remover usuário:', deleteError)
      return NextResponse.json(
        { error: 'Erro ao remover usuário' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Usuário removido com sucesso'
    })

  } catch (error) {
    console.error('Erro na remoção do usuário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}