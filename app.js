/**
 * 맑음 — 대기질 정보 웹사이트
 * 에어코리아 OpenAPI 연동
 *
 * API 인증키: fe9c61d43e6dd12f7db6e21a48c66bc03f9ea0eea988d9e67f3766837e8fea8a
 * CORS 우회: 공공데이터 포털은 직접 브라우저 호출 시 CORS 오류 발생 가능.
 * → 로컬 개발 시 VS Code Live Server 또는 CORS 프록시를 사용합니다.
 *    아래 PROXY_URL을 '' 로 설정하면 직접 호출, 문제 시 cors-anywhere 경유 가능.
 */

// ──────────────────────────────────────────────────────────────
// 설정
// ──────────────────────────────────────────────────────────────
const API_KEY  = 'fe9c61d43e6dd12f7db6e21a48c66bc03f9ea0eea988d9e67f3766837e8fea8a';
const BASE_URL = 'https://apis.data.go.kr/B552584/ArpltnInforInqireSvc';

// CORS 프록시 (필요 시 'https://corsproxy.io/?' 로 교체)
// 로컬 개발 환경 (Live Server)에서는 보통 직접 호출이 잘 됩니다.
const PROXY_URL = '';

// ──────────────────────────────────────────────────────────────
// 유틸리티
// ──────────────────────────────────────────────────────────────

/** API 공통 파라미터 생성 */
function commonParams(extra = {}) {
  return new URLSearchParams({
    serviceKey: API_KEY,
    returnType: 'json',
    numOfRows: '100',
    pageNo: '1',
    ...extra,
  });
}

/** fetch + JSON 파싱 */
async function fetchJSON(url) {
  const target = PROXY_URL ? PROXY_URL + encodeURIComponent(url) : url;
  const res = await fetch(target);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return json;
}

/** CAI 등급 → 텍스트 */
function gradeText(grade) {
  const map = { 1: '좋음', 2: '보통', 3: '나쁨', 4: '매우나쁨' };
  return map[grade] || '알수없음';
}

/** CAI 수치 → 등급 코드 */
function caiToGrade(cai) {
  const v = Number(cai);
  if (isNaN(v)) return 0;
  if (v <= 50)  return 1;
  if (v <= 100) return 2;
  if (v <= 250) return 3;
  return 4;
}

/** 등급 코드 → CSS 클래스명 */
function gradeClass(grade) {
  return ['', 'good', 'normal', 'bad', 'very-bad'][grade] || '';
}

/** 등급 코드 → 색상 변수 */
function gradeColor(grade) {
  return ['', 'var(--good)', 'var(--normal)', 'var(--bad)', 'var(--very-bad)'][grade] || '#fff';
}

/** 등급 코드 → 조언 */
function adviceByGrade(grade) {
  const data = {
    1: { icon: '😊', title: '좋음 — 쾌적한 하루입니다', text: '야외 활동을 마음껏 즐기세요. 공기가 맑고 건강에 이상이 없는 수준입니다.' },
    2: { icon: '🙂', title: '보통 — 무난한 대기 상태', text: '민감한 분들(어린이·노인·호흡기 질환자)은 장시간 야외 활동 시 주의하세요.' },
    3: { icon: '😷', title: '나쁨 — 외출 자제 권고', text: '장시간 야외 활동을 삼가고, 부득이한 경우 마스크를 착용하세요. 환기는 최소화하는 것이 좋습니다.' },
    4: { icon: '🚨', title: '매우나쁨 — 외출 금지 수준', text: '가급적 실내에 머무르세요. 외출 시 KF94 마스크를 반드시 착용하고, 격렬한 야외 운동은 피하세요.' },
  };
  return data[grade] || { icon: '❓', title: '데이터 없음', text: '측정소 데이터를 조회해주세요.' };
}

// ──────────────────────────────────────────────────────────────
// DOM 참조
// ──────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const stationInput  = $('stationInput');
const searchBtn     = $('searchBtn');
const loadingEl     = $('loading');
const errorEl       = $('errorMsg');
const errorText     = $('errorText');
const resultWrap    = $('resultWrap');

