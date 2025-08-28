import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServerClient } from '@supabase/ssr'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

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

export async function POST(request: NextRequest) {
  console.log('=== Iniciando criação de usuário ===')
  
  try {
    const supabase = await createClient()
    
    // Verificar se o usuário atual é admin
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const serviceSupabase = createServiceClient()
    const { data: currentUserData } = await serviceSupabase
      .from('usuarios')
      .select('permissao')
      .eq('id', currentUser.id)
      .single()

    if (!currentUserData || currentUserData.permissao !== 'Admin') {
      return NextResponse.json(
        { error: 'Apenas administradores podem criar usuários' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { nome, email, matricula, permissao, status, senha } = body

    if (!nome || !email || !matricula || !permissao || !status || !senha) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se matrícula já existe
    const { data: existingUser } = await serviceSupabase
      .from('usuarios')
      .select('matricula')
      .eq('matricula', matricula)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Matrícula já cadastrada' },
        { status: 409 }
      )
    }

    console.log('Criando usuário no Supabase Auth...')
    
    // Criar usuário no Supabase Auth usando service client
    const { data: authUser, error: authError } = await serviceSupabase.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: { matricula, nome }
    })

    if (authError || !authUser.user) {
      console.error('Erro ao criar usuário no auth:', authError)
      return NextResponse.json(
        { error: 'Erro ao criar usuário: ' + (authError?.message || 'Erro desconhecido') },
        { status: 500 }
      )
    }

    console.log('Usuário criado no auth, criando registro na tabela usuarios...')

    // Criar registro na tabela usuarios
    const { data: usuario, error: usuarioError } = await serviceSupabase
      .from('usuarios')
      .insert({
        id: authUser.user.id,
        matricula,
        nome,
        email,
        permissao,
        status
      })
      .select()
      .single()

    if (usuarioError) {
      console.error('Erro ao criar registro na tabela usuarios:', usuarioError)
      
      // Se falhou, limpar o usuário do auth
      await serviceSupabase.auth.admin.deleteUser(authUser.user.id)
      
      return NextResponse.json(
        { error: 'Erro ao salvar dados do usuário' },
        { status: 500 }
      )
    }

    console.log('=== Usuário criado com sucesso ===')

    return NextResponse.json({
      message: 'Usuário criado com sucesso',
      usuario
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
    const supabase = await createClient()
    
    // Verificar se o usuário atual é admin
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const serviceSupabase = createServiceClient()
    const { data: currentUserData } = await serviceSupabase
      .from('usuarios')
      .select('permissao')
      .eq('id', currentUser.id)
      .single()

    if (!currentUserData || currentUserData.permissao !== 'Admin') {
      return NextResponse.json(
        { error: 'Apenas administradores podem listar usuários' },
        { status: 403 }
      )
    }

    // Buscar todos os usuários
    const { data: usuarios, error } = await serviceSupabase
      .from('usuarios')
      .select('*')
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
    const supabase = await createClient()
    
    // Verificar se o usuário atual é admin
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const serviceSupabase = createServiceClient()
    const { data: currentUserData } = await serviceSupabase
      .from('usuarios')
      .select('permissao')
      .eq('id', currentUser.id)
      .single()

    if (!currentUserData || currentUserData.permissao !== 'Admin') {
      return NextResponse.json(
        { error: 'Apenas administradores podem editar usuários' },
        { status: 403 }
      )
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
    const { data: existingUser } = await serviceSupabase
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

    // Atualizar senha se fornecida
    if (senha && senha.trim()) {
      const { error: passwordError } = await serviceSupabase.auth.admin.updateUserById(
        id,
        { password: senha }
      )

      if (passwordError) {
        console.error('Erro ao atualizar senha:', passwordError)
        return NextResponse.json(
          { error: 'Erro ao atualizar senha' },
          { status: 500 }
        )
      }
    }

    // Atualizar email no auth se mudou
    const { data: currentData } = await serviceSupabase
      .from('usuarios')
      .select('email')
      .eq('id', id)
      .single()

    if (currentData && currentData.email !== email) {
      const { error: emailError } = await serviceSupabase.auth.admin.updateUserById(
        id,
        { email }
      )

      if (emailError) {
        console.error('Erro ao atualizar email:', emailError)
        return NextResponse.json(
          { error: 'Erro ao atualizar email' },
          { status: 500 }
        )
      }
    }

    // Atualizar dados na tabela usuarios
    const { data: usuario, error: usuarioError } = await serviceSupabase
      .from('usuarios')
      .update({
        matricula,
        nome,
        email,
        permissao,
        status
      })
      .eq('id', id)
      .select()
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
    const supabase = await createClient()
    
    // Verificar se o usuário atual é admin
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const serviceSupabase = createServiceClient()
    const { data: currentUserData } = await serviceSupabase
      .from('usuarios')
      .select('permissao')
      .eq('id', currentUser.id)
      .single()

    if (!currentUserData || currentUserData.permissao !== 'Admin') {
      return NextResponse.json(
        { error: 'Apenas administradores podem remover usuários' },
        { status: 403 }
      )
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
    if (userId === currentUser.id) {
      return NextResponse.json(
        { error: 'Não é possível remover seu próprio usuário' },
        { status: 403 }
      )
    }

    // Verificar se usuário existe
    const { data: userToDelete } = await serviceSupabase
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

    // Remover usuário do auth (isso automaticamente remove da tabela usuarios por CASCADE)
    const { error: deleteError } = await serviceSupabase.auth.admin.deleteUser(userId)

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