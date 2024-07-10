const mongoose = require('mongoose');

// 출석 정보 : 유저와 세션에 대한 출석리스트
const attendSchema = new mongoose.Schema({
    // 유저 정보 - 'User' 모델의 ObjectId를 참조
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true, // 유저는 필수 값으로 설정
    },
    // 유저 이름 
    userName: {
      type: String,
      required: true
    },
    // 세션 정보 - 'Session' 모델의 ObjectId를 참조
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      required: true, // 세션은 필수 값으로 설정
    },
    // 세션 이름
    sessionName:{
      type: String,
      required: true // 세션 이름은 필수 값으로 설정
    },
    // 세션 날짜
    sessionDate:{
      type: Date,
      required: true // 세션 날짜는 필수 값으로 설정
    },
    // 출석 리스트
    attendList: [{
      // 출석 인덱스
      attendIdx: {
        type: Number,
        required: true, // 출석 인덱스는 필수 값으로 설정
      },
      // 출석 상태 (true: 출석, false: 결석)
      status: {
        type: Boolean,
        default: false, // 기본 값은 false (결석)
      }
    }],
});

// 'Attend' 모델 생성
const Attend = mongoose.model('Attend', attendSchema);

module.exports = Attend;
