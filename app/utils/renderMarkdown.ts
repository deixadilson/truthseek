import DOMPurify from 'dompurify';
import {
  ALLOWED_ATTR,
  ALLOWED_TAGS,
  hardenMarkdownHtml,
  md,
} from '~/utils/renderMarkdownShared';

let hooksRegistered = false;

function ensureSanitizeHooks() {
  if (hooksRegistered || import.meta.server) return;
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
  const dirty = md.render(text);

  // Avoid DOMPurify/jsdom on the server (breaks Vercel/Lambda ESM).
  if (import.meta.server || typeof window === 'undefined') {
    return hardenMarkdownHtml(dirty);
  }

  ensureSanitizeHooks();
  try {
    return DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
    });
  } catch {
    return hardenMarkdownHtml(dirty);
  }
}
