# Cloudflare Worker 나이스 API 중계 프록시 배포 가이드

본 가이드는 나이스 API 키(`fa321714b05546ad82fc4bf29b3a20ef`)를 브라우저에 직접 노출하지 않고 안전하게 숨겨서 중계하는 무료 Cloudflare Worker 배포 방법입니다.

---

## 방법 1: Cloudflare 웹 대시보드에서 3분 만에 배포하기 (가장 쉬움)

1. **[Cloudflare 대시보드](https://dash.cloudflare.com/)**에 로그인 (무료 계정 생성)
2. 좌측 메뉴에서 **Compute (Workers & Pages)** > **Create application** > **Create Worker** 클릭
3. Worker 이름을 입력 (예: `neis-proxy`)하고 **Deploy** 클릭
4. **Edit code** 버튼을 클릭하여 웹 에디터를 엽니다.
5. 에디터 안의 기본 코드를 모두 지우고, 이 저장소의 [`proxy/worker.js`](file:///c:/Users/USER/Downloads/anti/2026sy/proxy/worker.js) 파일의 내용을 그대로 복사해 붙여넣은 후 **Deploy** 클릭
6. (선택 사항) **Settings** > **Variables** > **Environment Variables**에서:
   - 변수 이름: `NEIS_API_KEY`
   - 변수 값: `fa321714b05546ad82fc4bf29b3a20ef` (Encrypt 체크하여 Secret으로 저장 가능)

배포가 완료되면 생성된 Worker 주소(예: `https://neis-proxy.your-name.workers.dev`)를 통해 모든 학생 페이지에서 호출할 수 있습니다.

---

## 방법 2: Wrangler CLI를 통한 배포

```powershell
cd proxy
npx wrangler login
npx wrangler deploy
```

---

## 학생 페이지 호출 방식

Worker 배포 후, 학생 페이지의 JavaScript에서 아래와 같이 주소만 변경하면 나이스 API 키가 완벽하게 보호된 상태로 급식 정보가 조회됩니다.

```javascript
// 기존 나이스 직접 호출 대신 Worker 프록시 주소 지정
const API_URL = "https://neis-proxy.your-name.workers.dev";

// 호출 예시 (인증키 없이 요청해도 Worker가 백엔드에서 인증키를 자동 주입)
const response = await fetch(`${API_URL}?MLSV_YMD=20260708&SD_SCHUL_CODE=7132148&ATPT_OFCDC_SC_CODE=B10`);
const data = await response.json();
```
