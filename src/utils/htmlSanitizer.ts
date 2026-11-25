const ALLOWED_TAGS = new Set([
  'p',
  'br',
  'b',
  'strong',
  'i',
  'em',
  'u',
  's',
  'h2',
  'h3',
  'ul',
  'ol',
  'li',
  'blockquote',
  'code',
  'pre',
  'a',
  'div',
]);

const STRIP_WITH_CONTENT = new Set([
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'svg',
  'math',
]);

export function isSafeHref(rawHref: string): boolean {
  const trimmed = rawHref.trim().toLowerCase();
  if (!trimmed) return false;
  if (trimmed.startsWith('/')) return true;
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) return true;
  if (trimmed.startsWith('mailto:')) return true;
  return false;
}

/**
 * Pure allow-list HTML sanitizer for WYSIWYG output (works in Node & browser).
 * Strips dangerous tags + content (<script>, <style>, <iframe>) and all on* attributes.
 */
export function sanitizeRichHtml(input: string): string {
  let cleaned = input;

  // Strip dangerous container tags together with their inner content
  for (const tag of STRIP_WITH_CONTENT) {
    const pairRe = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi');
    const selfRe = new RegExp(`<${tag}\\b[^>]*\\/?>`, 'gi');
    cleaned = cleaned.replace(pairRe, '').replace(selfRe, '');
  }

  // Filter remaining tags against allow-list & sanitize <a> attributes
  cleaned = cleaned.replace(/<\/?([a-zA-Z0-9-]+)([^>]*)>/g, (full, rawTag, rawAttrs) => {
    const tag = rawTag.toLowerCase();
    const isClosing = full.startsWith('</');
    if (!ALLOWED_TAGS.has(tag)) {
      return '';
    }
    if (isClosing) {
      return `</${tag}>`;
    }
    if (tag === 'br') {
      return '<br />';
    }
    if (tag === 'a') {
      const hrefMatch = /href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(rawAttrs);
      const href = hrefMatch ? (hrefMatch[1] ?? hrefMatch[2] ?? hrefMatch[3] ?? '') : '';
      if (isSafeHref(href)) {
        const escapedHref = href.replace(/"/g, '&quot;');
        return `<a href="${escapedHref}" target="_blank" rel="noopener noreferrer">`;
      }
      return '<a>';
    }
    return `<${tag}>`;
  });

  return cleaned.trim();
}

export function stripHtmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h2|h3|li|blockquote)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .trim();
}
