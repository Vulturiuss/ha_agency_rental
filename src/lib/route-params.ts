export function parseIdParam(value: string | undefined | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const id = Number.parseInt(trimmed, 10);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}
