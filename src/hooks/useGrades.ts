import { useEffect } from 'react';
import { useGradesStore } from '../store/gradesStore';
import { useScraperQueue } from '../store/scraperQueueStore';
import { GRADES_API_URL, gradesFetcherJS } from '../api/fetchGrades';

export function useGrades() {
  const { loading, lastFetched, setLoading } = useGradesStore();
  const enqueueScrape = useScraperQueue((s) => s.enqueueScrape);

  function load() {
    setLoading(true);
    enqueueScrape({ id: 'grades', url: GRADES_API_URL, scraperJs: gradesFetcherJS, expectedType: 'GRADES_DATA' });
  }

  useEffect(() => {
    const stale = !lastFetched || Date.now() - lastFetched > 5 * 60 * 1000;
    if (stale && !loading) load();
  }, []);

  return { refresh: load };
}
