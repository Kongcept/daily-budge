import { supabase } from './supabaseClient';

const STORAGE_KEYS = {
  TRANSACTIONS: 'fintrack_transactions',
  LOANS: 'fintrack_loans',
  PLANNED: 'fintrack_planned',
  ACCOUNTS: 'fintrack_accounts'
};

const USER_ID = 'default_user'; // Hardcoded for single-user for now

const isSupabaseConfigured = () => {
  return supabase.supabaseUrl !== 'https://placeholder.supabase.co' && supabase.supabaseKey !== 'placeholder';
};

export const db = {
  // We now return promises for all get/save operations
  getTransactions: async () => {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('app_state').select('transactions').eq('id', USER_ID).single();
      if (!error && data?.transactions) return data.transactions;
    }
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || '[]');
  },
  saveTransactions: async (data) => {
    if (isSupabaseConfigured()) {
      await supabase.from('app_state').upsert({ id: USER_ID, transactions: data });
    }
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(data));
  },
  
  getLoans: async () => {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('app_state').select('loans').eq('id', USER_ID).single();
      if (!error && data?.loans) return data.loans;
    }
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.LOANS) || '[]');
  },
  saveLoans: async (data) => {
    if (isSupabaseConfigured()) {
      await supabase.from('app_state').upsert({ id: USER_ID, loans: data });
    }
    localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(data));
  },

  getPlannedPayments: async () => {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('app_state').select('planned_payments').eq('id', USER_ID).single();
      if (!error && data?.planned_payments) return data.planned_payments;
    }
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PLANNED) || '[]');
  },
  savePlannedPayments: async (data) => {
    if (isSupabaseConfigured()) {
      await supabase.from('app_state').upsert({ id: USER_ID, planned_payments: data });
    }
    localStorage.setItem(STORAGE_KEYS.PLANNED, JSON.stringify(data));
  },
  
  getAccounts: async () => {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.from('app_state').select('accounts').eq('id', USER_ID).single();
      if (!error && data?.accounts) return data.accounts;
    }
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ACCOUNTS) || '[]');
  },
  saveAccounts: async (data) => {
    if (isSupabaseConfigured()) {
      await supabase.from('app_state').upsert({ id: USER_ID, accounts: data });
    }
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(data));
  },

  resetDatabase: async () => {
    if (isSupabaseConfigured()) {
      await supabase.from('app_state').delete().eq('id', USER_ID);
    }
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    window.location.reload();
  }
};
