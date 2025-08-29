import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/auth'


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

    // Buscar documento com dados do colaborador
    const { data: documento, error } = await serviceSupabase
      .from('documentos')
      .select(`
        *,
        colaborador:colaboradores!inner(id, nome, matricula)
      `)
      .eq('id', documentoId)
      .single()

    if (error) {
      console.error('Erro ao buscar documento:', error)
      return NextResponse.json(
        { success: false, error: 'Documento não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      documento 
    })

  } catch (error) {
    console.error('Erro ao buscar documento:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor' 
      },
      { status: 500 }
    )
  }
}