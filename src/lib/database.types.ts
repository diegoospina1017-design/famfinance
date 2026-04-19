export type Kind = 'expense' | 'income';
export type Split = 'personal' | 'shared';

export interface Profile {
  id: string;
  household_id: string | null;
  display_name: string;
  created_at: string;
}

export interface Household {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
}

export interface Category {
  id: string;
  household_id: string;
  name: string;
  color: string;
  budget_monthly: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  household_id: string;
  user_id: string;
  category_id: string | null;
  kind: Kind;
  split: Split;
  amount: number;
  date: string;
  note: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      households: { Row: Household; Insert: Partial<Household>; Update: Partial<Household> };
      categories: { Row: Category; Insert: Partial<Category>; Update: Partial<Category> };
      transactions: {
        Row: Transaction;
        Insert: Partial<Transaction>;
        Update: Partial<Transaction>;
      };
    };
  };
}
