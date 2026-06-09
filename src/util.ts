// Node.js support
import * as crypto from 'crypto'
import { promisify } from 'util'

const randomFill = promisify(crypto.randomFill)

export async function getRandomBytes(buf: Uint8Array): Promise<unknown> {
  return await randomFill(buf)
}

export function bytesToHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('hex')
}

export function bytesFromHex(hex: string): Uint8Array {
  return new Uint8Array(Buffer.from(hex, 'hex'))
}
