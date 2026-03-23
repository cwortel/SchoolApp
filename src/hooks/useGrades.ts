import { useEffect } from 'react';
import { useGradesStore } from '../store/gradesStore';
import { useScraperQueue } from '../store/scraperQueueStore';
import { GRADES_URL, gradesScraperJS } from '../scrapers/scrapeGrades';

export function useGrades() {
  const { loading, lastFetched, setLoading } = useGradesStore();
  const enqueueScrape = useScraperQueue((s) => s.enqueueScrape);

  function fetch() {
    setLoading(true);
    enqueueScrape({
      id: 'grades',
      url: GRADES_URL,
      scraperJs: gradesScraperJS,
      expectedType: 'GRADES_DATA',
    });
  }

  useEffect(() => {
    const stale = !lastFetched || Date.now() - lastFetched > 5 * 60 * 1000;
    if (stale && !loading) fetch();
  }, []);

  return { refresh: fetch };
}
