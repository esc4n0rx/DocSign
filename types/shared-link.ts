// types/shared-link.ts
import { Colaborador } from './colaborador'

export interface SharedLink {
  id: number
  colaborador_id: number
  token: string
  created_by?: string
  expires_at: string
  is_active: boolean
  access_count: number
  last_accessed_at?: string
  created_at: string
  updated_at: string
  // Dados do colaborador (quando incluídos via join)
  colaborador?: Colaborador
}

export interface SharedLinkFormData {
  colaborador_id: number
  expires_in_days: number
}

export interface SharedLinkCreateResponse {
  success: boolean
  shared_link?: SharedLink
  url?: string
  error?: string
}

export interface SharedLinkListResponse {
  success: boolean
  shared_links?: SharedLink[]
  error?: string
}

export interface SharedLinkAccessLog {
  id: number
  shared_link_id: number
  accessed_at: string
  ip_address?: string
  user_agent?: string
  document_id?: number
  action: 'view' | 'download' | 'list'
}

export interface SharedAccessData {
  colaborador: Colaborador
  documentos: Array<{
    id: number
    nome_original: string
    tipo: string
    tamanho: number
    categoria?: string
    created_at: string
  }>
  expires_at: string
  access_count: number
}