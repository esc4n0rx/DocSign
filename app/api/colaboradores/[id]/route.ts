import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { deleteColaboradorFolder } from '@/lib/cloudinary'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

function createServiceClient() {
  const { createServerClient } = require('@supabase/ssr')
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

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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
        { error: 'Apenas administradores e editores podem remover colaboradores' },
        { status: 403 }
      )
    }

    const colaboradorId = parseInt(params.id)

    if (isNaN(colaboradorId)) {
      return NextResponse.json(
        { error: 'ID do colaborador inválido' },
        { status: 400 }
      )
    }

    // Verificar se colaborador existe e buscar dados
    const { data: colaborador } = await serviceSupabase
      .from('colaboradores')
      .select('*')
      .eq('id', colaboradorId)
      .single()

    if (!colaborador) {
      return NextResponse.json(
        { error: 'Colaborador não encontrado' },
        { status: 404 }
      )
    }

    console.log(`Removendo colaborador ${colaborador.nome} (${colaborador.matricula})...`)

    // Remover pasta do Cloudinary primeiro
    let cloudinaryResult = { success: true, error: null }
    if (colaborador.cloudinary_folder || colaborador.matricula) {
      console.log('Removendo pasta do Cloudinary...')
      cloudinaryResult = await deleteColaboradorFolder(colaboradorId, colaborador.matricula)
    }

    // Remover colaborador do banco (isso também removerá documentos por CASCADE)
    const { error: deleteError } = await serviceSupabase
      .from('colaboradores')
      .delete()
      .eq('id', colaboradorId)

    if (deleteError) {
      console.error('Erro ao remover colaborador:', deleteError)
      return NextResponse.json(
        { error: 'Erro ao remover colaborador: ' + deleteError.message },
        { status: 500 }
      )
    }

    console.log('Colaborador removido com sucesso')

    return NextResponse.json({
      success: true,
      message: 'Colaborador removido com sucesso',
      cloudinaryResult
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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    const colaboradorId = parseInt(params.id)

    if (isNaN(colaboradorId)) {
      return NextResponse.json(
        { error: 'ID do colaborador inválido' },
        { status: 400 }
      )
    }

    const serviceSupabase = createServiceClient()

    // Buscar colaborador específico
    const { data: colaborador, error } = await serviceSupabase
      .from('colaboradores')
      .select('*')
      .eq('id', colaboradorId)
      .single()

    if (error) {
      console.error('Erro ao buscar colaborador:', error)
      return NextResponse.json(
        { success: false, error: 'Colaborador não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      colaborador 
    })

  } catch (error) {
    console.error('Erro ao buscar colaborador:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}