// AQI 요소
const aqiCard       = $('aqiCard');
const aqiStation    = $('aqiStation');
const aqiTime       = $('aqiTime');
const aqiBadge      = $('aqiBadge');
const aqiValue      = $('aqiValue');
const aqiBarFill    = $('aqiBarFill');
const aqiBarThumb   = $('aqiBarThumb');
const pollutantsGrid= $('pollutantsGrid');
const adviceCard    = $('adviceCard');
const adviceIcon    = $('adviceIcon');
const adviceTitle   = $('adviceTitle');
const adviceText    = $('adviceText');

// ──────────────────────────────────────────────────────────────
// 실시간 측정소 조회
// ──────────────────────────────────────────────────────────────
async function searchStation() {
  const station = stationInput.value.trim();
  if (!station) {
    showError('측정소 이름을 입력해주세요.');
    return;
  }
  showLoading();

  try {
    const params = commonParams({ stationName: station, dataTerm: 'DAILY', ver: '1.0' });
    const url = `${BASE_URL}/getMsrstnAcctoRltmMesureDnsty?${params}`;
    const json = await fetchJSON(url);

    const items = json?.response?.body?.items;
    if (!items || items.length === 0) {
      showError(`"${station}" 측정소를 찾을 수 없습니다. 정확한 측정소명(읍·면·동 단위)을 입력해주세요.`);
      return;
    }

    renderResult(station, items[0]);
  } catch (e) {
    console.error(e);
    showError('데이터를 불러오지 못했습니다. 네트워크 연결이나 측정소명을 확인해주세요.');
  }
}

function renderResult(stationName, d) {
  hideAll();
  resultWrap.style.display = 'block';

  // ─ AQI 카드 ─
  aqiStation.textContent = `📍 ${stationName}`;
  aqiTime.textContent    = `측정 시각: ${d.dataTime || '—'}`;

  const cai   = d.khaiValue;
  const grade = caiToGrade(cai);
  aqiValue.textContent   = isNaN(Number(cai)) ? '—' : cai;

  // 뱃지
  aqiBadge.textContent   = gradeText(grade);
  aqiBadge.className     = `aqi-badge ${gradeClass(grade)}`;

  // 바 (0~500 범위로 정규화)
  const pct = Math.min((Number(cai) / 300) * 100, 100) || 0;
  aqiBarFill.style.background = 'transparent';
  aqiBarThumb.style.left      = `${pct}%`;

  // 카드 show
  setTimeout(() => { aqiCard.classList.add('show'); adviceCard.classList.add('show'); }, 50);

  // ─ 오염물질 카드 ─
  const pollutants = [
    { key: 'pm10Value',  label: 'PM10',  unit: 'µg/m³', max: 150, thresholds: [30, 80, 150] },
    { key: 'pm25Value',  label: 'PM2.5', unit: 'µg/m³', max: 75,  thresholds: [15, 35, 75] },
    { key: 'o3Value',    label: 'O₃',    unit: 'ppm',   max: 0.2, thresholds: [0.03, 0.09, 0.15] },
    { key: 'no2Value',   label: 'NO₂',   unit: 'ppm',   max: 0.2, thresholds: [0.03, 0.06, 0.2] },
    { key: 'coValue',    label: 'CO',    unit: 'ppm',   max: 25,  thresholds: [2, 9, 15] },
    { key: 'so2Value',   label: 'SO₂',   unit: 'ppm',   max: 0.1, thresholds: [0.02, 0.05, 0.1] },
  ];

  pollutantsGrid.innerHTML = '';
  pollutants.forEach((p, i) => {
    const val  = d[p.key];
    const num  = parseFloat(val);
    const pct  = isNaN(num) ? 0 : Math.min((num / p.max) * 100, 100);

    // 등급 색상 결정
    let color = 'var(--good)';
    if (!isNaN(num)) {
      if (num >= p.thresholds[2])      color = 'var(--very-bad)';
      else if (num >= p.thresholds[1]) color = 'var(--bad)';
      else if (num >= p.thresholds[0]) color = 'var(--normal)';
    }

    const card = document.createElement('div');
    card.className = 'pollutant-card';
    card.style.animationDelay = `${i * 60}ms`;
    card.innerHTML = `
      <div class="pollutant-name">${p.label}</div>
      <div class="pollutant-value" style="color:${color}">${isNaN(num) ? '—' : val}</div>
      <div class="pollutant-unit">${p.unit}</div>
      <div class="pollutant-bar">
        <div class="pollutant-bar-fill" style="width:${pct}%; background:${color};"></div>
      </div>
    `;
    pollutantsGrid.appendChild(card);
  });

  // ─ 조언 ─
  const adv = adviceByGrade(grade);
  adviceIcon.textContent  = adv.icon;
  adviceTitle.textContent = adv.title;
  adviceText.textContent  = adv.text;
}

