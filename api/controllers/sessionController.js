const Session  = require('../models/session');
const Attend = require('../models/attend');
const User = require('../models/user');
const { createToken, getToken, restartToken, deleteToken } = require('../cache/token');
const { createAttendCache, initAttendCache ,getAttendCache} = require('../cache/attendCaches');

// 세션 만들기
exports.createSession = async (req, res) => {
  try {
    const { name, date } = req.body;

    if (!name || !date) {
      return res.status(400).send({ message: "이름과 날짜는 필수입니다" });
    }

    const session = new Session({ name, date });
    await session.save();

    const users = await User.find();
    if (!users.length) {
      return res.status(400).send({ message: "사용자가 없습니다" });
    }

    // 모든 사용자에 대한 출결 정보 데이터 베이스 생성
    const attendDocuments = users.map(user => ({
      user: user._id,
      session: session._id,
      attendList: []
    }));
    
    await Attend.insertMany(attendDocuments); // 1 DB Batch Write

    res.status(201).send({ message: "세션이 성공적으로 생성되었습니다", session });
  } catch (error) {
    res.status(500).send({ message: "세션 생성 중 오류가 발생했습니다", error });
  }
};

exports.startAttendCheckById = async (req, res) => {
  try {
    const { id } = req.params;

    if (getToken(id)) {
      return res.status(400).send({ message: "이미 출석 체크가 진행 중입니다." });
    }

    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).send({ message: "세션을 찾을 수 없습니다" });
    }

    if (session.checksNum >= 3) {
      return res.status(400).send({ message: "최대 출석 체크 수에 도달했습니다" });
    }

    // 10분간 유지되는 토큰 생성
    const token = createToken(id, session.checksNum);
    if (!token) {
      return res.status(400).send({ message: "이미 출석 체크가 진행 중입니다.", code : token.code });
    }

    // 세션에 대한 모든 출석정보 조회
    const attends = await Attend.find({ session: session._id });
    if (!attends) {
      return res.status(400).send({ message: "출석 정보가 없습니다." });
    }

    // 출석 정보를 복사한 캐시 생성 -> 캐시에 처리 후 출석 종료 후 일괄로 넘겨짐
    const cache = createAttendCache(session._id, session.checksNum, attends);
    
    if (!cache) {
      return res.status(400).send({ message: "출석 체크 생성 중 문제가 발생했습니다." });
    }
    
    // 성공했으니 출석체크 하나 올리고 저장
    session.checksNum += 1;
    await session.save();

    res.status(201).send({ message: "출석 체크가 시작되었습니다", code: token.code, attendIdx: token.attendIdx });
  } catch (error) {
    res.status(500).send({ message: "출석 체크 시작 중 오류가 발생했습니다", error });
  }
};

exports.restartAttendCheckById = async (req, res) => {
  try {
    const { sessionId, attendIdx } = req.params;

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).send({ message: "세션을 찾을 수 없습니다" });
    }

    if (attendIdx >= session.checksNum) {
      return res.status(400).send({ message: "출석 체크가 아직 시작되지 않았습니다" });
    }

    const token = getToken(sessionId);

    if (!token) { // 토큰이 없다 -> 출석이 종료된 상황
      const attends = await Attend.find({ session: session._id });

      // 데이터 베이스에 넘어간 상황 -> 데이터 베이스 상에서 초기화
      const initAttendPromises = attends.map(attend => {
        const attendCheck = attend.attendList.find(item => item.attendIdx === attendIdx);
        if (attendCheck) {
          attendCheck.status = false;
        }
        return attend.save();
      });

      await Promise.all(initAttendPromises);

      // 다시 캐시 생성
      const cache = createAttendCache(session._id, attendIdx, attends);
      if (!cache) {
        return res.status(400).send({ message: "출석 체크 생성 중 문제가 발생했습니다." });
      }

      // 토큰도 다시 생성
      const newToken = createToken(sessionId, attendIdx);
      return res.status(201).send({ message: "출석 체크가 재시작되었습니다", code: newToken.code, attendIdx: newToken.attendIdx });
    } else { // 이 경우 아직 출석 진행 중 일경우
      if (token.attendIdx != attendIdx) {
        return res.status(400).send({ message: "다른 출석 체크가 진행 중입니다." });
      }
      // 토큰 재시작
      restartToken(sessionId)
      // attendCache 초기화
      await initAttendCache(sessionId);
      
      return res.status(201).send({ message: "출석 체크가 재시작되었습니다", code: token.code, attendIdx: token.attendIdx });
    }
  } catch (error) {
    res.status(500).send({ message: "출석 체크 재시작 중 오류가 발생했습니다", error });
  }
};


exports.checkAttend = async (req, res) => {
  try {
    const { userId, sessionId } = req.params;
    const { code } = req.body;

    const token = getToken(sessionId);
    if (!token) {
      return res.status(404).send({ message: "진행 중인 출석 체크를 찾을 수 없습니다" });
    }

    if (code !== token.code) {
      return res.status(400).send({ message: "잘못된 코드입니다" });
    }

    const attends = getAttendCache(sessionId);

    const attend = attends.find(a => a.user.toString() === userId);
    if (attend) {
      const attendCheck = attend.attendList.find(item => item.attendIdx === token.attendIdx);
      if (attendCheck) {
        attendCheck.status = true;
      }
    } else {
      return res.status(404).send({ message: "출석 정보를 찾을 수 없습니다" });
    }

    res.status(201).send({ message: "출석이 확인되었습니다!" });
  } catch (error) {
    res.status(500).send({ message: "출석 확인 중 오류가 발생했습니다", error });
  }
};

exports.endAttendCheckById = async (req, res) => {
  try {
    const { id } = req.params;

    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).send({ message: "세션을 찾을 수 없습니다" });
    }

    const token = getToken(id);
    if (!token) {
      return res.status(400).send({ message: "출석 체크가 이미 종료되었습니다" });
    }

    await deleteToken(id); // Token 삭제 및 데이터베이스 저장(출석 정보 캐시 저장 후 삭제)

    res.status(201).send({ message: "출석 체크가 성공적으로 종료되었습니다" });
  } catch (error) {
    res.status(500).send({ message: "출석 체크 종료 중 오류가 발생했습니다", error });
  }
};

exports.getAllSessions = async (req, res) => {
  try {
    const sessions = await Session.find({});
    res.status(200).send(sessions);
  } catch (error) {
    res.status(500).send({ message: "세션을 가져오는 중 오류가 발생했습니다", error });
  }
};

exports.getSessionById = async (req, res) => {
  try {
    const { id } = req.params;

    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).send({ message: "세션을 찾을 수 없습니다" });
    }

    const attends = await Attend.find({ session: session._id });
    res.status(200).send({ session, attends });
  } catch (error) {
    res.status(500).send({ message: "세션을 가져오는 중 오류가 발생했습니다", error });
  }
};
