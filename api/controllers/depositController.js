const Deposit = require('../models/deposit');
const User = require('../models/user');
const Session = require('../models/session');
const Attend = require('../models/attend');
const AttendanceTokenCache = require('../cache/token');

const getOrCreateDeposit = async (userId) => {
  let deposit = await Deposit.findOne({ user: userId });
  if (!deposit) {
      // User 정보 가져오기
      const user = await User.findById(userId);
      if (!user) {
          throw new Error('유저를 찾을 수 없습니다');
      }

      // 새로운 Deposit 객체 생성
      deposit = new Deposit({ 
          user: userId, 
          userName: user.username,  // User 정보에서 userName 가져오기
          deposit: 80000, // 초기 보증금 금액 설정
          assignmentList: [], 
          defendList: [],
          deductionList: [],
          modifiedTime: new Date()
      });
  }
  return deposit;
};

// 보증금 방어권 삭제 (가장 마지막 보증금 방어권 삭제)
exports.dependDelete = async (req, res) => {
  try {
    const { userId } = req.params;
    const deposit = await Deposit.findOne({ user: userId });

    if (!deposit) {
      return res.status(404).send({ message: "보증금을 찾을 수 없습니다" });
    }

    if (deposit.defendList.length === 0) {
      return res.status(400).send({ message: "삭제할 방어권이 없습니다" });
    }

    deposit.defendList.pop();
    await deposit.save();

    res.status(200).send({ message: "방어권이 삭제되었습니다", defendList: deposit.defendList });
  } catch (error) {
    res.status(500).send({ message: "방어권 삭제 중 오류가 발생했습니다", error });
  }
};


// 보증금 방어권 추가
exports.dependAdd = async (req, res) => {
  try {
    const { userId } = req.params;

    const deposit = await Deposit.findOne({ user: userId });
    if (!deposit) {
      return res.status(404).send({ message: "보증금을 찾을 수 없습니다" });
    }

    const defendIdx = deposit.defendList.length;

    deposit.defendList.push({ defendIdx, status: false, usedDate: new Date() });

    await deposit.save();

    res.status(200).send({ message: "방어권이 추가되었습니다", defendList: deposit.defendList });
  } catch (error) {
    res.status(500).send({ message: "방어권 추가 중 오류가 발생했습니다", error });
  }
};


