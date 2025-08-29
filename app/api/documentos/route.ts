import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/auth'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

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
    const colaboradorId = searchParams.get('colaborador_id')

    let query = serviceSupabase
      .from('documentos')
      .select(`
        *,
        colaborador:colaboradores!inner(id, nome, matricula)
      `)
      .order('created_at', { ascending: false })

    // Filtrar por colaborador se especificado
    if (colaboradorId) {
      const id = parseInt(colaboradorId)
      if (!isNaN(id)) {
        query = query.eq('colaborador_id', id)
      }
    }

    const { data: documentos, error } = await query

    if (error) {
      console.error('Erro ao buscar documentos:', error)
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar documentos' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      documentos: documentos || [] 
    })

  } catch (error) {
    console.error('Erro na listagem de documentos:', error)
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
    
    // Verificar permissões
    const { data: currentUserData } = await serviceSupabase
      .from('usuarios')
      .select('permissao')
      .eq('id', currentUser.id)
      .single()

    if (!currentUserData || !['Admin', 'Editor'].includes(currentUserData.permissao)) {
      return NextResponse.json(
        { error: 'Apenas administradores e editores podem deletar documentos' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const documentoId = searchParams.get('id')

    if (!documentoId) {
      return NextResponse.json(
        { error: 'ID do documento é obrigatório' },
        { status: 400 }
      )
    }

    const id = parseInt(documentoId)
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID do documento inválido' },
        { status: 400 }
      )
    }

    // Buscar documento para obter dados do Cloudinary
    const { data: documento } = await serviceSupabase
      .from('documentos')
      .select('*')
      .eq('id', id)
      .single()

    if (!documento) {
      return NextResponse.json(
        { error: 'Documento não encontrado' },
        { status: 404 }
      )
    }

    // Remover do Cloudinary
    const { deleteFromCloudinary } = await import('@/lib/cloudinary')
    const cloudinaryResult = await deleteFromCloudinary(documento.cloudinary_public_id)

    // Remover do banco (mesmo se falhou no Cloudinary)
    const { error: dbError } = await serviceSupabase
      .from('documentos')
      .delete()
      .eq('id', id)

    if (dbError) {
      console.error('Erro ao remover documento do banco:', dbError)
      return NextResponse.json(
        { error: 'Erro ao remover documento' },
        { status: 500 }
      )
    }

    console.log(`Documento removido: ${documento.nome}`)

    return NextResponse.json({
      success: true,
      message: 'Documento removido com sucesso',
      cloudinaryResult
    })

  } catch (error) {
    console.error('Erro na remoção do documento:', error)
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
        { error: 'Apenas administradores e editores podem editar documentos' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { id, nome, tipo_documento, data_validade, status } = body

    if (!id || !nome || !tipo_documento || !status) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: id, nome, tipo_documento, status' },
        { status: 400 }
      )
    }

    const { data: updatedDocument, error } = await serviceSupabase
      .from('documentos')
      .update({
        nome,
        tipo_documento,
        data_validade,
        status
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar documento:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar documento' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Documento atualizado com sucesso',
      documento: updatedDocument
    })

  } catch (error) {
    console.error('Erro na atualização do documento:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}
