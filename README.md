# Pironeer_Attend_Web

## 프로젝트 설명
이 프로젝트는 동아리 피로그래밍의 출석체크를 위한 것입니다. 주요 기능으로는 출석 확인, 출석 진행, 출석 관리 등이 있으며, Node.js를 사용하여 API를 제공합니다.

## 기술
- **사용된 기술 스택**: 
  - 백엔드: Node.js, Express
  - 데이터베이스: MongoDB
  - 인메모리 캐시: 출석을 위한 하나의 객체를 구현
- **아키텍처**:
  - **모델(Model)**: 데이터베이스와 상호작용하는 로직을 포함합니다.
  - **미들웨어(Middleware)**: 요청 처리 중간에 실행되는 로직으로, 인증, 로그, 데이터 검증 등을 담당합니다.
  - **컨트롤러(Controller)**: 요청을 처리하고 응답을 반환하는 로직을 포함합니다.
  - **라우터(Router)**: 요청 경로와 컨트롤러를 매핑합니다.
- **설계 패턴**: 각 부분을 모듈화하여 유지보수성과 확장성을 높였습니다.
- **성능 최적화**: 인메모리 캐시를 도입하여 데이터베이스 쿼리 횟수를 줄이고 응답 시간을 단축시켰습니다.

## 문제 해결
### 문제 1: 출석이 진행되는 10분간 서버 응답 시간 지연
- **원인 분석**: 데이터베이스에 대한 빈번한 쿼리로 인해 응답 시간이 길어짐.
  - HTTP 폴링으로 출석 진행 여부 확인
  - 기존 데이터베이스에 직접 조회시:
    - 실 사용자(30) * 초당 조회(300) * 데이터베이스 조회(2db read)
- **해결 방법**: 
  - 인메모리 캐시에 하나의 객체를 구현해 사용
  - 데이터베이스를 출석체크 시작시에 한번에 읽어 캐시 객체에 저장 
  - 이 객체를 통해 로직을 진행하다 10분 또는 종료 버튼을 누를 때 일괄로 넘겨주게 해 문제를 해결함
  - 정리하자면 인메모리 캐시를 사용하여 빈번하게 조회되는 데이터를 캐싱함으로써 데이터베이스 쿼리 횟수를 줄임.

### 문제 2: 출석이 진행되는 10분간 서버 부하
- **원인 분석**: 많은 API 요청으로 인해 서버의 부하가 증가함.
  - 모니터링 시 캐시 사용 효과 예상과 다르게 아직도 여부 확인 시 1db read 발생 확인
- **해결 방법**: 
  - 로그인 여부 확인 미들웨어가 등록되어 있었음 
  - 미들웨어를 삭제하여 해결
  - 단지 출석 진행 중인지 여부만을 확인하기 때문에 검증이 필요 없음
  
### 문제 3: id형태로 클라이언트로 넘어감
- **원인 분석**: id형태로 클라이언트로 넘어가서 id에 대한 정보를 얻기 위해 다시 요청을 해야함
  - attend 모델을 넘겨줄 때 유저, 세션을 id로만 전달함, 클라이언트는 이를 식별하기 위해 다시 api를 요청해야함
- **해결 방법**: 
  - 프론트측에서 필요한 정보를 추가로 전달 
  - 몽고디비의 특성을 고려하여 서버 측에서 추가 정보를 찾아 전달이 아닌 비정규화를 통해 해결
  - attend모델에 userName, sessionName, sessionDate를 추가하여 마이그레이션 및 서버 로직 변경
  - 기존 프론트와도 통신이 가능하도록 기존 모델에서 수정이 아닌 추가만 진행
  
### 해결 중인 문제
1. HTTP 폴링 대신에 SSE 적용으로 더 빠르게
2. 10분간의 출석 진행 중에 자신이 출석했는지를 확인하는 API 구성 -> 이는 폴링으로 할 시 유저를 식별해야 하므로 SSE 구현 후
3. attend객체가 점점 많아짐 -> 다이나믹 url로 퀴리스트링에 따라 처리해 응답

## 설치 및 사용법
### 설치
1. 저장소를 클론합니다:
    ```bash
    git clone https://github.com/Pironeer-APP/Pironeer_Attend_Web.git
    ```
2. 종속성을 설치합니다:
    ```bash
    cd Pironeer_Attend_Web
    npm install
    ```

