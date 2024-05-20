const { Session, CheckToken } = require('../models/session');
const Attend  = require('../models/attend');
const User = require('../models/user');

exports.createSession = async (req, res) => {
  try {
    const { name, date } = req.body;

    if (!name || !date) {
      return res.status(400).send({ message: "이름과 날짜는 필수입니다" });
    }

    // 1. 세션 생성 쿼리
    const session = new Session({ name, date });
    await session.save(); // 1 DB Write

    // 2. 모든 유저를 가져오는 쿼리
    const users = await User.find(); // 1 DB Read
    if (!users.length) {
      return res.status(400).send({ message: "사용자가 없습니다" });
    }

    // 모든 유저를 map을 통해 각 유저를 id로 가지는 출석정보 생성 (.save()가 프로미스를 반환)
    // 세션 이후에 만들어진 유저는 출석 정보가 없다고 뜸
    // 3. 출석 정보를 생성하는 쿼리 (유저 수 만큼 발생)
    const attendPromises = users.map(user => new Attend({
      user: user._id,
      session: session._id,
      attendList: []
    }).save()); // N DB Writes (유저 수 N 만큼)

    await Promise.all(attendPromises); // 출석정보가 다 save()될때까지 기다림

    res.status(201).send({ message: "세션이 성공적으로 생성되었습니다", session });
  } catch (error) {
    res.status(500).send({ message: "세션 생성 중 오류가 발생했습니다", error });
  }
};

exports.startAttendCheckById = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. 세션을 찾는 쿼리
    const session = await Session.findById(id); // 1 DB Read
    if (!session) {
      return res.status(404).send({ message: "세션을 찾을 수 없습니다" });
    }

    // 일단 3번까지만 출석가능하게
    if (session.checksNum >= 3) {
      return res.status(400).send({ message: "최대 출석 체크 수에 도달했습니다" });
    }

    // 2. 진행 중인 출석 체크를 찾는 쿼리
    const ongoingCheck = await CheckToken.findOne({ session: session._id }); // 1 DB Read
    if (ongoingCheck) {
      return res.status(400).send({ message: "이미 출석 체크가 진행 중입니다." });
    }

    // 토큰 생성
    // 3. 출석 체크 토큰 생성 쿼리
    const token = new CheckToken({ session: session._id, attendIdx: session.checksNum });
    await token.save(); // 1 DB Write

    // 세션 만들시 만들었던 모든 유저 출석 정보(Attend)의 출석리스트(attendList)에 push
    // 4. 모든 출석 정보를 찾는 쿼리
    const attends = await Attend.find({ session: session._id }); // 1 DB Read

    // 5. 출석 정보를 업데이트하는 쿼리 (출석 정보 수 만큼 발생)
    const updateAttendPromises = attends.map(attend => {
      attend.attendList.push({ attendIdx: session.checksNum, status: false });
      return attend.save(); // N DB Writes (출석 정보 수 N 만큼)
    });
    await Promise.all(updateAttendPromises); // N DB Writes

    // 여기까지 왔다면 에러가 없으므로 세션에 출석체크 횟수 증가(참고: MAX_idx = checksNum - 1)
    // 6. 세션 업데이트 쿼리
    session.checksNum += 1;
    await session.save(); // 1 DB Write

    res.status(201).send({ message: "출석 체크가 시작되었습니다", code: token.code, attendIdx: token.attendIdx });
  } catch (error) {
    res.status(500).send({ message: "출석 체크 시작 중 오류가 발생했습니다", error });
  }
};

