import { useEffect } from 'react';
import { useScheduleStore } from '../store/scheduleStore';
import { useScraperQueue } from '../store/scraperQueueStore';
import { SCHEDULE_URL, scheduleScraperJS } from '../scrapers/scrapeSchedule';

export function useSchedule() {
  const { loading, lastFetched, setLoading } = useScheduleStore();
  const enqueueScrape = useScraperQueue((s) => s.enqueueScrape);

  function fetch() {
    setLoading(true);
    enqueueScrape({
      id: 'schedule',
      url: SCHEDULE_URL,
      scraperJs: scheduleScraperJS,
      expectedType: 'SCHEDULE_DATA',
    });
  }

  useEffect(() => {
    // Fetch on mount if we have no data or data is stale (> 5 min)
    const stale = !lastFetched || Date.now() - lastFetched > 5 * 60 * 1000;
    if (stale && !loading) fetch();
  }, []);

  return { refresh: fetch };
}
