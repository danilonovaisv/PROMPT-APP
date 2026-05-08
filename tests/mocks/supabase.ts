import { jest } from "@jest/globals";

export const isSupabaseConfigured = false;
export const missingSupabaseVars = ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"];
export const supabaseConfigErrorMessage = "Supabase is mocked for tests.";
export const assertSupabaseConfigured = jest.fn();

export const supabase = {
  auth: {
    getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
  })),
};
