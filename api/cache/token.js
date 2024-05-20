const { flushAttendCacheList } = require('./attendCaches');

const tokenCache = {};
const TTL = 600000; // 10분 (600,000 밀리초)

// Token 삭제 함수
async function deleteToken(sessionId) {
  await flushAttendCacheList(sessionId);
  delete tokenCache[sessionId];
}

// 토큰 생성 함수
function createToken(sessionId, attendIdx) {
  if (tokenCache[sessionId]) {
    console.log(`이미 출석 체크 중`);
    return false; // 이미 존재하는 경우 false 반환
  }

  const expireAt = Date.now() + TTL;
  const code = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  tokenCache[sessionId] = { attendIdx, expireAt, code };

  // 시간 지나면 사라짐
  setTimeout(async () => {
    if (tokenCache[sessionId] && tokenCache[sessionId].expireAt <= Date.now()) {
      await deleteToken(sessionId);
    }
  }, TTL);

  return tokenCache[sessionId]; // 새로 설정된 경우 true 반환
}

function restartToken(sessionId){
  const token = tokenCache[sessionId];
  // 새로운 코드 생성
  token.code = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  // 만료 시간 갱신
  token.expireAt = Date.now() + TTL;
  
  return token;
}
// Token 조회 함수
function getToken(sessionId) {
  const token = tokenCache[sessionId];
  if (token && token.expireAt > Date.now()) {
    return token;
  } else {
    delete tokenCache[sessionId];
    return null;
  }
}

module.exports = { createToken, getToken, restartToken, deleteToken };
