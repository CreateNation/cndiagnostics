import { customAlphabet } from "nanoid";

const generateCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);

export function createNinetyDayUnlockCode(): string {
  return generateCode();
}
