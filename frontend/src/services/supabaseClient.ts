/**
 * NIRANTAR — Frontend Supabase Client & Persistence Bridge
 * ========================================================
 * Provides real-time and REST sync for Citizen Profile, Tickets,
 * Saved Passengers, Wallet transactions, and Notes table.
 * Falls back safely to local storage if Supabase credentials are not yet set.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const getSupabaseConfig = () => {
  const url =
    (import.meta as any).env?.VITE_SUPABASE_URL ||
    (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL ||
    (import.meta as any).env?.SUPABASE_URL ||
    '';

  const anonKey =
    (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
    (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    (import.meta as any).env?.SUPABASE_PUBLISHABLE_KEY ||
    '';

  return { url, anonKey };
};

const config = getSupabaseConfig();

export const isSupabaseConfigured = (): boolean => {
  return Boolean(config.url && config.anonKey);
};

export const supabase: SupabaseClient | null = isSupabaseConfigured()
  ? createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export interface SupabaseNote {
  id?: number;
  title: string;
}

export interface SupabaseUserPayload {
  id: string;
  display_name: string;
  username: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  wallet_balance?: number;
  preferences?: Record<string, any>;
}

export interface SupabaseTicketPayload {
  id?: string;
  user_id?: string;
  pnr_number: string;
  train_number: string;
  train_name: string;
  from_station_code: string;
  from_station_name: string;
  to_station_code: string;
  to_station_name: string;
  travel_date: string;
  class_code: string;
  fare: number;
  status: string;
  passengers: any[];
}

/**
 * Fetch notes (Quickstart table)
 */
export const fetchNotesFromSupabase = async (): Promise<SupabaseNote[]> => {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.from('notes').select('*');
    if (error) {
      console.warn('Supabase notes fetch warning:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('Supabase offline or table not found:', err);
    return [];
  }
};

/**
 * Sync Citizen User Profile to Supabase
 */
export const syncUserToSupabase = async (user: SupabaseUserPayload): Promise<boolean> => {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('users').upsert([user], { onConflict: 'username' });
    if (error) {
      console.warn('Supabase syncUser warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase user sync error:', err);
    return false;
  }
};

/**
 * Sync Confirmed Ticket Record to Supabase
 */
export const syncTicketToSupabase = async (ticket: SupabaseTicketPayload): Promise<boolean> => {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('user_tickets').upsert([ticket], { onConflict: 'pnr_number' });
    if (error) {
      console.warn('Supabase syncTicket warning:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase ticket sync error:', err);
    return false;
  }
};

/**
 * Fetch User Tickets from Supabase
 */
export const fetchUserTicketsFromSupabase = async (userId: string): Promise<SupabaseTicketPayload[]> => {
  if (!supabase || !userId) return [];
  try {
    const { data, error } = await supabase
      .from('user_tickets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetchTickets warning:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.warn('Supabase ticket fetch error:', err);
    return [];
  }
};
