import { useEffect } from 'react';
import { useAbsencesStore } from '../store/absencesStore';
import { useScraperQueue } from '../store/scraperQueueStore';
import { ABSENCES_API_URL, absencesFetcherJS } from '../api/fetchAbsences';

export function useAbsences() {
  const { loading, lastFetched, setLoading } = useAbsencesStore();
  const enqueueScrape = useScraperQueue((s) => s.enqueueScrape);

  function load() {
    setLoading(true);
    enqueueScrape({ id: 'absences', url: ABSENCES_API_URL, scraperJs: absencesFetcherJS, expectedType: 'ABSENCES_DATA' });
  }

  useEffect(() => {
    const stale = !lastFetched || Date.now() - lastFetched > 5 * 60 * 1000;
    if (stale && !loading) load();
  }, []);

  return { refresh: load };
}
