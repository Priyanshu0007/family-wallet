export function getCardNetwork(number: string): string {
  if (number.startsWith('4')) return 'Visa';
  if (/^5[1-5]/.test(number)) return 'Mastercard';
  if (/^3[47]/.test(number)) return 'Amex';
  if (number.startsWith('6')) return 'RuPay';
  return 'Unknown';
}

export function formatCardNumber(number: string): string {
  return number.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
}

export function maskCardNumber(number: string): string {
  const clean = number.replace(/\s/g, '');
  if (clean.length < 8) return number;
  return `${clean.slice(0, 4)} •••• •••• ${clean.slice(-4)}`;
}

export function parseExpiry(expiry: string): Date {
  const [month, year] = expiry.split('/');
  // Assume year is 20xx
  return new Date(2000 + parseInt(year, 10), parseInt(month, 10) - 1, 1);
}

export function getExpiryStatus(expiry: string): 'ok' | 'expiring' | 'expired' {
  if (!expiry) return 'ok';
  
  try {
    const [month, year] = expiry.split('/');
    const expiryDate = new Date(2000 + parseInt(year, 10), parseInt(month, 10), 0); // last day of month
    const now = new Date();
    
    if (expiryDate < now) return 'expired';
    
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(now.getMonth() + 3);
    
    if (expiryDate <= threeMonthsFromNow) return 'expiring';
    return 'ok';
  } catch {
    return 'ok';
  }
}

let activeTimeout: any = null;
let activeCopiedValue = '';

export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
  activeCopiedValue = text;
  
  if (activeTimeout) {
    clearTimeout(activeTimeout);
  }
  
  activeTimeout = setTimeout(async () => {
    try {
      const currentText = await navigator.clipboard.readText();
      if (currentText === activeCopiedValue) {
        await navigator.clipboard.writeText('');
      }
    } catch (err) {
      console.warn('[Clipboard] Failed to read clipboard for verification:', err);
    }
  }, 30000);
}

export interface BillStatus {
  dueSoon: boolean;
  dueToday: boolean;
  daysRemaining: number;
  dueDay: number;
}

export function getBillDueStatus(dueDay?: number): BillStatus | null {
  if (!dueDay || dueDay < 1 || dueDay > 31) return null;
  
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Clamping dueDay to last day of target month (e.g. 31st in a 30-day month, or 31st in February)
  const getClampedDue = (year: number, monthIdx: number, targetDay: number): Date => {
    const lastDay = new Date(year, monthIdx + 1, 0).getDate();
    return new Date(year, monthIdx, Math.min(targetDay, lastDay));
  };
  
  let due = getClampedDue(currentYear, currentMonth, dueDay);
  
  // If the due date has already passed in the current month, look at next month
  if (currentDay > due.getDate()) {
    due = getClampedDue(currentYear, currentMonth + 1, dueDay);
  }
  
  // Clear times to make date-only comparison
  const d1 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const d2 = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  
  const diffTime = d2.getTime() - d1.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  return {
    dueSoon: diffDays <= 5 && diffDays >= 0,
    dueToday: diffDays === 0,
    daysRemaining: diffDays,
    dueDay
  };
}

export function getCardUtilization(usedCredit?: number, limit?: number): number {
  if (!limit || limit <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round(((usedCredit || 0) / limit) * 100)));
}
