import jwt from 'jsonwebtoken'
import { JWTPayload } from '@/types/auth'

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key'

export function signJWT(payload: object): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' })
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    return null
  }
}

export function decodeJWT(token: string): any {
  try {
    return jwt.decode(token)
  } catch (error) {
    return null
  }
}