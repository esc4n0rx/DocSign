import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";


export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    return NextResponse.json({ user })

  } catch (error) {
    console.error('Erro ao buscar usuário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}