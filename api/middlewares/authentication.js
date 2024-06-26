const jwt = require("jsonwebtoken");
const User = require("../models/user");
const SECRET_KEY = "piro"; // 나중에 환경 파일

// JWT 검증 미들웨어
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401); // 토큰 없음

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const user = await User.findById(decoded._id);

    if (!user) {
      return res.sendStatus(404); // 사용자 없음
    }

    req.user = user; // 이 이후에는 req.user가 데이터베이스의 user 임
    next();
  } catch (err) {
    return res.sendStatus(403); // 토큰 무효
  }
};

module.exports = authenticateToken;