### 사용법
1. 환경에 맞게 app.js와 스웨거 파일, 환경변수 파일을 변경합니다.

2. 개발 서버를 시작합니다:
    ```bash
    node app.js
    또는
    pm2 start app
    ```

3. 브라우저에서 `http://localhost:3000/api-docs/`에 접속합니다.

## 프로젝트 구조
```plaintext
project
├──api
    ├── cache
    ├── models        # 데이터베이스 모델 정의
    ├── middleware    # 미들웨어 로직
    ├── controllers   # 요청을 처리하는 컨트롤러
    ├── routes        # 라우터 설정
├── config
├── swagger        # 스웨거 설정 파일
├── app.js
├── .env           # 환경변수 파일
└── .gitignore     
```

# API 개요

이 API는 출석 관리 시스템을 위한 RESTful API입니다. 사용자, 세션, 출석 정보를 관리할 수 있습니다.

## 인증 방법

이 API는 JWT(JSON Web Token) 인증 방식을 사용합니다. 모든 요청에는 헤더에 토큰을 포함해야 합니다:

인증 방법
이 API는 JWT (JSON Web Token) 인증 방식을 사용합니다. 모든 요청에는 헤더에 토큰을 포함해야 합니다. 다음은 인증 방법에 대한 자세한 설명입니다:

JWT 생성
사용자가 로그인하면, 서버는 다음과 같은 정보를 포함하여 JWT를 생성합니다:

```javascript
const token = jwt.sign({ _id: user._id, isAdmin: user.isAdmin }, JWT_SECRET, { expiresIn: "1h" });
```
_id: 사용자의 고유 식별자
isAdmin: 사용자가 관리자(admin)인지 여부를 나타내는 불리언 값
JWT_SECRET: 토큰을 서명하기 위한 비밀 키
expiresIn: 토큰의 만료 시간 (1시간)
JWT 포함 요청
모든 보호된 엔드포인트에 접근할 때, 클라이언트는 생성된 JWT를 HTTP 헤더에 포함시켜 요청을 보냅니다:

```http
GET /endpoint HTTP/1.1
Host: api.example.com
Authorization: Bearer YOUR_JWT_TOKEN
```
Authorization: 헤더는 Bearer YOUR_JWT_TOKEN 형식을 사용해야 합니다.
인증 미들웨어
서버는 JWT를 검증하기 위해 미들웨어를 사용합니다. 미들웨어는 토큰을 확인하고, 유효한 경우 req.user에 사용자 정보를 추가합니다:

```javascript
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const SECRET_KEY = "your_secret_key";

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

    req.user = user; // 이후에는 req.user가 데이터베이스의 user 임
    next();
  } catch (err) {
    return res.sendStatus(403); // 토큰 무효
  }
};

module.exports = authenticateToken;
```

# API 엔드포인트
## 사용자 엔드포인트
### 회원가입

URL: /user/signup
Method: POST
설명: 새로운 사용자를 생성합니다.
요청 예시:
```json
{
  "username": "exampleuser",
  "password": "examplepassword",
  "email": "user@example.com"
}
```
응답 예시:
```json
{
  "message": "User created successfully",
  "user": {
    "id": "user_id",
    "username": "exampleuser",
    "email": "user@example.com"
  }
}
```

로그인

URL: /user/login
Method: POST
설명: 사용자 로그인을 처리하고 JWT 토큰을 반환합니다.
요청 예시:
```json
{
  "username": "exampleuser",
  "password": "examplepassword"
}
```
응답 예시:
```json
{
  "message": "Login successfully",
  "token": "your_jwt_token",

}
```

정의된 스키마
User

```json
{
  "id": "user_id",
  "username": "exampleuser",
  "email": "user@example.com",
  "password": "hashed_password",
  "isAdmin": true
}
```
Session

```json
{
  "id": "session_id",
  "name": "Session 1",
  "date": "2023-07-09T10:00:00Z",
  "checksNum": 1
}
```

Attend
```json
{
  "id": "attendance_id",
  "user": "user_id",
  "session": "session_id",
  "attendList": [
    {
      "attendIdx": 1,
      "status": true
    }
  ]
  "userName": "user_name",
  "sessionName" : "session_name",
  "sessionDate" : "session_date"
}
```
