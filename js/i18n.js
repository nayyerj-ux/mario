// All user-facing digits in this Persian-language game must render as
// Persian (Eastern Arabic) numerals, not Western ones - mixing the two
// inside one HUD reads as broken localization to native readers.

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

/**
 * Convert any Western-digit number/string into Persian numerals.
 * @param {number|string} value
 * @returns {string}
 */
export function toPersianDigits(value) {
  return String(value).replace(/[0-9]/g, (d) => PERSIAN_DIGITS[Number(d)]);
}
