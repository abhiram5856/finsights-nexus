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
