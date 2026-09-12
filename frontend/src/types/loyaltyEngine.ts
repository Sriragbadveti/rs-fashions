export interface CustomerCreditAccount {
  phone: string;
  name: string;
  storeCreditBalance: number; // Positive = advance deposit/credit, Negative = khata due
  lastUpdated: string;
}

const CREDIT_STORAGE_KEY = "rs_fashions_customer_credits";

export function loadCustomerCredits(): Record<string, CustomerCreditAccount> {
  try {
    const saved = localStorage.getItem(CREDIT_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Failed to load customer credits", e);
  }
  return {
    "9876543210": {
      phone: "+91 98765 43210",
      name: "Smt. Kamala Reddy",
      storeCreditBalance: 5000,
      lastUpdated: new Date().toISOString(),
    },
    "9123456789": {
      phone: "+91 91234 56789",
      name: "Dr. Ananya Rao",
      storeCreditBalance: -2500,
      lastUpdated: new Date().toISOString(),
    },
  };
}

export function saveCustomerCredit(phone: string, name: string, balanceDelta: number, isAbsolute: boolean = false) {
  const accounts = loadCustomerCredits();
  const cleanPhone = phone.replace(/\D/g, "").slice(-10);

  if (!accounts[cleanPhone]) {
    accounts[cleanPhone] = {
      phone: cleanPhone,
      name,
      storeCreditBalance: balanceDelta,
      lastUpdated: new Date().toISOString(),
    };
  } else {
    accounts[cleanPhone].name = name;
    accounts[cleanPhone].storeCreditBalance = isAbsolute 
      ? balanceDelta 
      : accounts[cleanPhone].storeCreditBalance + balanceDelta;
    accounts[cleanPhone].lastUpdated = new Date().toISOString();
  }

  localStorage.setItem(CREDIT_STORAGE_KEY, JSON.stringify(accounts));
  return accounts[cleanPhone];
}

export function deleteCustomerCredit(phone: string) {
  const accounts = loadCustomerCredits();
  const cleanPhone = phone.replace(/\D/g, "").slice(-10);
  delete accounts[cleanPhone];
  localStorage.setItem(CREDIT_STORAGE_KEY, JSON.stringify(accounts));
  return accounts;
}