// ──────────────────────────────────────────────────────────────
// 예보 조회
// ──────────────────────────────────────────────────────────────
const forecastBtn      = $('forecastBtn');
const regionSelect     = $('regionSelect');
const forecastLoading  = $('forecastLoading');
const forecastList     = $('forecastList');

async function loadForecast() {
  forecastLoading.style.display = 'flex';
  forecastList.innerHTML = '';
  const region = regionSelect.value;

  try {
    // 오늘 날짜
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm   = String(today.getMonth() + 1).padStart(2, '0');
    const dd   = String(today.getDate()).padStart(2, '0');
    const searchDate = `${yyyy}-${mm}-${dd}`;

    const params = commonParams({ searchDate, informCode: 'PM10', numOfRows: '10' });
    const url    = `${BASE_URL}/getMinuDustFrcstDspth?${params}`;
    const json   = await fetchJSON(url);

    const items = json?.response?.body?.items;
    forecastLoading.style.display = 'none';

    if (!items || items.length === 0) {
      forecastList.innerHTML = '<p style="color:var(--text-sub); padding:20px 0;">예보 데이터가 없습니다.</p>';
      return;
    }

    items.forEach((item, i) => {
      // 해당 지역 등급 파싱
      const informGrade = item.informGrade || '';
      const regionGrades = informGrade.split(',').map(s => s.trim());
      let targetGrade = '—';
      for (const rg of regionGrades) {
        if (rg.startsWith(region)) {
          targetGrade = rg.split(':')[1]?.trim() || '—';
          break;
        }
      }
      const gradeNum = gradeNumFromText(targetGrade);

      const el = document.createElement('div');
      el.className = 'forecast-item';
      el.style.animationDelay = `${i * 80}ms`;
      el.innerHTML = `
        <div>
          <div class="forecast-date">${item.informData || item.dataTime || '—'}</div>
          <div class="forecast-type">${item.informCode || 'PM10'}</div>
          <div class="forecast-cause">${item.informCause || '—'}</div>
        </div>
        <div class="forecast-grade">
          <div class="forecast-grade-value" style="color:${gradeColor(gradeNum)}">${targetGrade}</div>
          <div class="forecast-grade-label">${region}</div>
        </div>
      `;
      forecastList.appendChild(el);
    });

  } catch (e) {
    console.error(e);
    forecastLoading.style.display = 'none';
    forecastList.innerHTML = '<p style="color:var(--very-bad); padding:20px 0;">⚠ 예보 데이터를 불러오지 못했습니다.</p>';
  }
}

function gradeNumFromText(text) {
  if (!text) return 0;
  if (text.includes('좋음'))     return 1;
  if (text.includes('보통'))     return 2;
  if (text.includes('나쁨') && !text.includes('매우')) return 3;
  if (text.includes('매우나쁨')) return 4;
  return 0;
}

