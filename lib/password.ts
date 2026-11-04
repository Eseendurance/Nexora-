import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

function deriveKey(password: string, salt: string) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, 64, (error, key) => {
      if (error) reject(error);
      else if (Buffer.isBuffer(key)) resolve(key);
      else reject(new Error("Password derivation returned an invalid key."));
    });
  });
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = await deriveKey(password, salt);
  return `scrypt$${salt}$${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, salt, expectedHex] = storedHash.split("$");
  if (algorithm !== "scrypt" || !salt || !/^[a-f0-9]{128}$/i.test(expectedHex ?? "")) {
    return false;
  }

  const expected = Buffer.from(expectedHex, "hex");
  const actual = await deriveKey(password, salt);
  return timingSafeEqual(actual, expected);
}
