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
    attend.attendList.push({ attendIdx, status: false });
    attendCache.attends.push(attend);
  });

  return true; // 새로 설정된 경우 true 반환
}

// 캐시 초기화
async function initAttendCache(sessionId, attendIdx) {
  const cache = attendCache;
  if (cache.sessionId === sessionId) {
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
  return attendCache.sessionId === sessionId ? attendCache.attends : null;
}

// 캐시에 있는 정보 모두 데이터베이스에 넘기고 캐시 삭제
async function flushAttendCache(sessionId) {
  const cache = attendCache;
  if (cache.sessionId === sessionId) {
    const updateAttendPromises = cache.attends.map(async attend => {
      // 캐시 내의 출석 하나를 가져와 저장
      const dbAttend = await Attend.findOne({ user: attend.user, session: sessionId });
      if (dbAttend) {
        const attendCheck = dbAttend.attendList.find(item => item.attendIdx === cache.attendIdx);
        if (attendCheck) {
          attendCheck.status = attend.status;
        } else {
          dbAttend.attendList.push({ attendIdx: cache.attendIdx, status: attend.status });
        }
        await dbAttend.save();
      }
    });

    await Promise.all(updateAttendPromises);

    // if (cache.sessionId === sessionId) {
    // const updates = cache.attends.map(attend => {
    //   return {
    //     updateOne: {
    //       filter: { user: attend.user, session: sessionId },
    //       update: {
    //         $set: {
    //           'attendList.$[elem].status': attend.attendList.find(item => item.attendIdx === cache.attendIdx).status
    //         }
    //       },
    //       arrayFilters: [{ 'elem.attendIdx': cache.attendIdx }]
    //     }
    //   };
    // });

    // if (updates.length > 0) {
    //   await Attend.bulkWrite(updates);
    // }

    cache.sessionId = null;
    cache.attendIdx = null;
    cache.attends = [];
  }
}

module.exports = { createAttendCache, initAttendCache, getAttendCache, flushAttendCache };
