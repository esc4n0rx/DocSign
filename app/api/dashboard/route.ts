
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, getAuthUser } from '@/lib/auth'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser()

    if (!authUser) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const serviceSupabase = createServiceClient()

    // Total de Colaboradores
    const { count: totalColaboradores, error: colaboradoresError } = await serviceSupabase
      .from('colaboradores')
      .select('*', { count: 'exact', head: true })

    if (colaboradoresError) throw new Error('Erro ao buscar total de colaboradores')

    // Documentos Ativos
    const { count: documentosAtivos, error: documentosError } = await serviceSupabase
      .from('documentos')
      .select('*', { count: 'exact', head: true })

    if (documentosError) throw new Error('Erro ao buscar documentos ativos')

    // Usuários Ativos
    const { count: usuariosAtivos, error: usuariosError } = await serviceSupabase
      .from('usuarios')
      .select('*', { count: 'exact', head: true })

    if (usuariosError) throw new Error('Erro ao buscar usuários ativos')

    // Consultas Hoje (exemplo, necessita de uma tabela de logs ou consultas)
    const consultasHoje = 0 // Placeholder

    return NextResponse.json({
      success: true,
      data: {
        totalColaboradores: totalColaboradores || 0,
        documentosAtivos: documentosAtivos || 0,
        consultasHoje,
        usuariosAtivos: usuariosAtivos || 0,
      }
    })

  } catch (error) {
    console.error('Erro no endpoint do dashboard:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
