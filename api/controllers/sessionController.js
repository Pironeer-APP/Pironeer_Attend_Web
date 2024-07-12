const Session = require('../models/session');
const Attend = require('../models/attend');
const User = require('../models/user');
const AttendanceTokenCache = require('../cache/token');
const { google } = require('googleapis');
require('dotenv').config();

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
      userName: user.username,
      session: session._id,
      sessionName : session.name,
      sessionDate : session.date,
      attendList: []
    }));
    
    await Attend.insertMany(attendDocuments);

    res.status(201).send({ message: "세션이 성공적으로 생성되었습니다", session });
  } catch (error) {
    res.status(500).send({ message: "세션 생성 중 오류가 발생했습니다", error });
  }
};

//세션 지우기
exports.deleteSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).send({ message: "세션 ID가 필요합니다" });
    }

    // 세션이 존재하는지 확인
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).send({ message: "세션을 찾을 수 없습니다" });
    }

    // 세션과 관련된 출석 정보를 삭제 -> 로그 남기기위해 attend는 디비에서 삭제 xs
    // await Attend.deleteMany({ session: sessionId });

    // 세션 삭제
    await Session.findByIdAndDelete(sessionId);

    res.status(200).send({ message: "세션이 성공적으로 삭제되었습니다" });
  } catch (error) {
    res.status(500).send({ message: "세션 삭제 중 오류가 발생했습니다", error });
  }
};

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

// 출석체크 진행여부
exports.isCheck = async (req, res) => {
  try {
    const token = AttendanceTokenCache.nowToken()
    if (!token) {
      return res.status(404).send({ message: "출석 체크 진행중이 아닙니다." });
    }
    // 코드 부분만 제거
    const { code, ...tokenWithOutCode } = token;
    res.status(200).send({ message: "출석체크 진행중", token: tokenWithOutCode});
  } catch (error) {
    console.error("출석 확인 중 오류가 발생했습니다", error);
    res.status(500).send({ message: "출석 확인 중 오류가 발생했습니다", error });
  }
};

// 출석체크 진행여부
exports.isCheckAttend = async (req, res) => {
  try {
    const token = AttendanceTokenCache.nowToken()
    if (!token) {
      return res.status(404).send({ message: "출석 체크 진행중이 아닙니다." });
    }
    // 코드 부분만 제거
    const { code, ...tokenWithOutCode } = token;
    user = req.user
    userCheckedStatus = AttendanceTokenCache.isCheckedByUser(user.id,token.attendIdx)
    res.status(200).send({ message: "출석체크 진행중", token: tokenWithOutCode, isChecked : userCheckedStatus});
  } catch (error) {
    console.error("출석 확인 중 오류가 발생했습니다", error);
    res.status(500).send({ message: "출석 확인 중 오류가 발생했습니다", error });
  }
};

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

exports.getAllSessions = async (req, res) => {
  try {
    const sessions = await Session.find({});
    res.status(200).send(sessions);
  } catch (error) {
    res.status(500).send({ message: "세션을 가져오는 중 오류가 발생했습니다", error });
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

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const KEYFILE_PATH = process.env.KEYFILE_PATH;

const auth = new google.auth.GoogleAuth({
    keyFile: KEYFILE_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const sheets = google.sheets({ version: 'v4', auth });

exports.spreadsheets = async (req, res) => {
  try {
    // 세션 데이터 가져오기
    const sessions = await Session.find({});

    // 세션 데이터를 가로로 배열 형식으로 변환
    const columns = [
      ...sessions.map(session => [
        session.name + "1st",
        session.name + "2nd",
        session.name + "3rd"
      ]).flat()
    ];

    // 스프레드시트에 데이터를 추가
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!B1', // 데이터를 추가할 범위 설정
      valueInputOption: 'RAW',
      resource: {
        values: [columns]
      }
    });

    res.status(200).send('성공적으로 데이터를 옮겼습니다.');
  } catch (error) {
    console.error('데이터를 옮기는데 실패했습니다', error);
    res.status(500).send('데이터를 옮기는데 실패했습니다');
  }
};


function getColumnLetter(colIndex) {
  let temp, letter = '';
  while (colIndex > 0) {
    temp = (colIndex - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    colIndex = (colIndex - temp - 1) / 26;
  }
  return letter;
}


exports.sessionToSpreadsheet = async (req, res) => {
  try {
    const sheets = google.sheets({ version: 'v4', auth });

    const { id } = req.params;
    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).send({ message: "세션을 찾을 수 없습니다" });
    }

    const attends = await Attend.find({ session: session._id });

    // 출석 정보를 배열 형식으로 변환
    const rows = attends.map(attend => [
      ...attend.attendList.map(a => a.status)
    ]);

    // 스프레드시트의 데이터 읽어오기
    const range = 'Sheet1!2:2'; 
    const getResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: range,
    });

    // 첫 번째 빈 셀 찾기
    const rowValues = getResponse.data.values ? getResponse.data.values[0] : [];
    let emptyColumnIndex = rowValues.length + 1; 

    // 아스키코드로 열 이름 계산 (A부터 시작)
    const nextColumnLetter = getColumnLetter(emptyColumnIndex);

    // 데이터 추가 범위 설정
    const targetRange = `Sheet1!${nextColumnLetter}2`;

    // 스프레드시트에 데이터를 추가
    const appendResponse = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: targetRange,
      valueInputOption: 'RAW',
      resource: {
        values: rows
      }
    });

    res.status(200).send('성공적으로 데이터를 옮겼습니다.');
  } catch (error) {
    console.error('데이터를 옮기는데 실패했습니다', error);
    res.status(500).send('데이터를 옮기는데 실패했습니다');
  }
};

