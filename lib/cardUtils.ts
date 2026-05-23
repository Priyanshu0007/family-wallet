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
