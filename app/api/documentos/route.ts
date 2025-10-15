import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, getAuthUser } from '@/lib/auth'
import { deleteFile } from '@/lib/storage-api'

// GET - Listar documentos de um colaborador
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser()

    if (!authUser) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const colaboradorId = searchParams.get('colaboradorId')

    if (!colaboradorId) {
      return NextResponse.json(
        { error: 'ID do colaborador é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar documentos do colaborador
    const serviceSupabase = createServiceClient()
    const { data: documentos, error } = await serviceSupabase
      .from('documentos')
      .select(`
        *,
        colaborador:colaboradores (
          id,
          nome,
          matricula,
          email
        )
      `)
      .eq('colaborador_id', parseInt(colaboradorId))
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar documentos:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar documentos' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      documentos
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

// DELETE - Remover um documento
export async function DELETE(request: NextRequest) {
  try {
    const authUser = await getAuthUser()

    if (!authUser) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    if (!authUser.usuario || !['Admin', 'Editor'].includes(authUser.usuario.permissao)) {
      return NextResponse.json(
        { error: 'Apenas administradores e editores podem remover documentos' },
        { status: 403 }
      )
    }

    const serviceSupabase = createServiceClient()
    const { searchParams } = new URL(request.url)
    const documentoId = searchParams.get('id')

    if (!documentoId) {
      return NextResponse.json(
        { error: 'ID do documento é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar documento para obter informações do storage
    const { data: documento, error } = await serviceSupabase
      .from('documentos')
      .select('*')
      .eq('id', parseInt(documentoId))
      .single()

    if (error || !documento) {
      return NextResponse.json(
        { error: 'Documento não encontrado' },
        { status: 404 }
      )
    }

    console.log(`Removendo documento: ${documento.nome}`)

    // Remover arquivo da API de storage (se existir)
    if (documento.storage_folder && documento.storage_filename) {
      console.log(`Removendo arquivo: ${documento.storage_filename} da pasta: ${documento.storage_folder}`)
      const deleteResult = await deleteFile(documento.storage_folder, documento.storage_filename)
      
      if (!deleteResult.success) {
        console.warn(`Aviso: falha ao remover arquivo da storage: ${deleteResult.error}`)
      }
    }

    // Remover registro do banco de dados
    const { error: dbError } = await serviceSupabase
      .from('documentos')
      .delete()
      .eq('id', parseInt(documentoId))

    if (dbError) {
      console.error('Erro ao remover documento do banco:', dbError)
      return NextResponse.json(
        { error: 'Erro ao remover documento do banco de dados' },
        { status: 500 }
      )
    }

    console.log(`Documento removido com sucesso: ${documento.nome}`)

    return NextResponse.json({
      success: true,
      message: 'Documento removido com sucesso'
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