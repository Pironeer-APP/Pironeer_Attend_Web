const Session = require('../models/session');
const Attend = require('../models/attend');
const AttendanceTokenCache = require('../cache/token');
require('dotenv').config();

// 세션에 대한 출석 시작 (인덱스 자동)
exports.startAttendCheckBySession = async (req, res) => {
    try {
      const { id } = req.params;
  
      // 이미 출석체크시
      const isToken = AttendanceTokenCache.nowToken();
      if (isToken) {
        return res.status(400).send({ message: "이미 출석 체크가 진행 중입니다.", code: isToken.code });
      }
  
      // 세션찾기
      const session = await Session.findById(id);
      if (!session) {
        return res.status(404).send({ message: "세션을 찾을 수 없습니다" });
      }
  
      // 3번의 출석까지만 (아래 수정시 n번의 출석까지 가능)
      if (session.checksNum >= 3) {
        return res.status(400).send({ message: "최대 출석 체크 수에 도달했습니다" });
      }
  
      // 모든 출석 정보 조회(만일 세션 생성시 없는 유저는 출석 정보 x)
      const attend = await Attend.find({ session: session._id });
      if (!attend.length) {
        return res.status(400).send({ message: "출석 정보가 없습니다." });
      }
  
      // 출석에 대한 10분 유지 되는 토큰 및 캐시생성
      const token = await AttendanceTokenCache.setToken(id, session.checksNum, attend);
      if (!token) {
        return res.status(400).send({ message: "출석 체크 생성중 오류가 발생했습니다." });
      }
  
      // 출석이 비 정상으로 종료 되어도 상관없이 진행된 걸로 처리 -- > 리스타트 하면 돼
      session.checksNum += 1;
      await session.save();
      res.status(201).send({ message: "출석 체크가 시작되었습니다", code: token.code, attendIdx: token.attendIdx });
    } catch (error) {
      res.status(500).send({ message: "출석 체크 시작 중 오류가 발생했습니다", error });
    }
};
  
// 세션과 인덱스를 받아 인덱스에 해당하는 출석 재시작
exports.restartAttendCheckBySession = async (req, res) => {
    try {
      const { sessionId, attendIdx } = req.params;
  
      // 세션 찾기
      const session = await Session.findById(sessionId);
      if (!session) {
        return res.status(404).send({ message: "세션을 찾을 수 없습니다" });
      }
  
      // 이미 한 출석만 재시작 가능
      if (attendIdx >= session.checksNum) {
        return res.status(400).send({ message: "출석 체크가 아직 시작되지 않았습니다" });
      }
  
      // 진행중인 출석체크 토큰 
      const token = AttendanceTokenCache.nowToken();
      if (!token) { // 토큰이 없을 경우 
        // 데이터베이스에서 출결정보 가져옴
        const attends = await Attend.find({ session: session._id });
  
        // 캐시에 넘김 이떄 출석이 된 것도 캐시에는 출석이 false로 저장(디비에는 영향 x)
        const newToken = await AttendanceTokenCache.setToken(sessionId, attendIdx, attends);
        if (!newToken) { // 이 에러는 일어나지 않아
          return res.status(400).send({ message: "이미 출석 체크가 진행 중입니다." });
        }
        // 방금 시작된 출석이 정상 종료 -> 데이터 베이스가 덮어쓰여짐
        // 비정상으로 종료 -> 데이터 베이스에 영향 x 즉, 원래(재시작 이전)출결정보
        return res.status(201).send({ message: "출석 체크가 재시작되었습니다", code: newToken.code, attendIdx: newToken.attendIdx });
      } else {
        // 숫자로 바꿔서 비교
        if (token.attendIdx !== parseInt(attendIdx, 10)) {
          return res.status(400).send({ message: "다른 출석 체크가 진행 중입니다." });
        }
  
        // 초기화
        const restartedToken = await AttendanceTokenCache.restartToken();
        return res.status(201).send({ message: "출석 체크가 재시작되었습니다", code: restartedToken.code, attendIdx: restartedToken.attendIdx });
      }
    } catch (error) {
      res.status(500).send({ message: "출석 체크 재시작 중 오류가 발생했습니다", error });
    }
};
  
// 출석체크 진행여부 HTTP폴링으로 확인시 
// 부하 최소화를 위해 미들웨어 처리 x
exports.isCheck = async (req, res) => {
    try {
      const token = AttendanceTokenCache.nowToken()
      if (!token) {
        return res.status(404).send({ message: "출석 체크 진행중이 아닙니다." });
      }
      // 코드 부분만 제거
      const user = req.user
      // 출석 체크가 이미 진행 중인 경우 즉시 응답하고 연결 종료
      // 코드 부분만 제거
      const { code, ...tokenWithOutCode } = token;
      const userCheckedStatus = AttendanceTokenCache.isCheckedByUser(user.id,token.attendIdx)
      res.status(200).send({ message: "출석체크 진행중", token: tokenWithOutCode, isChecked: userCheckedStatus});
    } catch (error) {
      console.error("출석 확인 중 오류가 발생했습니다", error);
      res.status(500).send({ message: "출석 확인 중 오류가 발생했습니다", error });
    }
};
  
