import { useEffect } from 'react';
import { useContactsStore } from '../store/contactsStore';
import { useScraperQueue } from '../store/scraperQueueStore';
import { CONTACTS_URL, contactsScraperJS } from '../scrapers/scrapeContacts';

export function useContacts() {
  const { loading, lastFetched, setLoading } = useContactsStore();
  const enqueueScrape = useScraperQueue((s) => s.enqueueScrape);

  function fetch() {
    setLoading(true);
    enqueueScrape({
      id: 'contacts',
      url: CONTACTS_URL,
      scraperJs: contactsScraperJS,
      expectedType: 'CONTACTS_DATA',
    });
  }

  useEffect(() => {
    const stale = !lastFetched || Date.now() - lastFetched > 5 * 60 * 1000;
    if (stale && !loading) fetch();
  }, []);

  return { refresh: fetch };
}
