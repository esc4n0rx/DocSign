export interface Documento {
  id: number
  colaborador_id?: number
  nome: string
  nome_original: string
  tipo: string
  tamanho: number
  categoria?: string
  url?: string
  // Campos antigos do Cloudinary (manter para migração)
  cloudinary_public_id?: string
  cloudinary_url?: string
  // Novos campos para a API de storage
  storage_folder?: string
  storage_filename?: string
  created_at: string
  updated_at: string
  // Dados do colaborador (quando incluídos via join)
  colaborador?: {
    id: number
    nome: string
    matricula: string
    email: string
  }
}

export interface DocumentoFormData {
  nome: string
  categoria?: string
  colaborador_id: number
}

export interface DocumentoUpload {
  file: File
  colaborador_id: number
  categoria?: string
}

export interface DocumentoListResponse {
  success: boolean
  documentos?: Documento[]
  error?: string
}

export interface DocumentoResponse {
  success: boolean
  documento?: Documento
  error?: string
}

export interface DocumentoViewResponse {
  success: boolean
  data?: Buffer
  contentType?: string
  error?: string
}

export type DocumentoCategoria = 
  | 'Contrato'
  | 'RG'
  | 'CPF'
  | 'Comprovante de Residência'
  | 'Carteira de Trabalho'
  | 'Título de Eleitor'
  | 'Certificados'
  | 'Outros'