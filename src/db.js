const STORAGE_KEYS = {
  TRANSACTIONS: 'fintrack_transactions',
  LOANS: 'fintrack_loans',
  PLANNED: 'fintrack_planned'
};

export const db = {
  getTransactions: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || '[]'),
  saveTransactions: (data) => localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(data)),
  
  getLoans: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.LOANS) || '[]'),
  saveLoans: (data) => localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(data)),

  getPlannedPayments: () => JSON.parse(localStorage.getItem(STORAGE_KEYS.PLANNED) || '[]'),
  savePlannedPayments: (data) => localStorage.setItem(STORAGE_KEYS.PLANNED, JSON.stringify(data)),
  
  resetDatabase: () => {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    window.location.reload();
  }
};
