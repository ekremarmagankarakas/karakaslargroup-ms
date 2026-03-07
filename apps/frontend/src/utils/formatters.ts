export function formatPrice(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return num.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleString('tr-TR');
}

export function parsePriceInput(value: string): string {
  // Strip everything except digits, commas, dots, then convert comma to dot
  const cleaned = value.replace(/[^0-9.,]/g, '').replace(',', '.');
  return cleaned;
}
