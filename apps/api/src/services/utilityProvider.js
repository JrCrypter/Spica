function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomRef(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
}

export async function fetchBill({ billerCode, accountNumber }) {
  await delay(300);
  const amount = 89900 + (accountNumber?.length || 0) * 100;
  return {
    billerCode,
    accountNumber,
    customerName: 'Utility Customer',
    amountCents: amount,
    currency: 'inr',
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    billRef: randomRef('BILL')
  };
}

export async function payBill({ billerCode, accountNumber, amountCents }) {
  await delay(400);
  return {
    success: true,
    providerReference: randomRef('BBPS'),
    billerCode,
    accountNumber,
    amountCents
  };
}

export async function rechargeMobile({ operatorCode, mobileNumber, amountCents }) {
  await delay(300);
  return {
    success: true,
    providerReference: randomRef('RCHG'),
    operatorCode,
    mobileNumber,
    amountCents
  };
}
