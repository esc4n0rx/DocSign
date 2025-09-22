import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/auth'
import { createColaboradorFolder, deleteColaboradorFolder } from '@/lib/storage-api'
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
        { error: 'Todos os campos obrigatórios devem ser preenchidos' },
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

    if (colaboradorError || !colaborador) {
      console.error('Erro ao criar colaborador:', colaboradorError)
      return NextResponse.json(
        { error: 'Erro ao criar colaborador' },
        { status: 500 }
      )
    }

    console.log(`Colaborador criado: ${colaborador.nome} (ID: ${colaborador.id})`)

    // Criar pasta na API de storage
    console.log('Criando pasta na API de storage...')
    const storageResult = await createColaboradorFolder(colaborador.id, matricula)
    
    if (storageResult.success) {
      // Atualizar colaborador com informações da pasta de storage
      await serviceSupabase
        .from('colaboradores')
        .update({ 
          storage_folder: storageResult.folderName 
        })
        .eq('id', colaborador.id)
      
      colaborador.storage_folder = storageResult.folderName
    }

    return NextResponse.json({
      success: true,
      message: 'Colaborador criado com sucesso',
      colaborador,
      storageResult
    })

  } catch (error) {
    console.error('Erro na criação do colaborador:', error)
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
    
    // Verificar autenticação
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const serviceSupabase = createServiceClient()
    
    // Verificar permissões
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
    const { id, nome, matricula, cargo, departamento, status, email, telefone, data_admissao }: ColaboradorFormData & { id: number } = body

    if (!id || !nome || !matricula || !cargo || !departamento || !status || !email || !data_admissao) {
      return NextResponse.json(
        { error: 'Todos os campos obrigatórios devem ser preenchidos' },
        { status: 400 }
      )
    }

    // Buscar colaborador existente
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

    // Verificar se matrícula já existe (exceto para o próprio colaborador)
    const { data: matriculaExists } = await serviceSupabase
      .from('colaboradores')
      .select('id, matricula')
      .eq('matricula', matricula)
      .neq('id', id)
      .single()

    if (matriculaExists) {
      return NextResponse.json(
        { error: 'Matrícula já utilizada por outro colaborador' },
        { status: 409 }
      )
    }

    // Atualizar colaborador
    const { data: colaborador, error: updateError } = await serviceSupabase
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

    if (updateError) {
      console.error('Erro ao atualizar colaborador:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar colaborador' },
        { status: 500 }
      )
    }

    // Se a matrícula mudou, atualizar também a pasta na API de storage
    if (existingColaborador.matricula !== matricula) {
      console.log('Matrícula alterada, atualizando pasta na API de storage...')
      
      // Deletar pasta antiga (se existir)
      if (existingColaborador.storage_folder) {
        await deleteColaboradorFolder(id, existingColaborador.matricula)
      }
      
      // Criar nova pasta
      const storageResult = await createColaboradorFolder(id, matricula)
      
      if (storageResult.success) {
        await serviceSupabase
          .from('colaboradores')
          .update({ 
            storage_folder: storageResult.folderName 
          })
          .eq('id', id)
        
        colaborador.storage_folder = storageResult.folderName
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

const escapeIlikePattern = (value: string) =>
  value.replace(/[\\%_,]/g, (match) => `\\${match}`)

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar autenticação
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const serviceSupabase = createServiceClient()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.trim()

    let query = serviceSupabase
      .from('colaboradores')
      .select('*')

    if (search) {
      const likePattern = `%${escapeIlikePattern(search)}%`
      query = query.or(
        `matricula.ilike.${likePattern},nome.ilike.${likePattern}`
      )
    }

    const { data: colaboradores, error } = await query.order('nome')

    if (error) {
      console.error('Erro ao buscar colaboradores:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar colaboradores' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      colaboradores
    })

  } catch (error) {
    console.error('Erro na busca de colaboradores:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const serviceSupabase = createServiceClient()
    
    // Verificar permissões (apenas Admin pode deletar)
    const { data: currentUserData } = await serviceSupabase
      .from('usuarios')
      .select('permissao')
      .eq('id', currentUser.id)
      .single()

    if (!currentUserData || currentUserData.permissao !== 'Admin') {
      return NextResponse.json(
        { error: 'Apenas administradores podem excluir colaboradores' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id') || '')

    if (!id) {
      return NextResponse.json(
        { error: 'ID do colaborador é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar colaborador
    const { data: colaborador } = await serviceSupabase
      .from('colaboradores')
      .select('*')
      .eq('id', id)
      .single()

    if (!colaborador) {
      return NextResponse.json(
        { error: 'Colaborador não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se há documentos associados
    const { data: documentos } = await serviceSupabase
      .from('documentos')
      .select('id')
      .eq('colaborador_id', id)

    if (documentos && documentos.length > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir colaborador com documentos associados. Remova os documentos primeiro.' },
        { status: 409 }
      )
    }

    // Remover pasta da API de storage (se existir)
    if (colaborador.storage_folder || colaborador.matricula) {
      console.log('Removendo pasta da API de storage...')
      await deleteColaboradorFolder(id, colaborador.matricula)
    }

    // Deletar colaborador
    const { error: deleteError } = await serviceSupabase
      .from('colaboradores')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Erro ao deletar colaborador:', deleteError)
      return NextResponse.json(
        { error: 'Erro ao deletar colaborador' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Colaborador removido com sucesso'
    })

  } catch (error) {
    console.error('Erro na remoção do colaborador:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}