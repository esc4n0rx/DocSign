import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/auth'
import { downloadFile } from '@/lib/storage-api'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // Aguardar params antes de usar suas propriedades
    const resolvedParams = await params
    const documentoId = parseInt(resolvedParams.id)

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

    let fileBuffer: Buffer

    // Verificar se é documento migrado (com storage_filename) ou antigo (com cloudinary)
    if (documento.storage_folder && documento.storage_filename) {
      // Documento novo - usar API de storage
      console.log(`Storage Folder: ${documento.storage_folder}, Filename: ${documento.storage_filename}`)
      fileBuffer = await downloadFile(documento.storage_folder, documento.storage_filename)
    } else if (documento.cloudinary_public_id) {
      // Documento antigo - usar Cloudinary (compatibilidade temporária)
      console.log(`Cloudinary Public ID: ${documento.cloudinary_public_id}`)
      const { downloadFromCloudinary } = await import('@/lib/cloudinary')
      fileBuffer = await downloadFromCloudinary(documento.cloudinary_public_id)
    } else {
      return NextResponse.json(
        { error: 'Documento sem referência de storage válida' },
        { status: 500 }
      )
    }

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
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length.toString(),
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