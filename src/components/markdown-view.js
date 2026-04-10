import { marked } from 'marked';
import DOMPurify from 'dompurify';

marked.setOptions({
  gfm: true,
  breaks: false,
});

export function renderMarkdown(md) {
  const raw = marked.parse(md || '');
  return DOMPurify.sanitize(raw);
}

export function mountMarkdown(host, md) {
  host.classList.add('markdown-body');
  host.innerHTML = renderMarkdown(md);
}
