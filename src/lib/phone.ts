export function isValidPhone(phone: string): boolean {
  return /^\+[1-9]\d{1,14}$/.test(phone);
}
