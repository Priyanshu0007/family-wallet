export const SEED_CARDS = [
  { bank: "HDFC", variant: "Infinia", type: "Credit", number: "4111111111111111", expiry: "12/26", cvv: "123", holder: "Manu Jindal", rewardPoints: 24500, pointValue: 1.00 },
  { bank: "HDFC", variant: "Regalia", type: "Credit", number: "4222222222222222", expiry: "03/25", cvv: "456", holder: "Sushma Jindal", rewardPoints: 18200, pointValue: 0.50 },
  { bank: "SBI", variant: "SimplyCLICK", type: "Credit", number: "5111111111111111", expiry: "08/27", cvv: "789", holder: "Manu Jindal", rewardPoints: 7850, pointValue: 0.25 },
  { bank: "ICICI", variant: "Amazon Pay", type: "Credit", number: "5222222222222222", expiry: "11/24", cvv: "321", holder: "Ankita", rewardPoints: 12300, pointValue: 0.20 },
  { bank: "Axis", variant: "Magnus", type: "Credit", number: "4333333333333333", expiry: "06/26", cvv: "654", holder: "Manu Jindal", rewardPoints: 15600, pointValue: 0.50 },
  { bank: "Kotak", variant: "811", type: "Debit", number: "6111111111111111", expiry: "09/25", cvv: "987", holder: "Sushma Jindal", rewardPoints: 1200, pointValue: 0.10 },
  { bank: "Yes Bank", variant: "Marquee", type: "Credit", number: "4444444444444444", expiry: "01/27", cvv: "147", holder: "Ankita", rewardPoints: 9400, pointValue: 0.25 },
  { bank: "IDFC", variant: "Wealth", type: "Credit", number: "5333333333333333", expiry: "04/26", cvv: "258", holder: "Manu Jindal", rewardPoints: 6200, pointValue: 0.25 },
  { bank: "SBI", variant: "Platinum", type: "Debit", number: "6222222222222222", expiry: "07/28", cvv: "369", holder: "Sushma Jindal", rewardPoints: 1850, pointValue: 0.15 },
  { bank: "HDFC", variant: "MoneyBack+", type: "Credit", number: "4555555555555555", expiry: "10/25", cvv: "741", holder: "Ankita", rewardPoints: 5600, pointValue: 0.20 },
  { bank: "ICICI", variant: "Sapphiro", type: "Credit", number: "3411111111111111", expiry: "02/27", cvv: "852", holder: "Manu Jindal", rewardPoints: 21000, pointValue: 0.50 },
  { bank: "Axis", variant: "Neo", type: "Debit", number: "6333333333333333", expiry: "05/26", cvv: "963", holder: "Sushma Jindal", rewardPoints: 800, pointValue: 0.10 },
  { bank: "Kotak", variant: "League Platinum", type: "Credit", number: "5444444444444444", expiry: "08/28", cvv: "159", holder: "Ankita", rewardPoints: 11200, pointValue: 0.35 },
  { bank: "PNB", variant: "RuPay Classic", type: "Debit", number: "6444444444444444", expiry: "11/26", cvv: "357", holder: "Manu Jindal", rewardPoints: 650, pointValue: 0.10 },
  { bank: "BOB", variant: "Eterna", type: "Credit", number: "5555555555555551", expiry: "01/25", cvv: "468", holder: "Sushma Jindal", rewardPoints: 3400, pointValue: 0.30 },
  { bank: "Canara", variant: "RuPay Select", type: "Debit", number: "6555555555555555", expiry: "03/27", cvv: "579", holder: "Ankita", rewardPoints: 950, pointValue: 0.10 },
  { bank: "HDFC", variant: "Diners Club Black", type: "Credit", number: "3711111111111111", expiry: "06/28", cvv: "6819", holder: "Manu Jindal", rewardPoints: 19800, pointValue: 1.00 },
  { bank: "ICICI", variant: "Coral", type: "Credit", number: "4666666666666666", expiry: "09/26", cvv: "234", holder: "Sushma Jindal", rewardPoints: 4700, pointValue: 0.25 },
  { bank: "SBI", variant: "IRCTC", type: "Credit", number: "5666666666666666", expiry: "12/27", cvv: "345", holder: "Ankita", rewardPoints: 3200, pointValue: 0.25 },
  { bank: "Axis", variant: "Flipkart", type: "Credit", number: "4777777777777777", expiry: "02/26", cvv: "456", holder: "Manu Jindal", rewardPoints: 8900, pointValue: 0.30 },
  { bank: "Yes Bank", variant: "FinBooster", type: "Debit", number: "6666666666666666", expiry: "04/28", cvv: "567", holder: "Sushma Jindal", rewardPoints: 1500, pointValue: 0.15 },
  { bank: "IDFC", variant: "First Select", type: "Credit", number: "4888888888888888", expiry: "07/25", cvv: "678", holder: "Ankita", rewardPoints: 4100, pointValue: 0.25 },
  { bank: "Kotak", variant: "Mojo Platinum", type: "Credit", number: "5777777777777777", expiry: "10/27", cvv: "789", holder: "Manu Jindal", rewardPoints: 13500, pointValue: 0.35 },
  { bank: "HDFC", variant: "Millennia", type: "Debit", number: "4999999999999999", expiry: "01/26", cvv: "890", holder: "Sushma Jindal", rewardPoints: 2100, pointValue: 0.15 }
].map(c => {
  let network = "Unknown";
  if (c.number.startsWith('4')) network = 'Visa';
  else if (/^5[1-5]/.test(c.number)) network = 'Mastercard';
  else if (/^3[47]/.test(c.number)) network = 'Amex';
  else if (c.number.startsWith('6')) network = 'RuPay';
  
  return { ...c, network, color: c.bank.toLowerCase() };
});

export const SEED_FAMILY = [
  { name: 'Manu Jindal', relation: 'Self', color: '#3b82f6' },
  { name: 'Sushma Jindal', relation: 'Spouse', color: '#ec4899' },
  { name: 'Ankita', relation: 'Daughter', color: '#8b5cf6' }
];
