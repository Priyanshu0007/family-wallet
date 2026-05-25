export const SEED_CARDS = [
  { bank: "HDFC", variant: "Infinia", type: "Credit", number: "4111111111111111", expiry: "12/26", cvv: "123", holder: "Manu Jindal", rewardPoints: 24500, pointValue: 1.00, limit: 1000000, usedCredit: 150000, dueDateDay: 15 },
].map(c => {
  let network = "Unknown";
  if (c.number.startsWith('4')) network = 'Visa';
  else if (/^5[1-5]/.test(c.number)) network = 'Mastercard';
  else if (/^3[47]/.test(c.number)) network = 'Amex';
  else if (c.number.startsWith('6')) network = 'RuPay';
  
  return { ...c, network, color: c.bank.toLowerCase() };
});

export const SEED_FAMILY = [
  { name: 'Manu Jindal', relation: 'Self', color: '#3b82f6' }
];