// 출석체크 진행여부를 sse로 관리
// 이벤트를 클라이언트 마다 확인하는 게 아닌 서버에서 1초마다 확인해 이벤트 발생 시 일괄로 처리

// 연결 중인 클라이언트를 관리하는 배열
let clients = [];

// 클라이언트에 SSE 메시지 전송
const sendSSE = (client, data) => {
    client.res.write(`data: ${JSON.stringify(data)}\n\n`);
};

// 모든 클라이언트에 SSE 메시지 전송
const broadcastSSE = (data) => {
    clients.forEach(client => sendSSE(client, data));
    // 모든 클라이언트와의 연결을 종료
    clients.forEach(client => client.res.end());
    // 클라이언트 목록 초기화
    clients = [];
};

// 출석 체크 진행 여부 확인 API(페이지 접속시 api)
// 클라이언트 연결을 clients배열로 추적하여 관리
exports.isCheckAttendSSE = async (req, res) => {
    try {
        // SSE 헤더 설정
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        // 클라이언트 목록에 추가
        const user = req.user
        const clientId = user.id;
        clients.push({ id: clientId, res });
        console.log(`Client connected: ${clientId}`);

        // 클라이언트가 연결 종료(페이지 종료,네트워크 문제)시 목록에서 제거
        req.on('close', () => {
        clients = clients.filter(client => client.id !== clientId);
        console.log(`Client disconnected: ${clientId}`);
        });

    } catch (error) {
        console.error("출석 확인 중 오류가 발생했습니다", error);
        res.status(500).json({ message: "출석 확인 중 오류가 발생했습니다", error });
    }
};

// 특정 이벤트 발생 시 호출되는 함수
const checkForNewAttendance = async () => {
const newToken = AttendanceTokenCache.nowToken();
    if (newToken) { // 새로운 출석 정보가 추가되었는지 확인
        const { code, ...newTokenWithOutCode } = newToken;
        const data = {
        message: "출석체크 진행중",
        token: newTokenWithOutCode,
        isChecked : false,
        };
        broadcastSSE(data); // 모든 클라이언트에 메시지 전송 및 연결 종료
    }
};

// 1초마다 출석 체크 여부 확인
setInterval(checkForNewAttendance, 1000);

// 출석체크 진행 함수
// 캐시의 코드와 본문의 코드를 비교 후 캐시에 저장
exports.checkAttend = async (req, res) => {
    try {
        const { userId } = req.params;
        const { code } = req.body;

        // 지금 진행중인 출석
        const token = AttendanceTokenCache.nowToken();
        if (!token) {
        return res.status(404).send({ message: "진행 중인 출석 체크를 찾을 수 없습니다" });
        }

        // 코드 비교
        if (code !== token.code) {
        return res.status(400).send({ message: "잘못된 코드입니다" });
        }

        // 출석 정보 가져옴
        const attendCache = AttendanceTokenCache.attendsCache();
        if (!attendCache) {
        return res.status(404).send({ message: "출석 정보를 찾을 수 없습니다" });
        }

        // 출석정보 중 유저에 대한 출석정보
        const attend = attendCache.find(atd => atd.user.toString() == userId);
        // 출석 정보에 대한 예외처리 및 상태 변환
        if (attend) {
        const attendCheck = attend.attendList.find(item => item.attendIdx == token.attendIdx);
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

// 출석체크 종료 함수
exports.endAttendCheck = async (req, res) => {
    try {
        const token = AttendanceTokenCache.nowToken();
        if (!token) {
        return res.status(400).send({ message: "출석 체크가 이미 종료되었습니다" });
        }

        // 캐시 flush 
        await AttendanceTokenCache.flushCache();

        res.status(201).send({ message: "출석 체크가 성공적으로 종료되었습니다" });
    } catch (error) {
        res.status(500).send({ message: "출석 체크 종료 중 오류가 발생했습니다", error });
    }
};

// 내 모든 출석 정보를 준다.
exports.getAllAttends = async (req, res) => {
    try {
      user = req.user
      const attends = await Attend.find({ user: user._id });
      res.status(200).send(attends);
    } catch (error) {
      res.status(500).send({ message: "세션을 가져오는 중 오류가 발생했습니다", error });
    }
};