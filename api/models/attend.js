const mongoose = require('mongoose');

// 출석 정보 : 유저와 세션에 대한 출석리스트
const attendSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    session: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session',
    },
    attendList: [{
      attendIdx:{
        type: Number,
        require: true,
      },
      status:{
        type: Boolean,
        default: false,
      }
    }],
});

const Attend = mongoose.model('Attend', attendSchema);

module.exports = Attend 