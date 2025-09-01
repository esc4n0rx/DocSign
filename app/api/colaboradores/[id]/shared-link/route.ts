// app/api/colaboradores/[id]/shared-link/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/auth'
import { generateSharedToken, formatSharedLinkUrl } from '@/lib/shared-link'

// GET - Listar links compartilhados do colaborador
export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params
    const colaboradorId = parseInt(resolvedParams.id)

    if (isNaN(colaboradorId)) {
      return NextResponse.json(
        { error: 'ID do colaborador inválido' },
        { status: 400 }
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
        { error: 'Apenas administradores e editores podem gerenciar links compartilhados' },
        { status: 403 }
      )
    }

    // Buscar links compartilhados do colaborador
    const { data: sharedLinks, error } = await serviceSupabase
      .from('shared_links')
      .select(`
        *,
        colaborador:colaboradores(id, nome, matricula, email)
      `)
      .eq('colaborador_id', colaboradorId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar links compartilhados:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar links compartilhados' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      shared_links: sharedLinks || []
    })

  } catch (error) {
    console.error('Erro na busca de links compartilhados:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}

// POST - Criar novo link compartilhado
export async function POST(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params
    const colaboradorId = parseInt(resolvedParams.id)

    if (isNaN(colaboradorId)) {
      return NextResponse.json(
        { error: 'ID do colaborador inválido' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { expires_in_days } = body

    if (!expires_in_days || expires_in_days < 1 || expires_in_days > 365) {
      return NextResponse.json(
        { error: 'Período de expiração deve ser entre 1 e 365 dias' },
        { status: 400 }
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
        { error: 'Apenas administradores e editores podem criar links compartilhados' },
        { status: 403 }
      )
    }

    // Verificar se colaborador existe
    const { data: colaborador, error: colaboradorError } = await serviceSupabase
      .from('colaboradores')
      .select('*')
      .eq('id', colaboradorId)
      .single()

    if (colaboradorError || !colaborador) {
      return NextResponse.json(
        { error: 'Colaborador não encontrado' },
        { status: 404 }
      )
    }

    // Desativar links compartilhados ativos existentes do colaborador
    await serviceSupabase
      .from('shared_links')
      .update({ is_active: false })
      .eq('colaborador_id', colaboradorId)
      .eq('is_active', true)

    // Gerar token único
    const token = generateSharedToken()

    // Calcular data de expiração
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expires_in_days)

    // Criar link compartilhado
    const { data: sharedLink, error: createError } = await serviceSupabase
      .from('shared_links')
      .insert({
        colaborador_id: colaboradorId,
        token,
        created_by: currentUser.id,
        expires_at: expiresAt.toISOString(),
        is_active: true
      })
      .select(`
        *,
        colaborador:colaboradores(id, nome, matricula, email)
      `)
      .single()

    if (createError) {
      console.error('Erro ao criar link compartilhado:', createError)
      return NextResponse.json(
        { error: 'Erro ao criar link compartilhado' },
        { status: 500 }
      )
    }

    const sharedUrl = formatSharedLinkUrl(token, request.headers.get('origin') || undefined)

    console.log(`Link compartilhado criado para ${colaborador.nome}: ${sharedUrl}`)

    return NextResponse.json({
      success: true,
      shared_link: sharedLink,
      url: sharedUrl
    })

  } catch (error) {
    console.error('Erro na criação do link compartilhado:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar status do link compartilhado
export async function PATCH(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
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

    const body = await request.json()
    const { shared_link_id, is_active } = body

    if (!shared_link_id || typeof is_active !== 'boolean') {
      return NextResponse.json(
        { error: 'ID do link e status são obrigatórios' },
        { status: 400 }
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
        { error: 'Apenas administradores e editores podem alterar links compartilhados' },
        { status: 403 }
      )
    }

    // Atualizar link compartilhado
    const { error } = await serviceSupabase
      .from('shared_links')
      .update({ is_active })
      .eq('id', shared_link_id)

    if (error) {
      console.error('Erro ao atualizar link compartilhado:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar link compartilhado' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Link ${is_active ? 'ativado' : 'desativado'} com sucesso`
    })

  } catch (error) {
    console.error('Erro na atualização do link compartilhado:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}

// DELETE - Remover link compartilhado
export async function DELETE(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
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

    const body = await request.json()
    const { shared_link_id } = body

    if (!shared_link_id) {
      return NextResponse.json(
        { error: 'ID do link é obrigatório' },
        { status: 400 }
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
        { error: 'Apenas administradores e editores podem remover links compartilhados' },
        { status: 403 }
      )
    }

    // Remover link compartilhado
    const { error } = await serviceSupabase
      .from('shared_links')
      .delete()
      .eq('id', shared_link_id)

    if (error) {
      console.error('Erro ao remover link compartilhado:', error)
      return NextResponse.json(
        { error: 'Erro ao remover link compartilhado' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Link compartilhado removido com sucesso'
    })

  } catch (error) {
    console.error('Erro na remoção do link compartilhado:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}