export const SEED_CARDS = [
  { bank: "HDFC", variant: "Infinia", type: "Credit", number: "4111111111111111", expiry: "12/26", cvv: "123", holder: "Manu Jindal" },
  { bank: "HDFC", variant: "Regalia", type: "Credit", number: "4222222222222222", expiry: "03/25", cvv: "456", holder: "Sushma Jindal" },
  { bank: "SBI", variant: "SimplyCLICK", type: "Credit", number: "5111111111111111", expiry: "08/27", cvv: "789", holder: "Manu Jindal" },
  { bank: "ICICI", variant: "Amazon Pay", type: "Credit", number: "5222222222222222", expiry: "11/24", cvv: "321", holder: "Ankita" },
  { bank: "Axis", variant: "Magnus", type: "Credit", number: "4333333333333333", expiry: "06/26", cvv: "654", holder: "Manu Jindal" },
  { bank: "Kotak", variant: "811", type: "Debit", number: "6111111111111111", expiry: "09/25", cvv: "987", holder: "Sushma Jindal" },
  { bank: "Yes Bank", variant: "Marquee", type: "Credit", number: "4444444444444444", expiry: "01/27", cvv: "147", holder: "Ankita" },
  { bank: "IDFC", variant: "Wealth", type: "Credit", number: "5333333333333333", expiry: "04/26", cvv: "258", holder: "Manu Jindal" },
  { bank: "SBI", variant: "Platinum", type: "Debit", number: "6222222222222222", expiry: "07/28", cvv: "369", holder: "Sushma Jindal" },
  { bank: "HDFC", variant: "MoneyBack+", type: "Credit", number: "4555555555555555", expiry: "10/25", cvv: "741", holder: "Ankita" },
  { bank: "ICICI", variant: "Sapphiro", type: "Credit", number: "3411111111111111", expiry: "02/27", cvv: "852", holder: "Manu Jindal" },
  { bank: "Axis", variant: "Neo", type: "Debit", number: "6333333333333333", expiry: "05/26", cvv: "963", holder: "Sushma Jindal" },
  { bank: "Kotak", variant: "League Platinum", type: "Credit", number: "5444444444444444", expiry: "08/28", cvv: "159", holder: "Ankita" },
  { bank: "PNB", variant: "RuPay Classic", type: "Debit", number: "6444444444444444", expiry: "11/26", cvv: "357", holder: "Manu Jindal" },
  { bank: "BOB", variant: "Eterna", type: "Credit", number: "5555555555555551", expiry: "01/25", cvv: "468", holder: "Sushma Jindal" },
  { bank: "Canara", variant: "RuPay Select", type: "Debit", number: "6555555555555555", expiry: "03/27", cvv: "579", holder: "Ankita" },
  { bank: "HDFC", variant: "Diners Club Black", type: "Credit", number: "3711111111111111", expiry: "06/28", cvv: "6819", holder: "Manu Jindal" },
  { bank: "ICICI", variant: "Coral", type: "Credit", number: "4666666666666666", expiry: "09/26", cvv: "234", holder: "Sushma Jindal" },
  { bank: "SBI", variant: "IRCTC", type: "Credit", number: "5666666666666666", expiry: "12/27", cvv: "345", holder: "Ankita" },
  { bank: "Axis", variant: "Flipkart", type: "Credit", number: "4777777777777777", expiry: "02/26", cvv: "456", holder: "Manu Jindal" },
  { bank: "Yes Bank", variant: "FinBooster", type: "Debit", number: "6666666666666666", expiry: "04/28", cvv: "567", holder: "Sushma Jindal" },
  { bank: "IDFC", variant: "First Select", type: "Credit", number: "4888888888888888", expiry: "07/25", cvv: "678", holder: "Ankita" },
  { bank: "Kotak", variant: "Mojo Platinum", type: "Credit", number: "5777777777777777", expiry: "10/27", cvv: "789", holder: "Manu Jindal" },
  { bank: "HDFC", variant: "Millennia", type: "Debit", number: "4999999999999999", expiry: "01/26", cvv: "890", holder: "Sushma Jindal" }
].map(c => {
  let network = "Unknown";
  if (c.number.startsWith('4')) network = 'Visa';
  else if (/^5[1-5]/.test(c.number)) network = 'Mastercard';
  else if (/^3[47]/.test(c.number)) network = 'Amex';
  else if (c.number.startsWith('6')) network = 'RuPay';
  
  return { ...c, network, color: c.bank.toLowerCase() };
});
