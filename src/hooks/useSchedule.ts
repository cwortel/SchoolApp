import { useEffect } from 'react';
import { useScheduleStore } from '../store/scheduleStore';
import { useScraperQueue } from '../store/scraperQueueStore';
import { getScheduleApiUrl, scheduleFetcherJS } from '../api/fetchSchedule';

export function useSchedule() {
  const { loading, lastFetched, setLoading } = useScheduleStore();
  const enqueueScrape = useScraperQueue((s) => s.enqueueScrape);

  function load() {
    setLoading(true);
    enqueueScrape({ id: 'schedule', url: getScheduleApiUrl(), scraperJs: scheduleFetcherJS, expectedType: 'SCHEDULE_DATA' });
  }

  useEffect(() => {
    const stale = !lastFetched || Date.now() - lastFetched > 5 * 60 * 1000;
    if (stale && !loading) load();
  }, []);

  return { refresh: load };
}
