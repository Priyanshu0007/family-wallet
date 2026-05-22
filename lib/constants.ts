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

export const PREMIUM_THEMES = [
  { id: 'obsidian', name: 'Obsidian Matte', value: 'from-[#141419] via-[#242430] to-[#0f0f13]' },
  { id: 'sapphire', name: 'Sapphire Blue', value: 'from-[#0b1b3d] via-[#1c356b] to-[#0a142c]' },
  { id: 'emerald', name: 'Forest Emerald', value: 'from-[#09291b] via-[#134d35] to-[#081811]' },
  { id: 'ruby', name: 'Crimson Ruby', value: 'from-[#360a0d] via-[#5c1318] to-[#210608]' },
  { id: 'gold', name: 'Copper Gold', value: 'from-[#2e1d0c] via-[#4d3215] to-[#1a1005]' },
  { id: 'amethyst', name: 'Sunset Amethyst', value: 'from-[#220c30] via-[#3f185c] to-[#150720]' },
  { id: 'silver', name: 'Platinum Silver', value: 'from-[#3c3c43] via-[#575764] to-[#2c2c33]' },
  { id: 'sunset', name: 'Neon Sunset', value: 'from-[#3b122d] via-[#631c3e] to-[#240b1b]' }
];
