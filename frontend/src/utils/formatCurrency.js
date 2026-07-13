/**
 * Format an amount that is ALREADY in the target display currency.
 * (rate is pre-applied — used when the backend has already normalised to USD
 *  and the frontend multiplies by getRate(selectedCurrency))
 */
export function formatCurrency(amount, currencyCode = 'INR', rate = 1) {
    if (amount === null || amount === undefined) return 'N/A';
    const locale = currencyCode === 'INR' ? 'en-IN' : 'en-US';
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount * rate);
}

/**
 * Convert an amount from one currency to another and format it.
 *
 * @param {number}   amount        - The raw amount in fromCurrency
 * @param {string}   fromCurrency  - The native currency of the amount (e.g. "USD", "INR")
 * @param {string}   toCurrency    - The desired display currency
 * @param {Function} getRate       - CurrencyContext's getRate(code) → rate vs USD
 * @returns {string}               - Formatted currency string
 *
 * Conversion maths:
 *   amount (fromCurrency) → USD : amount / getRate(fromCurrency)
 *   USD → toCurrency            : × getRate(toCurrency)
 */
export function convertAndFormat(amount, fromCurrency, toCurrency, getRate) {
    if (amount === null || amount === undefined) return 'N/A';

    const fromRate = getRate(fromCurrency) || 1;  // fromCurrency per 1 USD
    const toRate   = getRate(toCurrency)   || 1;  // toCurrency per 1 USD

    const amountInUSD  = amount / fromRate;
    const finalAmount  = amountInUSD * toRate;

    const locale = toCurrency === 'INR' ? 'en-IN' : 'en-US';
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: toCurrency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(finalAmount);
}

/**
 * Convert a raw USD amount to the display currency and format it.
 * Use this for portfolio totals that come from the backend normalised in USD.
 */
export function formatFromUSD(amountUSD, toCurrency, getRate) {
    return convertAndFormat(amountUSD, 'USD', toCurrency, getRate);
}
