export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '€0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};