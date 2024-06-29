const mongoose = require('mongoose');

// 출석 정보 : 유저와 세션에 대한 출석리스트
const attendSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true, // 유저는 필수 값으로 설정
        index: true
    },
    session: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session',
        required: true, // 세션은 필수 값으로 설정
        index: true
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


//
// const mongoose = require('mongoose');

// // 출석 정보 : 유저와 세션에 대한 출석리스트
// const attendSchema = new mongoose.Schema({
//     user: {
//         userId: {
//             type: mongoose.Schema.Types.ObjectId,
//             required: true, // 유저는 필수 값으로 설정
//             index: true
//         },
//         username: {
//             type: String,
//             required: true
//         }
//     },
//     session: {
//         sessionId: {
//             type: mongoose.Schema.Types.ObjectId,
//             required: true, // 세션은 필수 값으로 설정
//             index: true
//         },
//         name: {
//             type: String,
//             required: true
//         },
//         date: {
//             type: Date,
//             required: true
//         }
//     },
//     attendList: [{
//       attendIdx: {
//         type: Number,
//         required: true, // require -> required 로 수정
//       },
//       status: {
//         type: Boolean,
//         default: false,
//       }
//     }],
// });

// const Attend = mongoose.model('Attend', attendSchema);

// module.exports = Attend;

