const STORAGE_KEY = 'theme';

function currentTheme() {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function updateButton(button) {
  const isDark = currentTheme() === 'dark';
  button.textContent = isDark ? '☀️' : '🌙';
  button.setAttribute('aria-label', isDark ? '라이트 모드로 전환' : '다크 모드로 전환');
}

export function initTheme() {
  const button = document.querySelector('.theme-toggle');
  if (!button) return;
  updateButton(button);

  button.addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch (e) {
      // 저장소 접근이 막힌 환경에서는 이번 방문에만 적용한다
    }
    updateButton(button);
  });

  // 사용자가 직접 고르지 않았다면 시스템 설정 변경을 따라간다
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    let saved = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch (err) {
      saved = null;
    }
    if (saved) return;
    document.documentElement.dataset.theme = e.matches ? 'dark' : 'light';
    updateButton(button);
  });
}
