import { Contact } from '../types';

const CONTACTS_URL = 'https://mijn.calderacademie.nl/edu_pages/contactinfo';

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '');
}

function decodeEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function normalize(html: string): string {
  return decodeEntities(stripTags(html)).replace(/\s+/g, ' ').trim();
}

export async function fetchContacts(): Promise<Contact[]> {
  const response = await fetch(CONTACTS_URL, { credentials: 'include' });
  if (!response.ok) {
    throw new Error(`Ophalen contacten mislukt: HTTP ${response.status}`);
  }
  const html = await response.text();

  // The contacts live inside a shadow DOM template literal in a <script> block
  const shadowMatch = html.match(/shadow\.innerHTML\s*=\s*`([\s\S]*?)`\s*;/);
  if (!shadowMatch) {
    throw new Error('Contactpagina heeft onverwachte structuur');
  }
  const shadowHtml = shadowMatch[1];

  const contacts: Contact[] = [];
  let currentSection = '';

  // Process each <p> element
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let match: RegExpExecArray | null;

  while ((match = pRegex.exec(shadowHtml)) !== null) {
    const pContent = match[1];
    const plainText = normalize(pContent);
    if (!plainText) continue;

    // Detect section header: a <b> whose text equals the entire paragraph text, ≤ 8 chars
    const boldMatch = pContent.match(/<b[^>]*>([\s\S]*?)<\/b>/i);
    if (boldMatch) {
      const boldText = normalize(boldMatch[1]);
      if (boldText === plainText && boldText.length <= 8) {
        currentSection = boldText;
        continue;
      }
    }

    // Only process paragraphs that contain a mailto link
    const emailMatch = pContent.match(/href="mailto:([^"]+)"/i);
    if (!emailMatch) continue;
    const email = emailMatch[1].trim();

    // Decode entities and strip tags, then split on 2+ consecutive spaces
    // to separate: [year, location, "Name (email)"]
    const rawText = decodeEntities(stripTags(pContent));
    const parts = rawText
      .split(/\s{2,}/)
      .map((s) => s.replace(/\s+/g, ' ').trim())
      .filter(Boolean);

    let name = '';
    let year = '';
    let location = '';

    const cleanName = (s: string) => s.replace(/\(.*?\)/g, '').trim();

    if (parts.length >= 3) {
      year = parts[0];
      location = parts[1];
      name = cleanName(parts[2]);
    } else if (parts.length === 2) {
      year = parts[0];
      name = cleanName(parts[1]);
    } else if (parts.length === 1) {
      // Unstructured paragraph (e.g. "...contact opnemen met Jan Willem van Eijk (...)")
      // Extract name as the text immediately before the (email) paren
      const beforeParen = parts[0].replace(/\(.*?\)\s*$/, '').trim();
      // Take only the last sentence fragment after the last full stop or comma
      const lastChunk = beforeParen.split(/[.,;]/).pop()?.trim() ?? '';
      name = lastChunk.length > 2 && lastChunk.length < 60 ? lastChunk : '';
    }

    if (name) {
      contacts.push({
        name,
        role: currentSection,
        year: year || undefined,
        location: location || undefined,
        email,
      });
    }
  }

  return contacts;
}

export const CONTACTS_PAGE_URL = 'https://mijn.calderacademie.nl/edu_pages/contactinfo';

/**
 * Injected into ScraperWebView after it navigates directly to CONTACTS_PAGE_URL.
 * Reads inline <script> text content to find the shadow.innerHTML template literal,
 * then parses contacts from it. No fetch() needed — WebView IS already on the page.
 */
export const contactsFetcherJS = `
(function() {
  try {
    var scripts = document.querySelectorAll('script');
    var src = '';
    for (var i = 0; i < scripts.length; i++) { src += scripts[i].textContent || ''; }
    function stripTags(h) { return h.replace(/<[^>]+>/g, ''); }
    function decode(t) {
      return t.replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'");
    }
    function norm(h) { return decode(stripTags(h)).replace(/\\s+/g, ' ').trim(); }
    function cleanName(s) { return s.replace(/\\(.*?\\)/g, '').trim(); }
    var sm = src.match(/shadow\\.innerHTML\\s*=\\s*\`([\\s\\S]*?)\`\\s*;/);
    if (!sm) throw new Error('Contactpagina heeft onverwachte structuur');
    var sh = sm[1];
    var contacts = [];
    var section = '';
    var pRe = /<p[^>]*>([\\s\\S]*?)<\\/p>/gi;
    var m;
    while ((m = pRe.exec(sh)) !== null) {
      var pc = m[1];
      var pt = norm(pc);
      if (!pt) continue;
      var bm = pc.match(/<b[^>]*>([\\s\\S]*?)<\\/b>/i);
      if (bm) { var bt = norm(bm[1]); if (bt === pt && bt.length <= 8) { section = bt; continue; } }
      var em = pc.match(/href="mailto:([^"]+)"/i);
      if (!em) continue;
      var email = em[1].trim();
      var raw = decode(stripTags(pc));
      var parts = raw.split(/\\s{2,}/).map(function(s) { return s.replace(/\\s+/g, ' ').trim(); }).filter(Boolean);
      var name = '', year = '', loc = '';
      if (parts.length >= 3) { year = parts[0]; loc = parts[1]; name = cleanName(parts[2]); }
      else if (parts.length === 2) { year = parts[0]; name = cleanName(parts[1]); }
      else if (parts.length === 1) {
        var bp = parts[0].replace(/\\(.*?\\)\\s*$/, '').trim();
        var ch = bp.split(/[.,;]/);
        var lc = ch[ch.length - 1] ? ch[ch.length - 1].trim() : '';
        name = (lc.length > 2 && lc.length < 60) ? lc : '';
      }
      if (name) contacts.push({ name: name, role: section, year: year || undefined, location: loc || undefined, email: email });
    }
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'CONTACTS_DATA', payload: contacts }));
  } catch(e) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SCRAPE_ERROR', source: 'contacts', message: String(e && e.message ? e.message : e) }));
  }
})();
`;
