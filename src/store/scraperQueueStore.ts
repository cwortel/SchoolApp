/**
 * Central scraper queue store.
 *
 * Screens dispatch a scrape request by calling `enqueueScrape()`.
 * The <ScraperWebView> component subscribes to this store, picks up the
 * pending request, loads the URL, injects the JS, and clears the queue
 * when done.
 */
import { create } from 'zustand';
import { ScrapeRequest } from '../types';

interface ScraperQueueState {
  queue: ScrapeRequest[];
  enqueueScrape: (request: ScrapeRequest) => void;
  dequeue: () => void;
}

export const useScraperQueue = create<ScraperQueueState>((set) => ({
  queue: [],
  enqueueScrape: (request) =>
    set((state) => {
      // Deduplicate by id — don't add if already queued or currently running
      if (state.queue.some((r) => r.id === request.id)) return state;
      return { queue: [...state.queue, request] };
    }),
  dequeue: () => set((state) => ({ queue: state.queue.slice(1) })),
}));
