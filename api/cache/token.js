const { flushAttendCache } = require('./attendCaches');

const tokenCache = {
  sessionId: null,
  attendIdx: null,
  expireAt: null,
  code: null,
};
const TTL = 600000; // 10분 (600,000 밀리초)

// Token 삭제 함수
async function deleteToken(sessionId) {
  await flushAttendCache(sessionId);
  tokenCache.sessionId = null;
  tokenCache.attendIdx = null;
  tokenCache.expireAt = null;
  tokenCache.code = null;
}

// 토큰 생성 함수
function createToken(sessionId, attendIdx) {
  if (tokenCache.sessionId) {
    console.log(`이미 출석 체크 중`);
    return null; // 이미 존재하는 경우 false 반환
  }

  const expireAt = Date.now() + TTL;
  const code = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  tokenCache.sessionId = sessionId;
  tokenCache.attendIdx = attendIdx;
  tokenCache.expireAt = expireAt;
  tokenCache.code = code;

  // 시간 지나면 사라짐
  setTimeout(async () => {
    if (tokenCache.sessionId == sessionId && tokenCache.expireAt <= Date.now()) {
      await deleteToken(sessionId);
    }
  }, TTL);

  return tokenCache; // 새로 설정된 경우 토큰 반환
}

// 토큰 재시작 함수
function restartToken(sessionId) {
  if (tokenCache.sessionId !== sessionId) {
    console.log(`세션 ID가 일치하지 않습니다.`);
    return null; // 세션 ID가 일치하지 않는 경우 null 반환
  }

  const token = tokenCache;
  token.code = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  token.expireAt = Date.now() + TTL;

  return token;
}

// Token 조회 함수
function getToken(sessionId) {
  if (tokenCache.sessionId == sessionId) {
    return tokenCache;
  } else {
    return null;
  }
}

module.exports = { createToken, getToken, restartToken, deleteToken };
