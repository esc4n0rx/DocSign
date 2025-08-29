export interface Documento {
    id: number
    colaborador_id: number
    nome: string
    nome_original: string
    tipo: string
    tamanho: number
    categoria?: string
    cloudinary_public_id: string
    cloudinary_url: string
    encryption_iv: string
    encryption_tag: string
    is_encrypted: boolean
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