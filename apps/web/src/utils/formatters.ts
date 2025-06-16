/**
 * Utility functions for number formatting in different locales
 */

/**
 * Format numbers according to locale (Arabic or English)
 * @param number - The number to format
 * @param locale - The locale ('ar' for Arabic, 'en' for English)
 * @returns Formatted number string
 */
export function formatNumber(number: number, locale: string): string {
  if (locale === 'ar') {
    // Convert English digits to Arabic-Indic digits
    return number.toLocaleString('ar-EG').replace(/[0-9]/g, (digit) => {
      const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
      return arabicDigits[parseInt(digit)];
    });
  }
  return number.toLocaleString('en-US');
}

/**
 * Format currency with proper locale
 * @param amount - The amount to format
 * @param currency - The currency code
 * @param locale - The locale ('ar' for Arabic, 'en' for English)
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currency: string,
  locale: string
): string {
  const formattedAmount = formatNumber(amount, locale);
  return `${currency} ${formattedAmount}`;
}

/**
 * Format date according to locale
 * @param date - The date to format
 * @param locale - The locale ('ar' for Arabic, 'en' for English)
 * @returns Formatted date string
 */
export function formatDate(date: string | Date, locale: string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (locale === 'ar') {
    return dateObj.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
