const jwt = require("jsonwebtoken");
const User = require("../models/user");
const SECRET_KEY = "piro"; // 나중에 환경 파일


// JWT 검증 미들웨어
const authenticateToken = async (req, res, next) => {
  let token;

  const authHeader = req.headers["authorization"];
  if (authHeader) {
    token = authHeader.split(" ")[1];
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (!token) return res.status(401).send({ message: 'Unauthorized: No token provided' }); // 토큰 없음

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    console.log("Decoded Token:", decoded);
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
