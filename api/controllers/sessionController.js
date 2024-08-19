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

// 세션 저장? 종료?
exports.saveSessionAttends = async (req,res) => {
  const { sessionId } = req.params;
  
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

// 모든 세션 조회
exports.getAllSessions = async (req, res) => {
  try {
    const sessions = await Session.find({});
    res.status(200).send(sessions);
  } catch (error) {
    res.status(500).send({ message: "세션을 가져오는 중 오류가 발생했습니다", error });
  }
};

// 하나의 세션 조회 + 해당 세션의 모든 출석도 조회
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