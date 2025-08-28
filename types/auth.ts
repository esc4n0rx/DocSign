export interface Usuario {
    id: string
    matricula: string
    nome: string
    email: string
    permissao: 'Admin' | 'Editor' | 'Visualizador'
    status: 'Ativo' | 'Inativo'
    ultimo_acesso?: string
    created_at: string
    updated_at: string
  }
  
  export interface AuthUser {
    id: string
    email: string
    usuario?: Usuario
  }
  
  export interface LoginCredentials {
    matricula: string
    senha: string
  }
  
  export interface AuthResponse {
    user: AuthUser | null
    session: any | null
    error: string | null
  }
  
  export interface JWTPayload {
    sub: string
    email: string
    matricula: string
    permissao: string
    iat: number
    exp: number
  }