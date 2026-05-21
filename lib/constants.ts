export const BANK_COLORS: Record<string, string> = {
  hdfc: 'from-[#0a1128] via-[#101f42] to-[#001f54]', // sleek premium deep sapphire mesh
  sbi: 'from-[#082f1e] via-[#124e36] to-[#0a1c14]', // forest emerald to dark slate-green
  icici: 'from-[#2e0909] via-[#4c0c0c] to-[#1a0505]', // deep burgundy crimson
  axis: 'from-[#1e1e24] via-[#2d2d3a] to-[#0e0e12]', // dark metallic slate
  kotak: 'from-[#2e1903] via-[#472d0c] to-[#140c02]', // dark amber bronze
  yes: 'from-[#0c1a30] via-[#1b3a5b] to-[#071120]', // luxury blue/navy gradient
  idfc: 'from-[#052233] via-[#0b3d59] to-[#02131c]', // petrol blue/cyan mesh
  default: 'from-[#17171c] via-[#2a2a35] to-[#0c0c0f]', // modern dark obsidian graphite
};

export function getBankColorClass(bank: string): string {
  const normalized = bank.toLowerCase().split(' ')[0]; // Handle "Yes Bank" -> "yes"
  return BANK_COLORS[normalized] || BANK_COLORS['default'];
}

export const BANKS = ['HDFC', 'SBI', 'ICICI', 'Axis', 'Kotak', 'Yes Bank', 'IDFC', 'PNB', 'BOB', 'Canara'];
