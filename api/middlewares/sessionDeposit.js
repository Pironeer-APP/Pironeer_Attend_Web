const Session = require('../models/session');
const Attend = require('../models/attend');
const User = require('../models/user');
const Deposit = require('../models/deposit');

//세션 보증금 차감을 하기 위한 미들웨어
const depositMiddleware = async(req, res) => {
  //세션데이터가 넘어 오지 않을 경우 오류
  if (!req.sessionData) {
    return res.status(403).json({ message: "세션 데이터가 넘어오지 않았습니다!" });
  }

  //세션 데이터의 dbState값이 1일 경우 특정 세션에 대한 모든 유저의 정보 입력
  if(req.sessionData.dbState==1){
    //세션과 출석에 대한 정보 가져오기
    const { session, attends } = req.sessionData;
    const sessionName = session.name;

    //보증금이 차감된 사람들의 정보만 가져오기
    const insufficientAttends = attends.filter(attend => attend.deduction !== 0);

    //반복문 돌며 변경 사항 deposit객체에 적용
    for(const attend of insufficientAttends){
      const deposit = await Deposit.getOrCreateDeposit(attend.user);

      //deductionList가 없을 경우 생성(없어도 될듯)
      if (!deposit.deductionList) {
        deposit.deductionList = [];
      }

      //지각인지 결석인지 보증금 내역 추가해주기
      const deductionDetail = {
        deductionIdx : deposit.defendList.length,
        deductionDate: new Date(),
        deductionDetail: `${session.name} ${attend.deduction === 10000 ? '지각' : '결석'}`,
        deductedAmount: attend.deduction
      };

      deposit.deductionList.push(deductionDetail);
      //보증금 남은 금액 차감
      deposit.updateDeposit(attend.deduction*(-1));
      await deposit.save();
    }
  }
  res.status(200).send(req.sessionData);
};

module.exports = depositMiddleware;
