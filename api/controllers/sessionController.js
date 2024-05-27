const Session = require('../models/session');
const Attend = require('../models/attend');
const User = require('../models/user');
const AttendanceTokenCache = require('../cache/token');

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
    
    await Attend.insertMany(attendDocuments);

    res.status(201).send({ message: "세션이 성공적으로 생성되었습니다", session });
  } catch (error) {
    res.status(500).send({ message: "세션 생성 중 오류가 발생했습니다", error });
  }
};

exports.startAttendCheckBySession = async (req, res) => {
  try {
    const { id } = req.params;

    const isToken = AttendanceTokenCache.nowToken();
    if (isToken) {
      return res.status(400).send({ message: "이미 출석 체크가 진행 중입니다.", code: isToken.code });
    }

    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).send({ message: "세션을 찾을 수 없습니다" });
    }

    if (session.checksNum >= 3) {
      return res.status(400).send({ message: "최대 출석 체크 수에 도달했습니다" });
    }

    const attend = await Attend.find({ session: session._id });
    if (!attend.length) {
      return res.status(400).send({ message: "출석 정보가 없습니다." });
    }

    const token = await AttendanceTokenCache.setToken(id, session.checksNum, attend);
    if (!token) {
      return res.status(400).send({ message: "출석 체크 생성중 오류가 발생했습니다." });
    }

    session.checksNum += 1;
    await session.save();
    res.status(201).send({ message: "출석 체크가 시작되었습니다", code: token.code, attendIdx: token.attendIdx });
  } catch (error) {
    res.status(500).send({ message: "출석 체크 시작 중 오류가 발생했습니다", error });
  }
};

exports.restartAttendCheckBySession = async (req, res) => {
  try {
    const { sessionId, attendIdx } = req.params;

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).send({ message: "세션을 찾을 수 없습니다" });
    }

    if (attendIdx >= session.checksNum) {
      return res.status(400).send({ message: "출석 체크가 아직 시작되지 않았습니다" });
    }

    const token = AttendanceTokenCache.nowToken();
    if (!token) {
      const attends = await Attend.find({ session: session._id });

      const initAttendPromises = attends.map(attend => {
        attend.attendList = attend.attendList.filter(item => item.attendIdx !== attendIdx);
        return attend.save();
      });

      await Promise.all(initAttendPromises);

      const newToken = await AttendanceTokenCache.setToken(sessionId, attendIdx, attends);
      if (!newToken) {
        return res.status(400).send({ message: "이미 출석 체크가 진행 중입니다." });
      }
      return res.status(201).send({ message: "출석 체크가 재시작되었습니다", code: newToken.code, attendIdx: newToken.attendIdx });
    } else {
      if (token.attendIdx !== parseInt(attendIdx, 10)) {
        return res.status(400).send({ message: "다른 출석 체크가 진행 중입니다." });
      }

      const restartedToken = await AttendanceTokenCache.restartToken();
      console.log(restartedToken)
      return res.status(201).send({ message: "출석 체크가 재시작되었습니다", code: restartedToken.code, attendIdx: restartedToken.attendIdx });
    }
  } catch (error) {
    res.status(500).send({ message: "출석 체크 재시작 중 오류가 발생했습니다", error });
  }
};

exports.checkAttend = async (req, res) => {
  try {
    const { userId } = req.params;
    const { code } = req.body;

    const token = AttendanceTokenCache.nowToken();
    if (!token) {
      return res.status(404).send({ message: "진행 중인 출석 체크를 찾을 수 없습니다" });
    }

    if (code !== token.code) {
      return res.status(400).send({ message: "잘못된 코드입니다" });
    }

    const attendCache = AttendanceTokenCache.attendsCache();
    if (!attendCache) {
      return res.status(404).send({ message: "출석 정보를 찾을 수 없습니다" });
    }

    const attend = attendCache.find(a => a.user.toString() === userId);
    if (attend) {
      const attendCheck = attend.attendList.find(item => item.attendIdx === token.attendIdx);
      if (attendCheck) {
        if (attendCheck.status) {
          return res.status(400).send({ message: "이미 출석 했습니다." });
        }
        attendCheck.status = true;
      } else {
        return res.status(404).send({ message: "출석 체크 정보를 찾을 수 없습니다." });
      }
    } else {
      return res.status(404).send({ message: "사용자 출석 정보를 찾을 수 없습니다." });
    }

    res.status(201).send({ message: "출석이 확인되었습니다!" });
  } catch (error) {
    console.error("출석 확인 중 오류가 발생했습니다", error);
    res.status(500).send({ message: "출석 확인 중 오류가 발생했습니다", error });
  }
};

exports.endAttendCheck = async (req, res) => {
  try {
    const token = AttendanceTokenCache.nowToken();
    if (!token) {
      return res.status(400).send({ message: "출석 체크가 이미 종료되었습니다" });
    }

    await AttendanceTokenCache.flushCache();

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
