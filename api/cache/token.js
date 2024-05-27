const Attend = require('../models/attend');
const { Mutex } = require('async-mutex');

const TTL = 600000; // 10분 (600,000 밀리초)

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

  // Token 삭제 함수
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

  // 토큰 생성 함수
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

      attends.forEach(attend => {
        let attendAtIdx = attend.attendList.find(item => item.attendIdx === attendIdx);
        if (!attendAtIdx) {
          attendAtIdx = { attendIdx, status: false };
          attend.attendList.push(attendAtIdx);
        } else {
          attendAtIdx.status = false;
        }
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
    } finally {
      release();
    }
  },

  // 토큰 재시작 함수
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

      for (const attend of this.attendCache) {
        const attendCheck = attend.attendList.find(item => item.attendIdx === this.attendIdx);
        if (attendCheck) {
          attendCheck.status = false;
        } else {
          attend.attendList.push({ attendIdx: this.attendIdx, status: false });
        }
      }

      return {
        sessionId: this.sessionId,
        attendIdx: this.attendIdx,
        expireAt: this.expireAt,
        code: this.code
      };
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

  // 현재 출석 캐시 반환 함수
  attendsCache() {
    return this.attendCache;
  }
};

module.exports = AttendanceTokenCache;
