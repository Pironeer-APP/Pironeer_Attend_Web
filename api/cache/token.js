const Attend = require('../models/attend');
// 동시성 문제를 해결하기위해 한 번에 하나의 비동기 작업만 해당 자원에 접근 가능
// 작업이 끝나기 전까지 다른 작업이 실행되지 않도록 보장
const { Mutex } = require('async-mutex');

const TTL = 600000; // 10분 (600,000 밀리초)

// 출석에 대한 토큰이자 캐시 객체(서버 당 하나의 객체만 필요하므로 객체로 선언)
const AttendanceTokenCache = {
  sessionId: null,
  expireAt: null,
  attendIdx: null,
  code: null,
  cacheTimeout: null,
  attendCache: [],
  mutex: new Mutex(),

  // 캐시 리셋 함수
  resetCache() {
    this.sessionId = null;
    this.expireAt = null;
    this.attendIdx = null;
    this.code = null;
    this.attendCache = [];

    if (this.cacheTimeout) {
      clearTimeout(this.cacheTimeout);
      this.cacheTimeout = null;
    }
  },

  // 캐시 삭제 후 데이터 베이스에 전달 함수
  async flushCache() {
    if (this.attendCache.length > 0) {
      const bulkOps = this.attendCache.map(attend => ({
        updateOne: {
          filter: { user: attend.user, session: this.sessionId },
          update: { $set: { attendList: attend.attendList } },
          upsert: true
        }
      }));

      try {
        const result = await Attend.bulkWrite(bulkOps);
        console.log('데이터베이스에 출석 정보 저장 성공:', result);
      } catch (error) {
        console.error('데이터베이스에 출석 정보 저장 실패:', error);
      }
    }

    this.resetCache();
  },

  // 토큰 생성 후 토큰 반환 함수
  async setToken(sessionId, attendIdx, attends) {
    const release = await this.mutex.acquire(); // Mutex 잠금
    try {
      if (this.sessionId) {
        console.log('이미 출석 체크 중입니다.');
        return null;
      }

      this.expireAt = Date.now() + TTL;
      this.code = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
      this.sessionId = sessionId;
      this.attendIdx = attendIdx;
      this.attendCache = [];

      // 매개변수로 attend배열을 받아옴
      attends.forEach(attend => {
        // attend중 idx가 맞은 거만 가져옴
        let attendAtIdx = attend.attendList.find(item => item.attendIdx == attendIdx);
        if (!attendAtIdx) { // 이게 없다면 생성 후 캐시에 저장
          attendAtIdx = { attendIdx, status: false };
          attend.attendList.push(attendAtIdx);
        } else {
          // 있다면 false로 바꿔
          attendAtIdx.status = false;
        }
        // 캐시에 저장 (save를 하지 않으므로 디비에 영향 x)
        this.attendCache.push(attend);
      });

      this.cacheTimeout = setTimeout(async () => {
        if (this.expireAt <= Date.now()) {
          await this.flushCache();
        }
      }, TTL);

      return {
        sessionId: this.sessionId,
        attendIdx: this.attendIdx,
        expireAt: this.expireAt,
        code: this.code
      };
      // 임계 구역(이 위 코드는 이 작업이 끝난 이후에 다른 작업 가능)
    } finally {
      release();
    }
  },

  // 토큰 재시작 후 토큰 반환 함수
  async restartToken() {
    const release = await this.mutex.acquire(); // Mutex 잠금
    try {
      if (!this.sessionId) {
        console.log('토큰이 없습니다. 먼저 토큰을 생성하세요.');
        return null;
      }

      this.code = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
      this.expireAt = Date.now() + TTL;

      if (this.cacheTimeout) {
        clearTimeout(this.cacheTimeout);
      }

      this.cacheTimeout = setTimeout(async () => {
        if (this.expireAt <= Date.now()) {
          await this.flushCache();
        }
      }, TTL);
      
      this.attendCache.forEach(attend => {
        const attendCheck = attend.attendList.find(item => item.attendIdx == this.attendIdx);
        if (attendCheck) { 
          attendCheck.status = false;
        } else {
          attend.attendList.push({ attendIdx: this.attendIdx, status: false });
        }
      });      

      return {
        sessionId: this.sessionId,
        attendIdx: this.attendIdx,
        expireAt: this.expireAt,
        code: this.code
      };
      
      // 임계 구역(이 위 코드는 이 작업이 끝난 이후에 다른 작업 가능)
    } finally {
      release();
    }
  },

  // 현재 토큰 정보 반환 함수
  nowToken() {
    if (this.sessionId) {
      return {
        sessionId: this.sessionId,
        attendIdx: this.attendIdx,
        expireAt: this.expireAt,
        code: this.code
      };
    }
    return null;
  },

  // 유저가 출석체크 했는지 확인
  isCheckedByUser(userId,attendIdx){
    attendList = this.attendCache.find(attend => attend.user.toString() == userId).attendList
    return attendList.find(obj => obj.attendIdx == attendIdx).status
  },

  // 현재 출석 캐시 반환 함수
  attendsCache() {
    return this.attendCache;
  }
};

module.exports = AttendanceTokenCache;
