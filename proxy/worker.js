/**
 * 나이스 교육정보 개방포털 급식 API 중계 프록시 (Cloudflare Worker)
 * 
 * 브라우저 및 학생 페이지에서는 인증키 없이 본 Worker의 URL을 호출하면,
 * Worker가 안전하게 비공개 환경변수(NEIS_API_KEY)를 결합하여 나이스 API를 대신 호출합니다.
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. CORS Preflight (OPTIONS) 요청 처리
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // 2. 루트(/) 요청 시 상태 확인 메시지 반환
    if (url.pathname === "/" && !url.search) {
      return new Response(
        JSON.stringify({
          status: "healthy",
          service: "NEIS Meal API Proxy",
          usage: "/meal?MLSV_YMD=YYYYMMDD&ATPT_OFCDC_SC_CODE=B10&SD_SCHUL_CODE=7132148",
        }),
        {
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // 3. 환경변수에서 API 키 추출 (설정되어 있지 않으면 기본값 사용)
    const apiKey = env.NEIS_API_KEY || "fa321714b05546ad82fc4bf29b3a20ef";

    // 4. 나이스 API 파라미터 조립
    const neisUrl = new URL("https://open.neis.go.kr/hub/mealServiceDietInfo");
    
    // 클라이언트로부터 전달받은 모든 쿼리 파라미터 복사
    url.searchParams.forEach((value, key) => {
      neisUrl.searchParams.set(key, value);
    });

    // 기본 필수 파라미터 보정
    neisUrl.searchParams.set("KEY", apiKey);
    if (!neisUrl.searchParams.has("Type")) neisUrl.searchParams.set("Type", "json");
    if (!neisUrl.searchParams.has("ATPT_OFCDC_SC_CODE")) neisUrl.searchParams.set("ATPT_OFCDC_SC_CODE", "B10");
    if (!neisUrl.searchParams.has("SD_SCHUL_CODE")) neisUrl.searchParams.set("SD_SCHUL_CODE", "7132148");

    // date 또는 MLSV_YMD 지원
    if (url.searchParams.has("date")) {
      neisUrl.searchParams.set("MLSV_YMD", url.searchParams.get("date"));
    }

    try {
      // 5. 나이스 원본 API 호출
      const neisResponse = await fetch(neisUrl.toString(), {
        headers: {
          "User-Agent": "Mozilla/5.0 (Cloudflare Worker; NEIS Proxy)",
        },
      });

      const data = await neisResponse.text();

      // 6. CORS 헤더와 캐시 제어 헤더를 포함하여 응답 반환
      return new Response(data, {
        status: neisResponse.status,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Cache-Control": "public, max-age=3600, s-maxage=3600", // 1시간 캐싱
        },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          RESULT: {
            CODE: "ERROR-500",
            MESSAGE: "중계 서버 오류: " + error.message,
          },
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }
  },
};
