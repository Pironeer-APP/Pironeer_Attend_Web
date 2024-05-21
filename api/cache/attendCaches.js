const Attend = require('../models/attend');

const attendCache = {
  sessionId: null,
  attendIdx: null,
  attends: [] // 유저의 세션에 대한 모든 출석정보(이전 출석도 가져옴)
};

function createAttendCache(sessionId, attendIdx, attends) {
  if (attendCache.sessionId) {
    console.log(`이미 출석 체크 중`);
    return false; // 이미 존재하는 경우 false 반환
  }

  attendCache.sessionId = sessionId;
  attendCache.attendIdx = attendIdx;
  attendCache.attends = [];

  attends.forEach(attend => {
    let attendAtIdx = attend.attendList.find(item => item.attendIdx === attendIdx);
    if (!attendAtIdx) {
      attendAtIdx = { attendIdx, status: false };
      attend.attendList.push(attendAtIdx); // 세이브를 하지 않으므로 디비에는 영향 없음
    }
    attendAtIdx.status = true;
    attendCache.attends.push(attend);
  });

  return true; // 새로 설정된 경우 true 반환
}

// 캐시 초기화
function initAttendCache(sessionId, attendIdx) {
  const cache = attendCache;
  if (cache.sessionId == sessionId) {
    for (const attend of cache.attends) {
      const attendCheck = attend.attendList.find(item => item.attendIdx === attendIdx);
      if (attendCheck) {
        attendCheck.status = false;
      } else {
        attend.attendList.push({ attendIdx, status: false });
      }
    }
  }
}

function getAttendCache(sessionId) {
  return attendCache.sessionId == sessionId ? attendCache : null;
}

// 캐시에 있는 정보 모두 데이터베이스에 넘기고 캐시 삭제
async function flushAttendCache(sessionId) {
  
  const cache = attendCache;
  if (cache.sessionId == sessionId) {
    const bulkOps = cache.attends.map(attend => ({
      updateOne: {
        filter: { user: attend.user, session: sessionId },
        update: {
          $set: {
            attendList: attend.attendList
          }
        },
        upsert: true
      }
    }));

    if (bulkOps.length > 0) {
      await Attend.bulkWrite(bulkOps);
    }

    cache.sessionId = null;
    cache.attendIdx = null;
    cache.attends = [];
  }
}

module.exports = { createAttendCache, initAttendCache, getAttendCache, flushAttendCache };
