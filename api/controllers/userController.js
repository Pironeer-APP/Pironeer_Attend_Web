const User = require("../models/user");
const Attend = require('../models/attend');
const Session = require('../models/session')
const Deposit = require('../models/deposit');
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { google } = require('googleapis');
require('dotenv').config();

// JWT 비밀키
const JWT_SECRET = "piro";

// 유저 회원가입()
exports.createUser = async (req, res) => {
  try {
    const { username, password, email } = req.body;
    const user = new User({ username, password, email });
    await user.save();

    //deposit 문서 생성
    const deposit = new Deposit({
      user: user._id,
      userName: user.username,
      assignmentList: [],
      defendList: [],
      deductionList: []
    });
    await deposit.save();

    res.status(201).send({ message: "User created successfully", user });
  } catch (error) {
    res.status(400).send({ message: "Error creating user", error });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({});
    res.status(200).send(users);
  } catch (error) {
    res.status(500).send({ message: "Error retrieving users", error });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    res.status(200).send(user);
  } catch (error) {
    res.status(500).send({ message: "Error retrieving user", error });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { username, email, password },
      { new: true }
    );
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    res.status(200).send({ message: "User updated successfully", user });
  } catch (error) {
    res.status(400).send({ message: "Error updating user", error });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    res.status(200).send({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).send({ message: "Error deleting user", error });
  }
};

// 유저 로그인
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user){
      return res.status(401).send({ message:"해당 유저가 없습니다" });
    } 

    if (! await bcrypt.compare(password, user.password)) {
      return res.status(401).send({ message:"비밀번호 틀림"});
    }

    const token = jwt.sign({ _id: user._id, _isAdmin: user.isAdmin }, JWT_SECRET, { expiresIn: "1h" });
    
    res.status(200).send({ message: "Login successfully", token : token, user : user });
  } catch (error) {
    res.status(500).send({ message:"Login error" });
  }
};

//서버 실행시 1회 관리자 유저가 없을 경우 생성
exports.createInitAdmin = async () => {
  try {
    const adminExists = await User.findOne({ isAdmin: true });
    if (!adminExists) {
      const admin = new User({
        username: "admin",
        password: "piroAdmin",
        email: "pirogramming.official@gmail.com",
        isAdmin: true,
      });
      await admin.save();
      console.log("Admin user created");
    }
  } catch (error) {
    res.status(500).send('Login error');
  }
};

//관리자가 일반유저를 관리자 유저로 만들어주기.
exports.updateUserToAdmin = async (req, res) => {
  const { id } = req.params;
  const { isAdmin } = req.body;

  try {
      const user = await User.findById(id);
      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      user.isAdmin = isAdmin;
      await user.save();
      res.json({ message: 'User admin status updated' });
  } catch (err) {
      res.status(500).json({ message: 'Server error' });
  }
};

// 출석 기록을 모두 전달하는 컨트롤러
exports.ShowCheckAttendance = async (req, res) => {
  try {
    let absent = 0;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).send({ message: "사용자를 찾을 수 없습니다." });
    }

    const attendances = await Attend.find({ user: user });
    if (!attendances || attendances.length === 0) {
      return res.status(404).send({ message: "출석 정보가 없습니다." });
    }

    // 이 부분 주석 처리?
    const sessionIds = attendances.map(attendance => attendance.session);
    const sessions = await Session.find({ _id: { $in: sessionIds } });

    const sessionMap = sessions.reduce((map, session) => {
      map[session._id] = session;
      return map;
    }, {});

    const updatedAttendances = attendances.map(attendance => {
      const session = sessionMap[attendance.session];
      if (session) {
        const updatedAttendance = {
          ...attendance._doc, // 기존 attendance 객체의 복사본 생성
          session_name: session.name,
          session_date: session.date
        };
        let noCheck = 0;
        attendance.attendList.forEach(attend => {
          if (attend.status === false) {
            noCheck += 1;
          }
        });
        if (noCheck === 1) {
          absent += 0.5;
        } else if (noCheck >= 2) {
          absent += 1;
        }
        return updatedAttendance;
      }
      return attendance;
    });

    res.status(200).send({ message: "출석 정보가 확인되었습니다.", attendances: updatedAttendances, absent });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "출석 정보를 확인하는 중 오류가 발생했습니다." });
  }
};

exports.updateUserAttendance =  async (req, res) => {
  try {
      const { userId, sessionId, attendIdx, status } = req.body;

      // 해당하는 유저의 원하는 날의 세션 찾기
      const attendance = await Attend.findOne({ user: userId, session: sessionId });

      if (!attendance) {
          return res.status(404).json({ message: 'Attendance record not found' });
      }

      // 해당 인덱스의 출석 찾기
      const attendTime = attendance.attendList.find(time => time.attendIdx === attendIdx);

      if (!attendTime) {
          return res.status(404).json({ message: 'Attendance entry not found' });
      }

      // 상태 업데이트하기
      attendTime.status = status;

      // DB에 업데이트
      await attendance.save();

      res.status(200).send({ message: '성공적으로 데이터를 옮겼습니다.' });
  } catch (error) {
    console.error('데이터를 옮기는데 실패했습니다', error);
    res.status(500).send('데이터를 옮기는데 실패했습니다');
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
      const sheets = google.sheets({ version: 'v4', auth });
      
      const users = await User.find({}, 'username');
      const values = users.map(user => [user.username]);
      
      const response = await sheets.spreadsheets.values.append({
          spreadsheetId: SPREADSHEET_ID,
          range: 'Sheet1!A2', // 데이터를 추가할 범위를 설정하세요.
          valueInputOption: 'RAW',
          resource: {
              values
          }
      });
      res.status(200).send('성공적으로 데이터를 옮겼습니다.');
  } catch (error) {
    console.error('데이터를 옮기는데 실패했습니다', error);
    res.status(500).send('데이터를 옮기는데 실패했습니다');
  }
};