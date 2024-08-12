const Session = require('../models/session');
const User = require('../models/user');
const Deposit = require('../models/deposit');


//과제 보증금 차감을 하기 위한 미들웨어
const assignmentMiddleware = async(req, res) => {
  //과제데이터가 넘어 오지 않을 경우 오류
  if (!req.assignmentData) {
    return res.status(403).json({ message: "과제 데이터가 넘어오지 않았습니다!" });
  }

  //과제 데이터의 dbState값이 1일 경우 특정 과제에 대한 모든 유저의 정보 입력
  if(req.assignmentData.dbState==1){
    //과제과 출석에 대한 정보 가져오기
    const { assignment, gradeDocuments } = req.assignmentData;
    const assignmentName = assignment.name;

    //보증금이 차감된 사람들의 정보만 가져오기
    const insufficientGrades = gradeDocuments.filter(grade => grade.deduction !== 0);

    if(insufficientGrades.length > 0){
      const checkRepeated = await Deposit.getOrCreateDeposit(insufficientGrades[0].user);
    
    // 중복 체크
    const isDuplicate = checkRepeated.deductionList.some(d => 
      gradeDocuments.some(grade =>
        d.deductionDetail === `${assignment.name} ${grade.deduction === -10000 ? '미흡' : '미제출'}` && 
        d.deductedAmount === grade.deduction
      )
    );

    if (isDuplicate) {
      return res.status(200).send(req.sessionData); // 중복이 있으면 더 이상 처리하지 않고 응답
    }}

    //반복문 돌며 변경 사항 deposit객체에 적용
    for(const grade of insufficientGrades){
      const deposit = await Deposit.getOrCreateDeposit(grade.user);

      //deductionList가 없을 경우 생성(없어도 될듯)
      if (!deposit.deductionList) {
        deposit.deductionList = [];
      }

      //지각인지 결석인지 보증금 내역 추가해주기
      const deductionDetail = {
        deductionIdx : deposit.defendList.length,
        deductionDate: assignment.date,
        deductionDetail: `${assignment.name} ${grade.deduction === -10000 ? '미흡' : '미제출'}`,
        deductedAmount: grade.deduction
      };

      deposit.deductionList.push(deductionDetail);
      //보증금 남은 금액 차감
      deposit.updateDeposit(grade.deduction);
      await deposit.save();
      
    }
  }
  res.status(200).send(req.assignmentData);
};

module.exports = assignmentMiddleware;
