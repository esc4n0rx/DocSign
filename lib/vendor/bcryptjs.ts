import { randomBytes, scrypt as nodeScrypt, timingSafeEqual } from 'crypto'
import { promisify } from 'util'

const scrypt = promisify(nodeScrypt)
const SALT_LENGTH = 16 // 128 bits
const KEY_LENGTH = 32 // 256 bits

/**
 * Gera um hash usando scrypt como alternativa ao bcrypt.
 * Mantém assinatura compatível com bcryptjs.hash.
 */
export async function hash(password: string, rounds = 10): Promise<string> {
  if (!password) {
    throw new Error('Password is required for hashing')
  }

  const salt = randomBytes(SALT_LENGTH)
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer
  const saltHex = salt.toString('hex')
  const hashHex = derivedKey.toString('hex')

  return `$scrypt$${rounds}$${saltHex}$${hashHex}`
}

/**
 * Compara senha em texto plano com hash gerado pela função hash.
 * Compatível com bcryptjs.compare.
 */
export async function compare(password: string, storedHash: string): Promise<boolean> {
  if (!password || !storedHash) {
    return false
  }

  const parts = storedHash.split('$')
  if (parts.length !== 5 || parts[1] !== 'scrypt') {
    return false
  }

  const saltHex = parts[3]
  const hashHex = parts[4]

  if (!saltHex || !hashHex) {
    return false
  }

  const salt = Buffer.from(saltHex, 'hex')
  const original = Buffer.from(hashHex, 'hex')
  const derivedKey = (await scrypt(password, salt, original.length)) as Buffer

  if (derivedKey.length !== original.length) {
    return false
  }

  return timingSafeEqual(derivedKey, original)
}

export default {
  hash,
  compare,
}
