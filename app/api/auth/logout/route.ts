import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";


export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Fazer logout no Supabase
    await supabase.auth.signOut()

    // Criar resposta
    const response = NextResponse.json({
      message: 'Logout realizado com sucesso'
    })

    // Remover cookie de autenticação
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    })

    return response

  } catch (error) {
    console.error('Erro no logout:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}