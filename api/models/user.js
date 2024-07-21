const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// 스키마 정의
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  isAdmin: { type: Boolean, default: false },
  batch: {}
});

// 비밀번호를 저장하기 전에 암호화
UserSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// User 모델 생성
const User = mongoose.model("User", UserSchema);

module.exports = User;
