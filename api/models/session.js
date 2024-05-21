const mongoose = require('mongoose');

// 세션
const sessionSchema = new mongoose.Schema({
  name:{
    type: String,
    required: true,
  },
  date: { 
    type: Date,
    required: true,
    index: true
  },
  checksNum: { // 세션당 출석 진행 횟수
    type: Number,
    default: 0,
  }
});

// // 관리자 : 출석 체크시 10분간 존재하는 토큰 생성 -> 10분후 자동 삭제
// // 클라이언트 : 세션id를 가지는 토큰 조회 -> 있으면 출석 진행중, 없으면 출석 진행중x
// const checkToken = new mongoose.Schema({
//   session: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Session',
//     required: true,
//     unique: true,
//     index: true,
//   },
//   attendIdx:{ // 세션의 몇번쨰 출석인지
//     type: Number,
//     required: true,
//   },
//   code: { // 4자리 코드
//     type: String,
//     default: () => String(Math.floor(Math.random() * 10000)).padStart(4, '0'),
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now,
//     index: { expires: '10m' }  // 10분 후 문서가 만료되도록 설정
//   }
// });

const Session = mongoose.model('Session', sessionSchema);
// const CheckToken = mongoose.model('CheckToken', checkToken);

module.exports = Session