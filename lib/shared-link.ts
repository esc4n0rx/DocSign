// lib/shared-link.ts
import { createHash, randomBytes } from 'crypto'

/**
 * Gera um token único e seguro para link compartilhado
 */
export function generateSharedToken(): string {
  const randomPart = randomBytes(32).toString('hex')
  const timestamp = Date.now().toString()
  const combined = `${randomPart}-${timestamp}`
  
  // Criar hash SHA-256 do token combinado
  const hash = createHash('sha256').update(combined).digest('hex')
  
  // Retornar os primeiros 32 caracteres do hash
  return hash.substring(0, 32)
}

/**
 * Verifica se um link compartilhado ainda é válido
 */
export function isSharedLinkValid(sharedLink: {
  expires_at: string
  is_active: boolean
}): boolean {
  if (!sharedLink.is_active) {
    return false
  }
  
  const expirationDate = new Date(sharedLink.expires_at)
  const now = new Date()
  
  return expirationDate > now
}

/**
 * Calcula quantos dias restam para expiração
 */
export function getDaysUntilExpiration(expiresAt: string): number {
  const expirationDate = new Date(expiresAt)
  const now = new Date()
  const diffTime = expirationDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return Math.max(0, diffDays)
}

/**
 * Formata URL do link compartilhado
 */
export function formatSharedLinkUrl(token: string, baseUrl?: string): string {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '')
  return `${base}/shared/${token}`
}

/**
 * Extrai IP do request (considerando proxies)
 */
export function extractIpAddress(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIp) {
    return realIp
  }
  
  return 'unknown'
}