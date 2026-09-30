/**
 * Helpers for customer birthday / anniversary greetings sent from the admin CRM.
 */

/**
 * Converts a stored customer phone into the international digits WhatsApp's click-to-chat
 * link expects (India, +91). Returns null when the number can't be a valid Indian mobile,
 * e.g. the "G-xxxxxxxx" placeholders created for Google sign-ups.
 */
export function toWhatsAppNumber(phone: string | null | undefined): string | null {
  const digits = String(phone || "").replace(/\D/g, "");
  let national: string;

  if (digits.length === 10) {
    national = digits;
  } else if (digits.length === 11 && digits.startsWith("0")) {
    national = digits.slice(1);
  } else if (digits.length === 12 && digits.startsWith("91")) {
    national = digits.slice(2);
  } else if (digits.length === 13 && digits.startsWith("091")) {
    national = digits.slice(3);
  } else {
    return null;
  }

  // Indian mobile numbers start with 6, 7, 8 or 9.
  if (!/^[6-9]\d{9}$/.test(national)) return null;
  return `91${national}`;
}

/**
 * Days from `today` until the next yearly occurrence of a YYYY-MM-DD date (0 = today).
 * The stored year (birth / wedding year) is ignored. 29 Feb falls on 28 Feb in non-leap years.
 * Returns null for missing or unparsable dates.
 */
export function daysUntilNextOccurrence(dateStr: string | null | undefined, today: Date = new Date()): number | null {
  const match = String(dateStr || "").trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  if (month < 0 || month > 11 || day < 1 || day > 31) return null;

  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const occurrenceIn = (year: number) => {
    const lastDay = new Date(year, month + 1, 0).getDate();
    return new Date(year, month, Math.min(day, lastDay));
  };

  let next = occurrenceIn(startOfToday.getFullYear());
  if (next < startOfToday) next = occurrenceIn(startOfToday.getFullYear() + 1);
  return Math.round((next.getTime() - startOfToday.getTime()) / 86400000);
}
