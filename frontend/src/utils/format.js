const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

/** 1999 -> "₹1,999" */
export function formatPrice(amount) {
  return inr.format(Number(amount) || 0);
}

/** 24 -> "24 hours", 1 -> "1 hour", null -> "Not specified" */
export function formatHours(hours) {
  const n = Number(hours);
  if (hours === null || hours === undefined || Number.isNaN(n)) return 'Not specified';
  return `${n} ${n === 1 ? 'hour' : 'hours'}`;
}

export function formatItemType(type) {
  return type === 'package' ? 'Package' : 'Single Test';
}

/** "1 result found" / "4 results found" */
export function formatResultCount(count) {
  return `${count} ${count === 1 ? 'result' : 'results'} found`;
}
