import { useEffect } from 'react';
import { useContactsStore } from '../store/contactsStore';
import { useScraperQueue } from '../store/scraperQueueStore';
import { CONTACTS_PAGE_URL, contactsFetcherJS } from '../api/fetchContacts';

export function useContacts() {
  const { loading, lastFetched, setLoading } = useContactsStore();
  const enqueueScrape = useScraperQueue((s) => s.enqueueScrape);

  function load() {
    setLoading(true);
    enqueueScrape({ id: 'contacts', url: CONTACTS_PAGE_URL, scraperJs: contactsFetcherJS, expectedType: 'CONTACTS_DATA' });
  }

  useEffect(() => {
    const stale = !lastFetched || Date.now() - lastFetched > 5 * 60 * 1000;
    if (stale && !loading) load();
  }, []);

  return { refresh: load };
}