// 출석재시작
exports.restartAttendCheckById = async (req, res) => {
  try {
    const { sessionId, attendIdx } = req.params;

    // 1. 세션을 찾는 쿼리
    const session = await Session.findById(sessionId); // 1 DB Read
    if (!session) {
      return res.status(404).send({ message: "세션을 찾을 수 없습니다" });
    }

    if (attendIdx >= session.checksNum) {
      return res.status(400).send({ message: "출석 체크가 아직 시작되지 않았습니다" });
    }

    // 지금 출석체크 중인지
    // 2. 진행 중인 출석 체크를 찾는 쿼리
    const ongoingCheck = await CheckToken.findOne({ session: sessionId }); // 1 DB Read
   
    if (!ongoingCheck) { // 출석이 종료되서 토큰이 만료된경우
      // 3. 모든 출석 정보를 찾는 쿼리
      const attends = await Attend.find({ session: session._id }); // 1 DB Read

      // 출석 정보 초기화
      // 4. 출석 정보를 초기화하는 쿼리 (출석 정보 수 만큼 발생)
      const initAttendPromises = attends.map(attend => {
        const attendCheck = attend.attendList.find(item => item.attendIdx === attendIdx);
        if (attendCheck) {
          attendCheck.status = false;
        }
        return attend.save(); // N DB Writes (출석 정보 수 N 만큼)
      });

      await Promise.all(initAttendPromises); // N DB Writes

      // 새 토큰 발행
      // 5. 새 출석 체크 토큰 생성 쿼리
      const token = new CheckToken({ session: session._id, attendIdx });
      await token.save(); // 1 DB Write
    } 
    else { // 출석 진행 중 일경우
      if(ongoingCheck.attendIdx != attendIdx){ // 인덱스가 다르면 -> 다른 출석체크 진행중
        return res.status(400).send({ message: "다른 출석 체크가 진행 중입니다." });
      }
      // 코드 바꾸고
      ongoingCheck.code = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
      // 시간 지금으로 
      ongoingCheck.date = Date.now();
      await ongoingCheck.save(); // 1 DB Write
      token = ongoingCheck;
    }

    res.status(201).send({ message: "출석 체크가 재시작되었습니다", code: token.code, attendIdx: token.attendIdx });
  } catch (error) {
    res.status(500).send({ message: "출석 체크 재시작 중 오류가 발생했습니다", error });
  }
};

// 조기 종료
exports.endAttendCheckById = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. 세션을 찾는 쿼리
    const session = await Session.findById(id); // 1 DB Read
    if (!session) {
      return res.status(404).send({ message: "세션을 찾을 수 없습니다" });
    }

    // 토큰이 있는지
    // 2. 진행 중인 출석 체크를 찾는 쿼리
    const ongoingCheck = await CheckToken.findOne({ session: session._id }); // 1 DB Read
    if (!ongoingCheck) {
      return res.status(400).send({ message: "출석 체크가 이미 종료되었습니다" });
    }

    // 3. 출석 체크 토큰 삭제 쿼리
    await ongoingCheck.deleteOne(); // 1 DB Delete

    res.status(201).send({ message: "출석 체크가 성공적으로 종료되었습니다" });
  } catch (error) {
    res.status(500).send({ message: "출석 체크 종료 중 오류가 발생했습니다", error });
  }
};

exports.checkAttend = async (req, res) => {
  try {
    const { userId, sessionId } = req.params;
    const { code } = req.body;

    // 1. 진행 중인 출석 체크를 찾는 쿼리
    const token = await CheckToken.findOne({ session: sessionId }); // 1 DB Read
    if (!token) {
      return res.status(404).send({ message: "진행 중인 출석 체크를 찾을 수 없습니다" });
    }

    // 2. 출석 정보를 찾는 쿼리
    const attend = await Attend.findOne({ user: userId, session: sessionId }); // 1 DB Read
    if (!attend) {
      return res.status(404).send({ message: "출석 기록을 찾을 수 없습니다" });
    }

    // 사용자의 세션에 대한 출석정보 리스트에서 해당 인덱스의 요소.... 미안.
    // 3. 출석 체크 리스트에서 해당 인덱스를 찾는 로직 (메모리 상에서 처리)
    const attendCheck = attend.attendList.find(item => item.attendIdx === token.attendIdx);
    if (!attendCheck) {
      return res.status(404).send({ message: "이 인덱스에 대한 출석 체크를 찾을 수 없습니다" });
    }

    if (code !== token.code) {
      return res.status(400).send({ message: "잘못된 코드입니다" });
    }

    if (attendCheck.status) {
      return res.status(400).send({ message: "이미 출석 완료되었습니다", attend });
    }

    // 4. 출석 상태 업데이트 쿼리
    attendCheck.status = true;
    await attend.save(); // 1 DB Write

    res.status(201).send({ message: "출석이 확인되었습니다!", attend });
  } catch (error) {
    res.status(500).send({ message: "출석 확인 중 오류가 발생했습니다", error });
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

