import MarkdownIt from 'markdown-it';

export const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
});

export const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'em',
  's',
  'del',
  'h2',
  'h3',
  'ul',
  'ol',
  'li',
  'blockquote',
  'code',
  'pre',
  'a',
];

export const ALLOWED_ATTR = ['href', 'target', 'rel'];

/**
 * Harden markdown-it output without a DOM (SSR-safe).
 * With html:false, markdown-it only emits known tags; we still lock down anchors.
 */
export function hardenMarkdownHtml(html: string): string {
  return html.replace(/<a\b([^>]*)>/gi, (_tag, attrs: string) => {
    const hrefMatch = attrs.match(/\bhref\s*=\s*(["'])(.*?)\1/i);
    const href = hrefMatch?.[2] ?? '';
    if (!/^https?:\/\//i.test(href)) {
      return '<a>';
    }
    const safeHref = href.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer">`;
  });
}
