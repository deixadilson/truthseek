import MarkdownIt from 'markdown-it';
import DOMPurify from 'isomorphic-dompurify';

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
});

const ALLOWED_TAGS = [
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

const ALLOWED_ATTR = ['href', 'target', 'rel'];

let hooksRegistered = false;

function ensureSanitizeHooks() {
  if (hooksRegistered) return;
  hooksRegistered = true;

  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName !== 'A') return;

    const href = node.getAttribute('href') || '';
    if (!/^https?:\/\//i.test(href)) {
      node.removeAttribute('href');
    }
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  });
}

/** Render post Markdown to sanitized HTML for v-html. */
export function renderPostMarkdown(text: string | null | undefined): string {
  if (!text) return '';
  ensureSanitizeHooks();
  const dirty = md.render(text);
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  });
}
