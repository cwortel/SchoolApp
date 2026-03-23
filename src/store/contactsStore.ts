import { create } from 'zustand';
import { Contact } from '../types';

interface ContactsState {
  contacts: Contact[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  setContacts: (contacts: Contact[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useContactsStore = create<ContactsState>((set) => ({
  contacts: [],
  loading: false,
  error: null,
  lastFetched: null,
  setContacts: (contacts) => set({ contacts, loading: false, error: null, lastFetched: Date.now() }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
}));
