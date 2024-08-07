const mongoose = require('mongoose');
require('dotenv').config();


// // 쿼리 통계를 저장할 객체
// const queryStats = {
//   totalQueries: 0,
//   readQueries: 0,
//   writeQueries: 0,
//   queries: [],
// };

// // 읽기 메소드와 쓰기 메소드 리스트
// const readMethods = ['find', 'findOne', 'findById', 'countDocuments', 'aggregate'];
// const writeMethods = ['insertOne', 'insertMany', 'updateOne', 'updateMany', 'deleteOne', 'deleteMany', 'findOneAndUpdate', 'findOneAndDelete'];

// // 주석 해제시 퀴리 로그 남고 읽기 쓰기 분석해 통계 저장
// // 디버그 콜백 함수 설정
// mongoose.set('debug', function (collectionName, method, query, doc, options) {
//   queryStats.totalQueries += 1; // 전체 쿼리 수 증가

//   // 쿼리 종류에 따라 읽기/쓰기 통계 증가
//   if (readMethods.includes(method)) {
//     queryStats.readQueries += 1;
//   } else if (writeMethods.includes(method)) {
//     queryStats.writeQueries += 1;
//   }

//   // 쿼리 세부 정보 기록
//   queryStats.queries.push({
//     collection: collectionName,
//     method: method,
//     query: query,
//     doc: doc,
//     options: options,
//   });

//   // 쿼리 정보 출력
//   console.log(`Collection: ${collectionName}, Method: ${method}, Query:`, query, 'Doc:', doc, 'Options:', options);
// });

// MongoDB URI
const uri = process.env.MONGODB_URI;

// MongoDB 연결 함수
const connectDB = async () => {
  try {
    // MongoDB 연결
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB Connected');
    
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
