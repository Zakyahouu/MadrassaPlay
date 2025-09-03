// Simple DZ currency formatter for consistent display across the app
// Usage: formatDZ(1234.5) => 'DZ 1,234.5'
export function formatDZ(amount, options = {}) {
  const { noSymbol = false, fractionDigits } = options;
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return noSymbol ? '0' : 'DZ 0';
  }
  const num = Number(amount);
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: typeof fractionDigits === 'number' ? fractionDigits : 0,
    maximumFractionDigits: typeof fractionDigits === 'number' ? fractionDigits : 2,
  }).format(num);
  return noSymbol ? formatted : `DZ ${formatted}`;
}

export default formatDZ;
