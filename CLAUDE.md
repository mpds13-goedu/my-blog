# CLAUDE.md

마크다운(`.md`) 파일을 읽어 블로그 웹사이트로 변환하는 프로젝트입니다.

## 기술 스택 및 제약

- **순수 HTML / CSS / JavaScript만 사용합니다.** React, Vue 등 프레임워크, 번들러(Webpack, Vite 등), 빌드 단계, CSS 프레임워크(Tailwind, Bootstrap 등)를 도입하지 않습니다.
- 마크다운 파서는 직접 구현합니다(`js/markdown.js`). 외부 라이브러리가 꼭 필요해 보이면 추가하기 전에 사용자에게 먼저 물어봅니다.
- ES 모듈(`type="module"`)과 최신 브라우저 API(`fetch`, CSS 변수, `prefers-color-scheme`)를 사용합니다. 트랜스파일은 하지 않습니다.
- `npm install` 없이 동작해야 합니다. `package.json`이 필요 없는 구조를 유지합니다.

## 프로젝트 구조

```
my-blog/
├── index.html          # 글 목록 페이지
├── post.html           # 글 상세 페이지 (?post=파일명)
├── css/
│   ├── base.css        # 리셋, CSS 변수(테마 색상), 타이포그래피
│   ├── layout.css      # 레이아웃, 반응형
│   └── markdown.css    # 본문(.prose) 스타일
├── js/
│   ├── markdown.js     # 마크다운 → HTML 변환
│   ├── app.js          # 목록/상세 렌더링, 라우팅
│   └── theme.js        # 다크 모드 토글
└── posts/
    ├── index.json      # 글 목록 메타데이터
    └── *.md            # 글 원본 (front matter 포함)
```

## 실행 방법

`fetch`로 `.md`를 불러오므로 `file://`로 열면 동작하지 않습니다. 로컬 서버가 필요합니다.

```bash
python -m http.server 8000
```

이후 http://localhost:8000 에서 확인합니다. Python이 없으면 Node가 있을 때 `npx serve .`를 사용해도 됩니다(개발용 도구일 뿐, 프로젝트 의존성이 아닙니다).

## 콘텐츠 규칙

- 글은 `posts/` 아래 `.md` 파일로 작성하고, 상단에 front matter를 둡니다.

  ```markdown
  ---
  title: 글 제목
  date: 2026-01-31
  tags: [일기, 개발]
  summary: 목록에 보일 한두 줄 요약
  ---
  ```

- 새 글을 추가하면 `posts/index.json`에도 항목을 추가합니다(브라우저에서는 디렉터리 목록을 읽을 수 없기 때문).
- 파일명은 소문자 영문, 숫자, 하이픈만 사용합니다(예: `my-first-post.md`).
- 지원할 마크다운 문법: 제목, 문단, 굵게/기울임, 링크, 이미지, 인라인 코드, 코드 블록, 인용, 순서/비순서 목록, 가로줄, 표.
- 마크다운 변환 시 **반드시 HTML 이스케이프를 먼저 수행**해 본문의 `<script>` 등이 실행되지 않게 합니다. `innerHTML`에는 이스케이프를 거친 결과만 넣습니다.

## 디자인 가이드

- 목표: **깔끔하고 읽기 좋은 블로그**. 장식은 최소화하고 본문 가독성을 최우선으로 합니다.
- 본문 폭은 `max-width: 720px` 안팎, 줄 길이 약 40~75자를 유지합니다.
- 본문 `line-height`는 1.7~1.8, 기본 글자 크기는 16~18px. 한글 가독성을 위해 `word-break: keep-all`, `overflow-wrap: break-word`를 사용합니다.
- 폰트: 시스템 폰트 스택 우선(`-apple-system`, `"Pretendard"`, `"Noto Sans KR"`, `"Malgun Gothic"`, `sans-serif`). 코드는 `ui-monospace` 계열.
- 여백은 `rem` 기반 간격 단위를 일관되게 사용합니다. 색상·간격·반경 값은 하드코딩하지 않고 CSS 변수로 관리합니다.

## 다크 모드

- 색상은 `:root`의 CSS 변수로 정의하고, 다크 모드에서 변수 값만 교체합니다.
- 우선순위: ① 사용자가 토글로 선택한 값(`localStorage`) → ② 시스템 설정(`prefers-color-scheme`).
- `<html data-theme="light|dark">` 속성으로 제어합니다.
- 페이지 로드 시 깜빡임(FOUC)을 막기 위해 테마 적용 스크립트를 `<head>`에서 CSS보다 먼저 동기 실행합니다.
- 헤더에 테마 토글 버튼을 두고, `aria-label`을 제공합니다.
- 본문 텍스트와 배경의 명암비는 라이트/다크 모두 WCAG AA(4.5:1) 이상을 유지합니다. 코드 블록, 인용문, 표, 링크 색상도 양쪽 모드에서 확인합니다.

## 모바일 / 반응형

- 모바일 우선(mobile-first)으로 작성하고 `min-width` 미디어 쿼리로 확장합니다.
- `<meta name="viewport" content="width=device-width, initial-scale=1">`를 모든 페이지에 포함합니다.
- 가로 스크롤이 생기지 않아야 합니다. 긴 코드 블록과 표는 해당 요소 안에서만 `overflow-x: auto`로 스크롤합니다. 이미지는 `max-width: 100%; height: auto`.
- 터치 대상(버튼, 링크)은 최소 44×44px 확보.
- 375px(모바일), 768px(태블릿), 1280px(데스크톱) 너비에서 확인합니다.

## 접근성 / SEO

- 시맨틱 태그(`header`, `nav`, `main`, `article`, `footer`)를 사용하고 제목 계층(h1→h2→h3)을 건너뛰지 않습니다.
- 이미지에는 `alt`를 넣고, 포커스 스타일을 제거하지 않습니다.
- 글 상세 페이지에서는 `document.title`과 `meta description`을 글 정보로 갱신합니다.

## 코드 작성 규칙

- 들여쓰기는 공백 2칸, 문자열은 작은따옴표, 세미콜론 사용.
- JS는 `const`/`let`만 사용하고, 함수는 작게 나눕니다. 전역 변수를 만들지 않습니다.
- CSS 클래스는 소문자 하이픈 표기(`post-card`, `theme-toggle`)를 사용합니다.
- 주석은 "왜 그렇게 했는지"가 불분명한 곳에만 한국어로 짧게 답니다.
- 사용자에게 보이는 문구(UI 텍스트)는 한국어, 코드 식별자는 영어로 작성합니다.

## 작업 시 유의사항

- 변경 후에는 로컬 서버로 직접 띄워 **라이트/다크 모드와 모바일 너비**를 모두 확인합니다.
- 기능을 추가할 때 기존 구조(파일 분리, CSS 변수)를 따르고, 새 의존성을 추가하지 않습니다.
- 요청받지 않은 기능(댓글, 검색, 분석 도구 등)은 임의로 추가하지 않습니다.
