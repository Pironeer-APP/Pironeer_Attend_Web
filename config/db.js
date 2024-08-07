const mongoose = require('mongoose');
require('dotenv').config();


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
    
    // Mongoose 쿼리 디버그 모드 설정
    mongoose.set('debug', true);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
