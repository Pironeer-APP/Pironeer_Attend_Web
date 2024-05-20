const attendCacheList = {};

function createAttendCacheList(sessionId, attendIdx, attends) {
  if (attendCacheList[sessionId]) {
    console.log(`이미 출석 체크 중`);
    return false; // 이미 존재하는 경우 false 반환
  }

  attendCacheList[sessionId] = { attendIdx, attends: [] };

  attends.forEach(attend => {
    attend.attendList.push({ attendIdx, status: false });
    attendCacheList[sessionId].attends.push(attend);
  });

  return true; // 새로 설정된 경우 true 반환
}

async function initAttendCacheList(sessionId) {
  const cache = attendCacheList[sessionId];
  if (cache) {
    for (const attend of cache.attends) {
      for (const item of attend.attendList) {
        item.status = false;
      }
    }
  }
}

function getAttendCacheList(sessionId) {
  return attendCacheList[sessionId] ? attendCacheList[sessionId].attends : null;
}

async function flushAttendCacheList(sessionId) {
  const cache = attendCacheList[sessionId];
  if (cache) {
    const updateAttendPromises = cache.attends.map(async attend => {
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

    delete attendCacheList[sessionId];
  }
}

module.exports = { createAttendCacheList, initAttendCacheList, getAttendCacheList, flushAttendCacheList };
