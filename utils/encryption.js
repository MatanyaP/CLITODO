import fs from 'fs'
import crypto from 'crypto'


const algorithm = 'aes-256-cbc'; //Using AES encryption


export async function getKey() {
  const key = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);
  return { key, iv };
}
//Encrypting text
export function encrypt(text, key, iv) {
   const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
   let encrypted = cipher.update(text);
   encrypted = Buffer.concat([encrypted, cipher.final()]);
   return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
}

// Decrypting text
export function decrypt(text, key) {
    let iv = Buffer.from(text.iv, 'hex');
    let encryptedText = Buffer.from(text.encryptedData, 'hex');
    const key_in_bytes = Buffer.from(key, 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', key_in_bytes, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}