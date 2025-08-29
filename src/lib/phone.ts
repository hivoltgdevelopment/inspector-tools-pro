function cleanFormatting(input: string): string {
  // Remove common formatting characters users type
  return input.trim().replace(/[\s()-]/g, '');
}

export function isValidPhone(phone: string): boolean {
  const cleaned = cleanFormatting(phone);
  return /^\+[1-9]\d{1,14}$/.test(cleaned);
}

export function toE164(phone: string): string | null {
  const cleaned = cleanFormatting(phone);
  return /^\+[1-9]\d{1,14}$/.test(cleaned) ? cleaned : null;
}
