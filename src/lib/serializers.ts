import { Prisma } from "@prisma/client";

export const toNumber = (value: Prisma.Decimal | number | null | undefined) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  return Number(value.toString());
};

export function serializeMoney<T extends Record<string, unknown>>(obj: T) {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (value instanceof Prisma.Decimal) {
      result[key] = toNumber(value);
    } else {
      result[key] = value;
    }
  }
  return result as T;
}