// 과제 정보 입력
exports.AssignmentInsert = async (req, res) => {
  try {
      const { assignment, lackList, xList } = req.body;

      // lackList의 사용자별로 체크 상태와 차감 내역을 추가
      for (const userId of lackList) {
          const deposit = await getOrCreateDeposit(userId);
          
          if (deposit) {
              // 미흡 과제 추가
              deposit.assignmentList.push({
                  assignmentIdx: deposit.assignmentList.length + 1,
                  assignment: assignment,
                  assignedDate: new Date(),
                  check: true
              });
              // 차감 내역 추가
              deposit.deductionList.push({
                  deductionIdx: deposit.deductionList.length + 1,
                  deductionDate: new Date(),
                  deductedAmount: -10000,
                  deductionDetail: `미흡 과제 : ${assignment}`,
              });
              deposit.updateDeposit(-10000);
              // 변경사항 저장
              await deposit.save();
          }
      }

      // xList의 사용자별로 체크 상태와 차감 내역을 추가
      for (const userId of xList) {
          const deposit = await getOrCreateDeposit(userId);
          
          if (deposit) {
              // 미제출 과제 추가
              deposit.assignmentList.push({
                  assignmentIdx: deposit.assignmentList.length + 1,
                  assignment: assignment,
                  assignedDate: new Date(),
                  check: false
              });
              // 차감 내역 추가
              deposit.deductionList.push({
                  deductionIdx: deposit.deductionList.length + 1,
                  deductionDate: new Date(),
                  deductedAmount: -20000,
                  deductionDetail: `미제출 과제 : ${assignment}`,
              });
              deposit.updateDeposit(-20000);
              // 변경사항 저장
              await deposit.save();
          }
      }

      res.status(200).json({ message: '과제 정보 입력이 성공적으로 되었습니다' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
  }
};


// 과제 정보 수정(과제 리스트 수정)
exports.AssignmentUpdate = async (req, res) => {
  try {
      const { userId, assignment, check, pass } = req.body;

      const deposit = await getOrCreateDeposit(userId);

      // 기존 과제 항목을 찾기
      const assignmentIndex = deposit.assignmentList.findIndex(item => item.assignment === assignment);
      if (assignmentIndex !== -1) {
          if (pass) {
              // 과제 항목 삭제
              const deletedAssignment = deposit.assignmentList.splice(assignmentIndex, 1)[0];
              
              // 보증금 업데이트
              deposit.updateDeposit(deletedAssignment.check ? 10000 : 20000);
              
              // 차감 내역에서 해당 과제 항목 삭제
              const deductionIndex = deposit.deductionList.findIndex(item => item.deductionDetail.includes(assignment));
              if (deductionIndex !== -1) {
                  deposit.deductionList.splice(deductionIndex, 1);
              }
          } else {
              // 과제 항목 수정
              deposit.assignmentList[assignmentIndex].check = check;

              // 차감 내역 수정
              const deductionIndex = deposit.deductionList.findIndex(item => item.deductionDetail.includes(assignment));
              if (deductionIndex !== -1) {
                  deposit.deductionList[deductionIndex].deductedAmount = check ? -10000 : -20000;
              }
          }
      } else {
          // 과제 항목이 없으면 새로 추가합니다.
          deposit.assignmentList.push({
              assignmentIdx: deposit.assignmentList.length + 1,
              assignment: assignment,
              assignedDate: new Date(),
              check: check
          });
          // 차감 내역 추가
          deposit.deductionList.push({
              deductionIdx: deposit.deductionList.length + 1,
              deductionDate: new Date(),
              deductedAmount: check ? -10000 : -20000,
              deductionDetail: `${check ? '미흡' : '미제출'} 과제: ${assignment}`,
          });
          // 보증금 업데이트
          deposit.updateDeposit(check ? -10000 : -20000);
      }

      // 변경사항 저장
      await deposit.save();

      res.status(200).json({ message: "과제 정보가 성공적으로 수정되었습니다" , deposit});
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
  }
};


//잔여 보증금 보여주기
exports.checkDeposit = async(req, res)=>{
    try{
        const { userId } = req.params;

        const user = await User.findById(userId);
        if(!user){
            return res.status(400).send({message: "존재하지 않는 사용자입니다."});
        }

        const deposit = await Deposit.findOne({user: user._id}).select('deposit deductionList');
        if(!deposit){
            return res.status(400).send({message : "보증금 내역이 존재하지 않습니다."});
        }

        const deductionList = deposit.deductionList;

        res.status(201).send({user, deposit: deposit.deposit, deductionList});
    } catch(error){
        res.status(500).send({message: "보증금 정보를 가져오는 도중 오류가 발생했습니다.", error});
    }
};

//보증금 방어권 사용
exports.useDefend = async(req, res)=>{
    try{        
        const { userId } = req.params;

        const user = await User.findById(userId);
        if(!user){
            return res.status(400).send({message : "존재하지 않는 사용자입니다."});
        }

        const deposit = await Deposit.findOne({user: user._id}).select('deposit defendList deductionList');
        if(!deposit){
            return res.status(400).send({message : "보증금 내역이 존재하지 않습니다."});
        }

        if(deposit.deposit === 80000){
            return res.status(400).send({message : "차감 내역이 존재하지 않아 보증금 방어권 사용이 불가합니다."});
        }

        const availableDefend = deposit.defendList.find(defend => defend.status === false);
        if(!availableDefend){
            return res.status(400).send({message : "사용 가능한 보증금 방어권이 없습니다."});
        }

        availableDefend.status = true;
        availableDefend.usedDate = new Date();
        
        deposit.updateDeposit(+10000);

        deposit.deductionList.push({
            deductionIdx: deposit.deductionList.length + 1,
            deductionDate: new Date(),
            deductedAmount: +10000,
            deductionDetail: "보증금 방어권 사용"
        });

        await deposit.save();

        res.status(201).send({message: "보증금 방어권이 정상적으로 사용되었습니다", user, deposit: deposit.deposit, deductionList: deposit.deductionList});
    }catch(error){
        res.status(500).send({message : "보증금 방어권을 사용하는 도중 오류가 발생했습니다.", error});
    }
};