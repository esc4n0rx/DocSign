export interface Colaborador {
    id: number
    nome: string
    matricula: string
    cargo: string
    departamento: string
    status: 'Ativo' | 'Inativo' | 'Férias' | 'Licença Médica'
    email: string
    telefone?: string
    data_admissao: string
    cloudinary_folder?: string
    created_at: string
    updated_at: string
  }
  
  export interface ColaboradorFormData {
    nome: string
    matricula: string
    cargo: string
    departamento: string
    status: 'Ativo' | 'Inativo' | 'Férias' | 'Licença Médica'
    email: string
    telefone?: string
    data_admissao: string
  }
  
  export interface ColaboradorCreateResponse {
    success: boolean
    colaborador?: Colaborador
    cloudinaryResult?: {
      success: boolean
      folderName?: string
      error?: string
    }
    error?: string
  }
  
  export interface ColaboradorListResponse {
    success: boolean
    colaboradores?: Colaborador[]
    error?: string
  }