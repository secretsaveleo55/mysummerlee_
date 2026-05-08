# 맑음 — 에어코리아 대기질 정보 웹사이트

전북과학고 정보 수업 수행평가 프로젝트  
한국환경공단 에어코리아 OpenAPI 연동

---

## 파일 구조

```
airkorea-website/
├── index.html   ← 메인 HTML
├── style.css    ← 스타일시트
├── app.js       ← API 호출 & 동적 UI 로직
└── README.md    ← 이 파일
```

---

## VS Code에서 실행하는 법 (상세)

### 1단계 — VS Code에서 폴더 열기

1. VS Code를 실행합니다.
2. 상단 메뉴 **파일(File) → 폴더 열기(Open Folder)** 클릭
3. `airkorea-website` 폴더를 선택합니다.

---

### 2단계 — Live Server 확장 설치 (CORS 해결에 필수)

브라우저에서 파일을 직접 열면 (`file://`) 에어코리아 API가 CORS 오류로 차단됩니다.  
**반드시 로컬 서버를 통해 실행**해야 합니다.

1. VS Code 왼쪽 사이드바에서 **확장(Extensions)** 아이콘 클릭 (또는 `Ctrl+Shift+X`)
2. 검색창에 **Live Server** 입력
3. **Ritwick Dey**의 Live Server를 **설치(Install)**

---

### 3단계 — Live Server로 실행

방법 A (가장 쉬움):
- `index.html` 파일을 열고 → 우측 하단 상태바에서 **"Go Live"** 버튼 클릭

방법 B:
- `index.html` 파일에서 우클릭 → **"Open with Live Server"**

> 브라우저가 자동으로 열리며 `http://127.0.0.1:5500` 주소로 접속됩니다.

---

### 4단계 — 사용 방법

| 탭 | 기능 |
|---|---|
| **실시간** | 측정소명 입력 후 조회 (예: `종로구`, `해운대구`, `전주시`) |
| **예보** | 지역 선택 후 오늘의 미세먼지 예보 확인 |
| **지역별** | 시도 선택 후 전체 측정소 현황 테이블 조회 |

---

## CORS 오류 해결 (만약 데이터가 안 불러와질 때)

Live Server를 써도 안 될 경우 `app.js` 상단의 `PROXY_URL`을 수정합니다:

```js
// app.js 6번째 줄
const PROXY_URL = 'https://corsproxy.io/?';
```

저장 후 새로고침하면 corsproxy.io를 경유해 API를 호출합니다.

---

## 사용 API 목록

| 기능명 | 엔드포인트 |
|---|---|
| 측정소별 실시간 측정정보 | `/getMsrstnAcctoRltmMesureDnsty` |
| 대기질 예보통보 | `/getMinuDustFrcstDspth` |
| 시도별 실시간 측정정보 | `/getCtprvnRltmMesureDnsty` |

---

## 기술 스택

- **HTML5 / CSS3 / Vanilla JS** (프레임워크 없음)
- **Google Fonts** — Noto Sans KR, DM Serif Display, JetBrains Mono
- **에어코리아 OpenAPI** (공공데이터포털)

---

## 인증키 정보

```
일반 인증키: fe9c61d43e6dd12f7db6e21a48c66bc03f9ea0eea988d9e67f3766837e8fea8a
활용기간: 2026-03-22 ~ 2028-03-22
```
