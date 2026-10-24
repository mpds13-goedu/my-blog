import { initTheme } from './theme.js';
import { parseMarkdown } from './markdown.js';

const POST_NAME = /^[a-z0-9-]+$/;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function showMessage(container, text) {
  container.replaceChildren(el('p', 'message', text));
}

function renderMeta(date, tags) {
  const meta = el('div', 'post-meta');
  meta.append(el('time', '', date));
  (tags || []).forEach((tag) => meta.append(el('span', 'tag', tag)));
  return meta;
}

async function renderList() {
  const list = document.querySelector('#post-list');
  try {
    const res = await fetch('posts/index.json');
    if (!res.ok) throw new Error(res.status);
    const posts = await res.json();
    posts.sort((a, b) => b.date.localeCompare(a.date));

    const items = posts.map((post) => {
      const li = el('li', 'post-card');
      const link = el('a');
      link.href = `post.html?post=${encodeURIComponent(post.slug)}`;
      link.append(el('h2', '', post.title), renderMeta(post.date, post.tags), el('p', 'post-summary', post.summary));
      li.append(link);
      return li;
    });
    list.replaceChildren(...items);
  } catch (e) {
    showMessage(list, '글 목록을 불러오지 못했습니다.');
  }
}

async function renderPost() {
  const container = document.querySelector('#post');
  const slug = new URLSearchParams(location.search).get('post') || '';

  if (!POST_NAME.test(slug)) {
    showMessage(container, '존재하지 않는 글입니다.');
    return;
  }

  try {
    const res = await fetch(`posts/${slug}.md`);
    if (!res.ok) throw new Error(res.status);
    const { meta, html } = parseMarkdown(await res.text());

    const header = el('header', 'post-header');
    header.append(el('h1', '', meta.title || slug), renderMeta(meta.date || '', meta.tags));
    const body = el('div', 'prose');
    body.innerHTML = html; // markdown.js가 이스케이프한 결과만 들어온다

    container.replaceChildren(header, body);
    document.title = `${meta.title || slug} | 내 블로그`;
    document.querySelector('meta[name="description"]')?.setAttribute('content', meta.summary || '');
  } catch (e) {
    showMessage(container, '존재하지 않는 글입니다.');
  }
}

initTheme();
if (document.querySelector('#post-list')) renderList();
if (document.querySelector('#post')) renderPost();
