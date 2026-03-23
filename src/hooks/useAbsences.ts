import { useEffect } from 'react';
import { useAbsencesStore } from '../store/absencesStore';
import { useScraperQueue } from '../store/scraperQueueStore';
import { ABSENCES_URL, absencesScraperJS } from '../scrapers/scrapeAbsences';

export function useAbsences() {
  const { loading, lastFetched, setLoading } = useAbsencesStore();
  const enqueueScrape = useScraperQueue((s) => s.enqueueScrape);

  function fetch() {
    setLoading(true);
    enqueueScrape({
      id: 'absences',
      url: ABSENCES_URL,
      scraperJs: absencesScraperJS,
      expectedType: 'ABSENCES_DATA',
    });
  }

  useEffect(() => {
    const stale = !lastFetched || Date.now() - lastFetched > 5 * 60 * 1000;
    if (stale && !loading) fetch();
  }, []);

  return { refresh: fetch };
}
