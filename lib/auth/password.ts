// 密码哈希：argon2id。绝不明文/可逆存储密码。
import { argon2id, hash, verify } from "argon2";

export async function hashPassword(plain: string): Promise<string> {
  return hash(plain, { type: argon2id });
}

export async function verifyPassword(digest: string, plain: string): Promise<boolean> {
  try {
    return await verify(digest, plain);
  } catch {
    return false;
  }
}
