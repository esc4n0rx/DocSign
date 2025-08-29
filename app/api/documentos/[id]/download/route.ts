import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/auth'
import { decryptBuffer } from '@/lib/encryption'
import { downloadFromCloudinary } from '@/lib/cloudinary'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    const documentoId = parseInt(params.id)

    if (isNaN(documentoId)) {
      return NextResponse.json(
        { error: 'ID do documento inválido' },
        { status: 400 }
      )
    }

    const serviceSupabase = createServiceClient()

    // Buscar documento
    const { data: documento, error } = await serviceSupabase
      .from('documentos')
      .select('*')
      .eq('id', documentoId)
      .single()

    if (error || !documento) {
      return NextResponse.json(
        { error: 'Documento não encontrado' },
        { status: 404 }
      )
    }

    console.log(`Servindo download do documento: ${documento.nome}`)

    // Baixar arquivo criptografado do Cloudinary
    const encryptedBuffer = await downloadFromCloudinary(documento.cloudinary_public_id)

    // Descriptografar arquivo
    const decryptedBuffer = decryptBuffer(
      encryptedBuffer,
      documento.encryption_iv,
      documento.encryption_tag
    )

    // Determinar Content-Type baseado na extensão
    const contentTypeMap: Record<string, string> = {
      pdf: 'application/pdf',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    }

    const contentType = contentTypeMap[documento.tipo.toLowerCase()] || 'application/octet-stream'

    // Retornar arquivo para download
    return new NextResponse(decryptedBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': decryptedBuffer.length.toString(),
        'Content-Disposition': `attachment; filename="${documento.nome_original}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    console.error('Erro no download do documento:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro ao processar documento para download' 
      },
      { status: 500 }
    )
  }
}