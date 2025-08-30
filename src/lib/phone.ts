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

// Normalize user input to E.164, defaulting to +1 when no country code is provided.
export function normalizeToE164(input: string, defaultCountry = '+1'): string | null {
  const trimmed = input.trim();
  const asE164 = toE164(trimmed);
  if (asE164) return asE164;

  // Strip non-digits
  const digits = trimmed.replace(/\D+/g, '');
  if (!digits) return null;

  if (defaultCountry === '+1') {
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length === 11 && digits.startsWith('1')) return `+1${digits.slice(1)}`;
  }

  if (defaultCountry.startsWith('+')) {
    return `${defaultCountry}${digits}`;
  }
  return null;
}
