import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

// Chaves do ambiente (NUNCA expostas ao cliente)
const ENCRYPTION_KEY = process.env.DOCUMENT_ENCRYPTION_KEY!
const ALGORITHM = 'aes-256-gcm'

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
  throw new Error('DOCUMENT_ENCRYPTION_KEY (64 hex characters) is required')
}

// A chave precisa ser um buffer de 32 bytes para aes-256
const key = Buffer.from(ENCRYPTION_KEY, 'hex')

/**
 * Criptografa um buffer de dados usando AES-256-GCM
 */
export function encryptBuffer(buffer: Buffer): {
  encryptedData: Buffer
  iv: string
  tag: string
} {
  // 1. Gerar um IV (Initialization Vector) aleatório de 12 bytes (96 bits), o padrão para GCM
  const iv = randomBytes(12)

  // 2. Criar o cifrador com o algoritmo, a chave e o IV
  const cipher = createCipheriv(ALGORITHM, key, iv)

  // 3. Criptografar os dados
  const encryptedData = Buffer.concat([cipher.update(buffer), cipher.final()])

  // 4. Obter a tag de autenticação gerada pelo GCM
  const tag = cipher.getAuthTag()

  return {
    encryptedData,
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
  }
}

/**
 * Descriptografa dados usando AES-256-GCM
 */
export function decryptBuffer(encryptedData: Buffer, iv: string, tag: string): Buffer {
  try {
    // 1. Converter IV e tag de hex para Buffer
    const ivBuffer = Buffer.from(iv, 'hex')
    const tagBuffer = Buffer.from(tag, 'hex')

    // 2. Criar o decifrador com o algoritmo, a chave e o IV
    const decipher = createDecipheriv(ALGORITHM, key, ivBuffer)

    // 3. Definir a tag de autenticação. Isso é crucial para verificar a integridade.
    decipher.setAuthTag(tagBuffer)

    // 4. Descriptografar os dados. Se a tag for inválida, um erro será lançado aqui.
    const decryptedData = Buffer.concat([decipher.update(encryptedData), decipher.final()])

    return decryptedData
  } catch (error) {
    console.error('Erro na descriptografia:', error)
    throw new Error('Falha na descriptografia: os dados podem estar corrompidos ou a chave está incorreta.')
  }
}

/**
 * Valida se o IV e a tag parecem ter o formato correto.
 */
export function validateEncryption(iv: string, tag: string): boolean {
  // IV de 12 bytes em hex = 24 caracteres
  // Tag de 16 bytes em hex = 32 caracteres
  return iv.length === 24 && tag.length === 32
}