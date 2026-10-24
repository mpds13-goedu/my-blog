// 입력 전체를 먼저 이스케이프한 뒤 변환하므로, 결과 HTML에는 우리가 만든 태그만 들어간다.
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isSafeUrl(url) {
  return !/^\s*(javascript|data|vbscript):/i.test(url);
}

function parseInline(text) {
  const codes = [];
  // 코드 span 안의 내용은 다른 문법이 적용되지 않도록 먼저 빼 둔다
  let out = text.replace(/`([^`]+)`/g, (_, code) => {
    codes.push(`<code>${code}</code>`);
    return `\u0000${codes.length - 1}\u0000`;
  });

  out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (m, alt, url) =>
    isSafeUrl(url) ? `<img src="${url}" alt="${alt}" loading="lazy">` : m);
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, url) =>
    isSafeUrl(url) ? `<a href="${url}">${label}</a>` : label);
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');

  return out.replace(/\u0000(\d+)\u0000/g, (_, i) => codes[Number(i)]);
}

function splitRow(line) {
  return line.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim());
}

const RE = {
  fence: /^```(\w*)\s*$/,
  heading: /^(#{1,4})\s+(.*)$/,
  hr: /^(-{3,}|\*{3,}|_{3,})\s*$/,
  quote: /^&gt;\s?(.*)$/,
  ul: /^\s*[-*+]\s+(.*)$/,
  ol: /^\s*\d+\.\s+(.*)$/,
  tableSep: /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/,
};

function isBlockStart(line, next) {
  return RE.fence.test(line) || RE.heading.test(line) || RE.hr.test(line) ||
    RE.quote.test(line) || RE.ul.test(line) || RE.ol.test(line) ||
    (line.includes('|') && next !== undefined && RE.tableSep.test(next) && next.includes('-'));
}

function parseBlocks(source) {
  const lines = escapeHtml(source).split('\n');
  const html = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i += 1;
      continue;
    }

    const fence = line.match(RE.fence);
    if (fence) {
      const body = [];
      i += 1;
      while (i < lines.length && !RE.fence.test(lines[i])) {
        body.push(lines[i]);
        i += 1;
      }
      i += 1;
      const cls = fence[1] ? ` class="language-${fence[1]}"` : '';
      html.push(`<pre><code${cls}>${body.join('\n')}</code></pre>`);
      continue;
    }

    const heading = line.match(RE.heading);
    if (heading) {
      const level = heading[1].length;
      html.push(`<h${level}>${parseInline(heading[2])}</h${level}>`);
      i += 1;
      continue;
    }

    if (RE.hr.test(line)) {
      html.push('<hr>');
      i += 1;
      continue;
    }

    if (RE.quote.test(line)) {
      const body = [];
      while (i < lines.length && RE.quote.test(lines[i])) {
        body.push(lines[i].match(RE.quote)[1]);
        i += 1;
      }
      html.push(`<blockquote>${parseBlocks(body.join('\n').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'"))}</blockquote>`);
      continue;
    }

    if (RE.ul.test(line) || RE.ol.test(line)) {
      const re = RE.ul.test(line) ? RE.ul : RE.ol;
      const tag = re === RE.ul ? 'ul' : 'ol';
      const items = [];
      while (i < lines.length && re.test(lines[i])) {
        items.push(`<li>${parseInline(lines[i].match(re)[1])}</li>`);
        i += 1;
      }
      html.push(`<${tag}>${items.join('')}</${tag}>`);
      continue;
    }

    if (line.includes('|') && i + 1 < lines.length && RE.tableSep.test(lines[i + 1]) && lines[i + 1].includes('-')) {
      const head = splitRow(line).map((c) => `<th>${parseInline(c)}</th>`).join('');
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].trim() && lines[i].includes('|')) {
        rows.push(`<tr>${splitRow(lines[i]).map((c) => `<td>${parseInline(c)}</td>`).join('')}</tr>`);
        i += 1;
      }
      html.push(`<div class="table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`);
      continue;
    }

    const para = [];
    while (i < lines.length && lines[i].trim() && !(para.length && isBlockStart(lines[i], lines[i + 1]))) {
      para.push(lines[i].trim());
      i += 1;
    }
    html.push(`<p>${parseInline(para.join(' '))}</p>`);
  }

  return html.join('\n');
}

function parseFrontMatter(text) {
  const normalized = text.replace(/\r\n?/g, '\n');
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return { meta: {}, body: normalized };

  const meta = {};
  for (const row of match[1].split('\n')) {
    const idx = row.indexOf(':');
    if (idx < 0) continue;
    const key = row.slice(0, idx).trim();
    let value = row.slice(idx + 1).trim();
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).split(',').map((v) => v.trim()).filter(Boolean);
    }
    meta[key] = value;
  }
  return { meta, body: normalized.slice(match[0].length) };
}

export function parseMarkdown(text) {
  const { meta, body } = parseFrontMatter(text);
  return { meta, html: parseBlocks(body) };
}
