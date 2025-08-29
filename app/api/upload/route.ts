import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/auth'
import { encryptBuffer } from '@/lib/encryption'
import { uploadEncryptedBuffer } from '@/lib/cloudinary'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

export async function POST(request: NextRequest) {
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
        { error: 'Apenas administradores e editores podem fazer upload de documentos' },
        { status: 403 }
      )
    }

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

    // Criptografar o arquivo
    console.log('Criptografando arquivo...')
    const { encryptedData, iv, tag } = encryptBuffer(fileBuffer)

    // Gerar nome único para o arquivo
    const timestamp = Date.now()
    const extension = file.name.split('.').pop() || 'bin'
    const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const folderPath = `colaboradores/${colaborador.matricula}_${colaborador.id}`

    // Upload do arquivo criptografado para Cloudinary
    console.log('Enviando arquivo criptografado para Cloudinary...')
    const uploadResult = await uploadEncryptedBuffer(encryptedData, fileName, folderPath)

    if (!uploadResult.success) {
      return NextResponse.json(
        { error: `Erro no upload: ${uploadResult.error}` },
        { status: 500 }
      )
    }

    // Salvar metadados no banco
    console.log('Salvando metadados no banco de dados...')
    const { data: documento, error: dbError } = await serviceSupabase
      .from('documentos')
      .insert({
        colaborador_id: colaboradorId,
        nome: fileName,
        nome_original: file.name,
        tipo: extension,
        tamanho: file.size,
        categoria: categoria,
        cloudinary_public_id: uploadResult.public_id!,
        cloudinary_url: uploadResult.secure_url!,
        encryption_iv: iv,
        encryption_tag: tag,
        is_encrypted: true
      })
      .select()
      .single()

    if (dbError) {
      console.error('Erro ao salvar no banco:', dbError)
      // Tentar remover arquivo do Cloudinary em caso de erro no banco
      try {
        await fetch(`${process.env.CLOUDINARY_URL}/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/raw/destroy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            public_id: uploadResult.public_id!,
            api_key: process.env.CLOUDINARY_API_KEY!,
            timestamp: Math.round(Date.now() / 1000).toString(),
            signature: '' // Precisaria calcular a assinatura
          })
        })
      } catch (cleanupError) {
        console.error('Erro na limpeza do Cloudinary:', cleanupError)
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