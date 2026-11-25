const PLACEHOLDER_PREFIXES = [
  'your',
  'optional',
  'replace',
  'change',
  'dummy',
  'fake',
  'placeholder',
  'example',
  'xxxx',
  'insert',
  'enter',
];

export function isUsableCredential(value: string | undefined | null): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  if (normalized.length === 0) return false;
  return !PLACEHOLDER_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}