exports.firstSessionToSpreadsheet = async (req, res) => {
  try {
    const sheets = google.sheets({ version: 'v4', auth });

    const { id } = req.params;
    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).send({ message: "세션을 찾을 수 없습니다" });
    }

    const attends = await Attend.find({ session: session._id });

    // 출석 정보를 배열 형식으로 변환
    const rows = attends.map(attend => [
      attend.attendList[0].status
    ]);

    // 스프레드시트의 데이터 읽어오기
    const range = 'Sheet1!2:2'; 
    const getResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: range,
    });

    // 첫 번째 빈 셀 찾기
    const rowValues = getResponse.data.values ? getResponse.data.values[0] : [];
    let emptyColumnIndex = rowValues.length + 1; 

    // 아스키코드로 열 이름 계산 (A부터 시작)
    const nextColumnLetter = getColumnLetter(emptyColumnIndex);

    // 데이터 추가 범위 설정
    const targetRange = `Sheet1!${nextColumnLetter}2`;

    // 스프레드시트에 데이터를 추가
    const appendResponse = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: targetRange,
      valueInputOption: 'RAW',
      resource: {
        values: rows
      }
    });

    res.status(200).send('성공적으로 데이터를 옮겼습니다.');
  } catch (error) {
    console.error('데이터를 옮기는데 실패했습니다', error);
    res.status(500).send('데이터를 옮기는데 실패했습니다');
  }
};
exports.secondSessionToSpreadsheet = async (req, res) => {
  try {
    const sheets = google.sheets({ version: 'v4', auth });

    const { id } = req.params;
    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).send({ message: "세션을 찾을 수 없습니다" });
    }

    const attends = await Attend.find({ session: session._id });

    // 출석 정보를 배열 형식으로 변환
    const rows = attends.map(attend => [
      attend.attendList[1].status
    ]);

    // 스프레드시트의 데이터 읽어오기
    const range = 'Sheet1!2:2'; 
    const getResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: range,
    });

    // 첫 번째 빈 셀 찾기
    const rowValues = getResponse.data.values ? getResponse.data.values[0] : [];
    let emptyColumnIndex = rowValues.length + 1; 

    // 아스키코드로 열 이름 계산 (A부터 시작)
    const nextColumnLetter = getColumnLetter(emptyColumnIndex);

    // 데이터 추가 범위 설정
    const targetRange = `Sheet1!${nextColumnLetter}2`;

    // 스프레드시트에 데이터를 추가
    const appendResponse = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: targetRange,
      valueInputOption: 'RAW',
      resource: {
        values: rows
      }
    });

    res.status(200).send('성공적으로 데이터를 옮겼습니다.');
  } catch (error) {
    console.error('데이터를 옮기는데 실패했습니다', error);
    res.status(500).send('데이터를 옮기는데 실패했습니다');
  }
};

exports.thirdSessionToSpreadsheet = async (req, res) => {
  try {
    const sheets = google.sheets({ version: 'v4', auth });

    const { id } = req.params;
    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).send({ message: "세션을 찾을 수 없습니다" });
    }

    const attends = await Attend.find({ session: session._id });

    // 출석 정보를 배열 형식으로 변환
    const rows = attends.map(attend => [
      attend.attendList[2].status
    ]);

    // 스프레드시트의 데이터 읽어오기
    const range = 'Sheet1!2:2'; 
    const getResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: range,
    });

    // 첫 번째 빈 셀 찾기
    const rowValues = getResponse.data.values ? getResponse.data.values[0] : [];
    let emptyColumnIndex = rowValues.length + 1; 

    // 아스키코드로 열 이름 계산 (A부터 시작)
    const nextColumnLetter = getColumnLetter(emptyColumnIndex);

    // 데이터 추가 범위 설정
    const targetRange = `Sheet1!${nextColumnLetter}2`;

    // 스프레드시트에 데이터를 추가
    const appendResponse = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: targetRange,
      valueInputOption: 'RAW',
      resource: {
        values: rows
      }
    });

    res.status(200).send('성공적으로 데이터를 옮겼습니다.');
  } catch (error) {
    console.error('데이터를 옮기는데 실패했습니다', error);
    res.status(500).send('데이터를 옮기는데 실패했습니다');
  }
};