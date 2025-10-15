import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, getAuthUser } from '@/lib/auth'
import { uploadFileBuffer } from '@/lib/storage-api'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

export async function POST(request: NextRequest) {
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
        { error: 'Apenas administradores e editores podem fazer upload de documentos' },
        { status: 403 }
      )
    }

    const serviceSupabase = createServiceClient()

    // Parse do FormData
    const formData = await request.formData()
    const file = formData.get('file') as File
    const colaboradorId = parseInt(formData.get('colaborador_id') as string)
    const categoria = formData.get('categoria') as string || 'Outros'

    if (!file || !colaboradorId) {
      return NextResponse.json(
        { error: 'Arquivo e ID do colaborador são obrigatórios' },
        { status: 400 }
      )
    }

    // Validar colaborador
    const { data: colaborador } = await serviceSupabase
      .from('colaboradores')
      .select('id, matricula, nome')
      .eq('id', colaboradorId)
      .single()

    if (!colaborador) {
      return NextResponse.json(
        { error: 'Colaborador não encontrado' },
        { status: 404 }
      )
    }

    // Validar tipo de arquivo
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não permitido. Apenas PDF, JPG, PNG, DOC e DOCX são aceitos.' },
        { status: 400 }
      )
    }

    // Validar tamanho (10MB max)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Tamanho máximo: 10MB' },
        { status: 400 }
      )
    }

    console.log(`Iniciando upload do documento: ${file.name} para colaborador ${colaborador.nome}`)

    // Converter arquivo para buffer
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)

    // Definir pasta do colaborador
    const folderName = `${colaborador.matricula}_${colaborador.id}`

    // Upload do arquivo para a API de storage
    console.log('Enviando arquivo para API de storage...')
    const uploadResult = await uploadFileBuffer(fileBuffer, file.name, folderName, file.type)

    if (!uploadResult.success) {
      return NextResponse.json(
        { error: `Erro no upload: ${uploadResult.error}` },
        { status: 500 }
      )
    }

    // Salvar metadados no banco (com novos campos de storage)
    console.log('Salvando metadados no banco de dados...')
    const { data: documento, error: dbError } = await serviceSupabase
      .from('documentos')
      .insert({
        colaborador_id: colaboradorId,
        nome: uploadResult.fileName!, // Nome do arquivo salvo na API
        nome_original: file.name,
        tipo: file.name.split('.').pop() || 'bin',
        tamanho: file.size,
        categoria: categoria,
        storage_folder: folderName,
        storage_filename: uploadResult.fileName!
      })
      .select()
      .single()

    if (dbError) {
      console.error('Erro ao salvar no banco:', dbError)
      // Tentar remover arquivo da API de storage em caso de erro no banco
      try {
        const response = await fetch(`${process.env.STORAGE_API_URL}/files/${folderName}/${uploadResult.fileName}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${process.env.STORAGE_API_TOKEN}`,
          }
        })
        if (!response.ok) {
          console.warn('Falha na limpeza do arquivo da API de storage')
        }
      } catch (cleanupError) {
        console.error('Erro na limpeza da API de storage:', cleanupError)
      }

      return NextResponse.json(
        { error: 'Erro ao salvar documento no banco de dados' },
        { status: 500 }
      )
    }

    console.log(`Documento enviado com sucesso: ${documento.nome}`)

    return NextResponse.json({
      success: true,
      message: 'Documento enviado com sucesso',
      documento
    })

  } catch (error) {
    console.error('Erro no upload do documento:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}