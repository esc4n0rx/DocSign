import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/auth'
import { createColaboradorFolder, deleteColaboradorFolder } from '@/lib/cloudinary'
import { ColaboradorFormData } from '@/types/colaborador'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"



export async function POST(request: NextRequest) {
  console.log('=== Iniciando criação de colaborador ===')
  
  try {
    const supabase = await createClient()
    
    // Verificar se o usuário atual tem permissão
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

    if (!currentUserData || !['Admin', 'Editor'].includes(currentUserData.permissao)) {
      return NextResponse.json(
        { error: 'Apenas administradores e editores podem criar colaboradores' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { nome, matricula, cargo, departamento, status, email, telefone, data_admissao }: ColaboradorFormData = body

    if (!nome || !matricula || !cargo || !departamento || !status || !email || !data_admissao) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: nome, matricula, cargo, departamento, status, email, data_admissao' },
        { status: 400 }
      )
    }

    // Verificar se matrícula já existe
    const { data: existingColaborador } = await serviceSupabase
      .from('colaboradores')
      .select('matricula')
      .eq('matricula', matricula)
      .single()

    if (existingColaborador) {
      return NextResponse.json(
        { error: 'Matrícula já cadastrada' },
        { status: 409 }
      )
    }

    // Verificar se email já existe
    const { data: existingEmail } = await serviceSupabase
      .from('colaboradores')
      .select('email')
      .eq('email', email)
      .single()

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 409 }
      )
    }

    console.log('Criando colaborador no banco de dados...')
    
    // Criar colaborador no banco
    const { data: colaborador, error: colaboradorError } = await serviceSupabase
      .from('colaboradores')
      .insert({
        nome,
        matricula,
        cargo,
        departamento,
        status,
        email,
        telefone,
        data_admissao
      })
      .select()
      .single()

    if (colaboradorError) {
      console.error('Erro ao criar colaborador:', colaboradorError)
      return NextResponse.json(
        { error: 'Erro ao criar colaborador: ' + colaboradorError.message },
        { status: 500 }
      )
    }

    console.log('Colaborador criado, criando pasta no Cloudinary...')

    // Criar pasta no Cloudinary
    const cloudinaryResult = await createColaboradorFolder(colaborador.id, matricula)

    if (cloudinaryResult.success) {
      // Atualizar colaborador com informações da pasta do Cloudinary
      await serviceSupabase
        .from('colaboradores')
        .update({ 
          cloudinary_folder: cloudinaryResult.folderName 
        })
        .eq('id', colaborador.id)
      
      colaborador.cloudinary_folder = cloudinaryResult.folderName
    }

    console.log('=== Colaborador criado com sucesso ===')

    return NextResponse.json({
      success: true,
      message: 'Colaborador criado com sucesso',
      colaborador,
      cloudinaryResult
    })

  } catch (error) {
    console.error('=== Erro na criação do colaborador ===', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor', 
        details: error instanceof Error ? error.message : 'Erro desconhecido' 
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar se o usuário está autenticado
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const serviceSupabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    let query = serviceSupabase
      .from('colaboradores')
      .select('*')
      .order('nome', { ascending: true })

    // Se há termo de busca, filtrar por nome ou matrícula
    if (search) {
      query = query.or(`nome.ilike.%${search}%,matricula.ilike.%${search}%`)
    }

    const { data: colaboradores, error } = await query

    if (error) {
      console.error('Erro ao buscar colaboradores:', error)
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar colaboradores' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      colaboradores: colaboradores || [] 
    })

  } catch (error) {
    console.error('Erro na listagem de colaboradores:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar se o usuário atual tem permissão
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

    if (!currentUserData || !['Admin', 'Editor'].includes(currentUserData.permissao)) {
      return NextResponse.json(
        { error: 'Apenas administradores e editores podem editar colaboradores' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { id, nome, matricula, cargo, departamento, status, email, telefone, data_admissao } = body

    if (!id || !nome || !matricula || !cargo || !departamento || !status || !email || !data_admissao) {
      return NextResponse.json(
        { error: 'Todos os campos obrigatórios devem ser preenchidos' },
        { status: 400 }
      )
    }

    // Verificar se colaborador existe
    const { data: existingColaborador } = await serviceSupabase
      .from('colaboradores')
      .select('*')
      .eq('id', id)
      .single()

    if (!existingColaborador) {
      return NextResponse.json(
        { error: 'Colaborador não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se matrícula já existe para outro colaborador
    const { data: existingMatricula } = await serviceSupabase
      .from('colaboradores')
      .select('id, matricula')
      .eq('matricula', matricula)
      .neq('id', id)
      .single()

    if (existingMatricula) {
      return NextResponse.json(
        { error: 'Matrícula já cadastrada para outro colaborador' },
        { status: 409 }
      )
    }

    // Verificar se email já existe para outro colaborador
    const { data: existingEmail } = await serviceSupabase
      .from('colaboradores')
      .select('id, email')
      .eq('email', email)
      .neq('id', id)
      .single()

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email já cadastrado para outro colaborador' },
        { status: 409 }
      )
    }

    // Atualizar colaborador no banco
    const { data: colaborador, error: colaboradorError } = await serviceSupabase
      .from('colaboradores')
      .update({
        nome,
        matricula,
        cargo,
        departamento,
        status,
        email,
        telefone,
        data_admissao
      })
      .eq('id', id)
      .select()
      .single()

    if (colaboradorError) {
      console.error('Erro ao atualizar colaborador:', colaboradorError)
      return NextResponse.json(
        { error: 'Erro ao atualizar colaborador' },
        { status: 500 }
      )
    }

    // Se a matrícula mudou, atualizar também a pasta no Cloudinary
    if (existingColaborador.matricula !== matricula) {
      console.log('Matrícula alterada, atualizando pasta no Cloudinary...')
      
      // Deletar pasta antiga
      if (existingColaborador.cloudinary_folder) {
        await deleteColaboradorFolder(id, existingColaborador.matricula)
      }
      
      // Criar nova pasta
      const cloudinaryResult = await createColaboradorFolder(id, matricula)
      
      if (cloudinaryResult.success) {
        await serviceSupabase
          .from('colaboradores')
          .update({ 
            cloudinary_folder: cloudinaryResult.folderName 
          })
          .eq('id', id)
        
        colaborador.cloudinary_folder = cloudinaryResult.folderName
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Colaborador atualizado com sucesso',
      colaborador
    })

  } catch (error) {
    console.error('Erro na atualização do colaborador:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}