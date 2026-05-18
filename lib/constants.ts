export const BANK_COLORS: Record<string, string> = {
  hdfc: 'from-[#0f172a] to-[#1e1b4b]', // deep navy to midnight blue
  sbi: 'from-[#064e3b] to-[#134e4a]', // forest green to dark teal
  icici: 'from-[#7f1d1d] to-[#4c0519]', // dark crimson to deep maroon
  axis: 'from-[#1e293b] to-[#0f172a]', // charcoal to dark slate
  kotak: 'from-[#78350f] to-[#451a03]', // deep amber to dark bronze
  yes: 'from-[#3b0764] to-[#312e81]', // deep purple to indigo
  idfc: 'from-[#083344] to-[#164e63]', // dark cyan to petrol
  default: 'from-[#171717] to-[#0a0a0a]', // dark graphite gradient
};

export function getBankColorClass(bank: string): string {
  const normalized = bank.toLowerCase().split(' ')[0]; // Handle "Yes Bank" -> "yes"
  return BANK_COLORS[normalized] || BANK_COLORS['default'];
}

export const HOLDERS = ['Manu Jindal', 'Sushma Jindal', 'Ankita'];
export const BANKS = ['HDFC', 'SBI', 'ICICI', 'Axis', 'Kotak', 'Yes Bank', 'IDFC', 'PNB', 'BOB', 'Canara'];
