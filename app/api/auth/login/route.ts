import { NextRequest, NextResponse } from 'next/server'
import { authenticateByMatricula, generateJWT } from '@/lib/auth'
import { LoginCredentials } from '@/types/auth'

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";


export async function POST(request: NextRequest) {
  console.log('=== Iniciando processo de login ===')
  
  try {
    const body = await request.json()
    console.log('Dados recebidos:', { matricula: body.matricula, senhaLength: body.senha?.length })
    
    const { matricula, senha }: LoginCredentials = body

    if (!matricula || !senha) {
      console.log('Dados faltando:', { matricula: !!matricula, senha: !!senha })
      return NextResponse.json(
        { error: 'Matrícula e senha são obrigatórios' },
        { status: 400 }
      )
    }

    console.log('Chamando authenticateByMatricula...')
    const user = await authenticateByMatricula(matricula, senha)
    console.log('Resultado da autenticação:', !!user)

    if (!user) {
      console.log('Autenticação falhou')
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      )
    }

    console.log('Gerando JWT...')
    const token = generateJWT(user)
    console.log('JWT gerado com sucesso')

    // Criar resposta com cookie httpOnly
    const response = NextResponse.json({
      user,
      token,
      message: 'Login realizado com sucesso'
    })

    // Definir cookie com token JWT
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 horas
      path: '/'
    })

    console.log('=== Login concluído com sucesso ===')
    return response

  } catch (error) {
    console.error('=== Erro no login ===', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}