// ──────────────────────────────────────────────────────────────
// 시도별 실시간 조회
// ──────────────────────────────────────────────────────────────
const sidoBtn       = $('sidoBtn');
const sidoSelect    = $('sidoSelect');
const sidoLoading   = $('sidoLoading');
const sidoTable     = $('sidoTable');
const sidoTableBody = $('sidoTableBody');

async function loadSido() {
  sidoLoading.style.display = 'flex';
  sidoTable.style.display   = 'none';
  sidoTableBody.innerHTML   = '';
  const sido = sidoSelect.value;

  try {
    const params = commonParams({ sidoName: sido, searchCondition: 'HOUR' });
    const url    = `${BASE_URL}/getCtprvnRltmMesureDnsty?${params}`;
    const json   = await fetchJSON(url);

    const items = json?.response?.body?.items;
    sidoLoading.style.display = 'none';

    if (!items || items.length === 0) {
      sidoTableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--text-sub);">데이터가 없습니다.</td></tr>`;
      sidoTable.style.display = 'table';
      return;
    }

    items.forEach((d, i) => {
      const grade     = caiToGrade(d.khaiValue);
      const cls       = gradeClass(grade);
      const color     = gradeColor(grade);
      const gradeLabel= gradeText(grade);

      const tr = document.createElement('tr');
      tr.style.animationDelay = `${i * 30}ms`;
      tr.innerHTML = `
        <td>${d.stationName || '—'}</td>
        <td>${d.pm10Value  ?? '—'}</td>
        <td>${d.pm25Value  ?? '—'}</td>
        <td>${d.o3Value    ?? '—'}</td>
        <td>${d.no2Value   ?? '—'}</td>
        <td>${d.coValue    ?? '—'}</td>
        <td>${d.so2Value   ?? '—'}</td>
        <td>
          <span class="cai-chip ${cls}" style="color:${color};border:1px solid ${color}20;background:${color}18;">
            ${gradeLabel}
          </span>
        </td>
      `;
      sidoTableBody.appendChild(tr);
    });

    sidoTable.style.display = 'table';
  } catch (e) {
    console.error(e);
    sidoLoading.style.display = 'none';
    sidoTableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--very-bad);">⚠ 데이터를 불러오지 못했습니다.</td></tr>`;
    sidoTable.style.display = 'table';
  }
}

// ──────────────────────────────────────────────────────────────
// UI 헬퍼
// ──────────────────────────────────────────────────────────────
function showLoading() {
  loadingEl.style.display = 'flex';
  errorEl.style.display   = 'none';
  resultWrap.style.display= 'none';
  aqiCard.classList.remove('show');
  adviceCard.classList.remove('show');
}

function hideAll() {
  loadingEl.style.display = 'none';
  errorEl.style.display   = 'none';
}

function showError(msg) {
  loadingEl.style.display  = 'none';
  resultWrap.style.display = 'none';
  errorEl.style.display    = 'flex';
  errorText.textContent    = msg;
}

// ──────────────────────────────────────────────────────────────
// 내비게이션 탭
// ──────────────────────────────────────────────────────────────
const navBtns = document.querySelectorAll('.nav-btn');
navBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    navBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const target = btn.dataset.section;
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    const targetEl = document.getElementById(`section-${target}`);
    if (targetEl) targetEl.classList.remove('hidden');

    // 자동 로드
    if (target === 'forecast') loadForecast();
    if (target === 'map')      loadSido();
  });
});

// ──────────────────────────────────────────────────────────────
// 이벤트 연결
// ──────────────────────────────────────────────────────────────
searchBtn.addEventListener('click', searchStation);
stationInput.addEventListener('keydown', e => { if (e.key === 'Enter') searchStation(); });
forecastBtn.addEventListener('click', loadForecast);
sidoBtn.addEventListener('click', loadSido);

// ──────────────────────────────────────────────────────────────
// 초기 실행 — 전북 데이터 자동 조회
// ──────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  stationInput.value = '전주시';
  searchStation();
});
