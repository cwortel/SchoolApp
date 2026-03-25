/**
 * ScraperWebView
 *
 * An invisible (0×0) WebView that sits at the root of the app.
 * It watches the Zustand scraper queue, loads the requested URL,
 * injects the scraper JS once the page finishes loading, then
 * routes the resulting message to the appropriate store.
 *
 * Only one scrape runs at a time; further requests queue in Zustand
 * and are picked up as soon as the WebView becomes idle.
 */
import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import WebView, { WebViewMessageEvent } from 'react-native-webview';
import { useScraperQueue } from '../store/scraperQueueStore';
import { useScheduleStore } from '../store/scheduleStore';
import { useGradesStore } from '../store/gradesStore';
import { useAbsencesStore } from '../store/absencesStore';
import { useContactsStore } from '../store/contactsStore';
import { ScraperMessage, Lesson, Grade, AttendanceRecord, Contact } from '../types';

export function ScraperWebView() {
  const pending = useScraperQueue((s) => s.queue[0] ?? null);
  const dequeue = useScraperQueue((s) => s.dequeue);

  const setLessons    = useScheduleStore((s) => s.setLessons);
  const setScheduleError = useScheduleStore((s) => s.setError);
  const setGradesData  = useGradesStore((s) => s.setGradesData);
  const setGradesError = useGradesStore((s) => s.setError);
  const setAbsences  = useAbsencesStore((s) => s.setAbsences);
  const setAbsencesError = useAbsencesStore((s) => s.setError);
  const setContacts  = useContactsStore((s) => s.setContacts);
  const setContactsError = useContactsStore((s) => s.setError);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      let msg: ScraperMessage;
      try {
        msg = JSON.parse(event.nativeEvent.data);
      } catch {
        return;
      }

      switch (msg.type) {
        case 'SCHEDULE_DATA':
          setLessons(msg.payload as Lesson[]);
          break;
        case 'GRADES_DATA':
          setGradesData(msg.payload as { modules: Grade[]; exams: Grade[] });
          break;
        case 'ABSENCES_DATA':
          setAbsences(msg.payload as AttendanceRecord[]);
          break;
        case 'CONTACTS_DATA':
          setContacts(msg.payload as Contact[]);
          break;
        case 'SCRAPE_ERROR':
          const errMsg = `Scrape fout (${msg.source}): ${msg.message}`;
          if (pending?.id === 'schedule') setScheduleError(errMsg);
          else if (pending?.id === 'grades') setGradesError(errMsg);
          else if (pending?.id === 'absences') setAbsencesError(errMsg);
          else if (pending?.id === 'contacts') setContactsError(errMsg);
          break;
        default:
          return; // not for us
      }
      dequeue();
    },
    [pending]
  );

  if (!pending) return null;

  return (
    <View style={styles.offscreen}>
      <WebView
        key={String(pending.requestId ?? pending.id)}
        source={{ uri: pending.url }}
        injectedJavaScript={pending.scraperJs + '\ntrue;'}
        onMessage={handleMessage}
        sharedCookiesEnabled
        domStorageEnabled
        javaScriptEnabled
        limitsNavigationsToAppBoundDomains
        style={styles.webview}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  offscreen: {
    position: 'absolute',
    top: -2000,
    left: -2000,
    width: 375,
    height: 812,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
  },
});
