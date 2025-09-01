// app/api/shared-access/[token]/document/[documentId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/auth'
import { isSharedLinkValid, extractIpAddress } from '@/lib/shared-link'
import { downloadFile } from '@/lib/storage-api'

// GET - Visualizar documento via token compartilhado
export async function GET(
 request: NextRequest, 
 { params }: { params: Promise<{ token: string; documentId: string }> }
) {
 try {
   const resolvedParams = await params
   const { token, documentId } = resolvedParams

   if (!token || !documentId) {
     return NextResponse.json(
       { error: 'Token ou ID do documento inválido' },
       { status: 400 }
     )
   }

   const documentoId = parseInt(documentId)
   if (isNaN(documentoId)) {
     return NextResponse.json(
       { error: 'ID do documento inválido' },
       { status: 400 }
     )
   }

   const serviceSupabase = createServiceClient()

   // Buscar link compartilhado pelo token
   const { data: sharedLink, error: linkError } = await serviceSupabase
     .from('shared_links')
     .select('*')
     .eq('token', token)
     .single()

   if (linkError || !sharedLink) {
     return NextResponse.json(
       { error: 'Link não encontrado ou inválido' },
       { status: 404 }
     )
   }

   // Verificar se o link ainda é válido
   if (!isSharedLinkValid(sharedLink)) {
     return NextResponse.json(
       { error: 'Link expirado ou inativo' },
       { status: 403 }
     )
   }

   // Buscar documento específico do colaborador
   const { data: documento, error: docError } = await serviceSupabase
     .from('documentos')
     .select('*')
     .eq('id', documentoId)
     .eq('colaborador_id', sharedLink.colaborador_id)
     .single()

   if (docError || !documento) {
     return NextResponse.json(
       { error: 'Documento não encontrado' },
       { status: 404 }
     )
   }

   // Verificar se o documento tem referência de storage válida
   if (!documento.storage_folder || !documento.storage_filename) {
     return NextResponse.json(
       { error: 'Documento sem referência de storage válida' },
       { status: 404 }
     )
   }

   // Registrar log de acesso
   const ipAddress = extractIpAddress(request)
   const userAgent = request.headers.get('user-agent') || ''

   await serviceSupabase
     .from('shared_link_access_logs')
     .insert({
       shared_link_id: sharedLink.id,
       ip_address: ipAddress,
       user_agent: userAgent,
       document_id: documentoId,
       action: 'view'
     })

   // Baixar arquivo da API de storage
   const fileBuffer = await downloadFile(documento.storage_folder, documento.storage_filename)

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

   // Retornar arquivo para visualização
   return new NextResponse(fileBuffer, {
     headers: {
       'Content-Type': contentType,
       'Content-Length': fileBuffer.length.toString(),
       'Content-Disposition': `inline; filename="${documento.nome_original}"`,
       'Cache-Control': 'no-cache, no-store, must-revalidate',
       'Pragma': 'no-cache',
       'Expires': '0'
     }
   })

 } catch (error) {
   console.error('Erro na visualização do documento via token:', error)
   return NextResponse.json(
     { 
       success: false,
       error: 'Erro ao processar documento para visualização' 
     },
     { status: 500 }
   )
 }
}