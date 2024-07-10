const mongoose = require('mongoose');

// 출석 정보 : 유저와 세션에 대한 출석리스트
const attendSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true, // 유저는 필수 값으로 설정
    },
    session: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session',
        required: true, // 세션은 필수 값으로 설정
    },
    sessionName:{
      type: String,
      required: true
    },
    sessionDate:{
      type: Date,
      required: true
    },
    attendList: [{
      attendIdx: {
        type: Number,
        required: true, // require -> required 로 수정
      },
      status: {
        type: Boolean,
        default: false,
      }
    }],
});

const Attend = mongoose.model('Attend', attendSchema);

module.exports = Attend;
