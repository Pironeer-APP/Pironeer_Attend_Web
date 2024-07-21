const mongoose = require('mongoose');

// 세션
const sessionSchema = new mongoose.Schema({
  name: {
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

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session