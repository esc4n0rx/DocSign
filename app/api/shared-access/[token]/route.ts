// app/api/shared-access/[token]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/auth'
import { isSharedLinkValid, extractIpAddress } from '@/lib/shared-link'

// GET - Acessar dados via token compartilhado
export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const resolvedParams = await params
    const { token } = resolvedParams

    if (!token) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 400 }
      )
    }

    const serviceSupabase = createServiceClient()

    // Buscar link compartilhado pelo token
    const { data: sharedLink, error: linkError } = await serviceSupabase
      .from('shared_links')
      .select(`
        *,
        colaborador:colaboradores(*)
      `)
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

    // Buscar documentos do colaborador
    const { data: documentos, error: docsError } = await serviceSupabase
      .from('documentos')
      .select('id, nome_original, tipo, tamanho, categoria, created_at')
      .eq('colaborador_id', sharedLink.colaborador_id)
      .order('created_at', { ascending: false })

    if (docsError) {
      console.error('Erro ao buscar documentos:', docsError)
      return NextResponse.json(
        { error: 'Erro ao buscar documentos' },
        { status: 500 }
      )
    }

    // Incrementar contador de acesso e atualizar último acesso
    const { error: updateError } = await serviceSupabase
      .from('shared_links')
      .update({
        access_count: sharedLink.access_count + 1,
        last_accessed_at: new Date().toISOString()
      })
      .eq('id', sharedLink.id)

    if (updateError) {
      console.warn('Erro ao atualizar contadores de acesso:', updateError)
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
        action: 'list'
      })

    return NextResponse.json({
      success: true,
      data: {
        colaborador: sharedLink.colaborador,
        documentos: documentos || [],
        expires_at: sharedLink.expires_at,
        access_count: sharedLink.access_count + 1
      }
    })

  } catch (error) {
    console.error('Erro no acesso via token compartilhado:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}