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

//잔여 보증금 보여주기
exports.checkDeposit = async(req, res)=>{
    try{
        const { userId } = req.params;

        const user = await User.findById(userId);
        if(!user){
            return res.status(400).send({message: "존재하지 않는 사용자입니다."});
        }

        const deposit = await Deposit.findOne({user: user._id}).select('deposit deductionList defendList');
        if(!deposit){
            return res.status(400).send({message : "보증금 내역이 존재하지 않습니다."});
        }

        const deductionList = deposit.deductionList;
        const defendList = deposit.defendList;

        res.status(201).send({user, deposit: deposit.deposit, deductionList, defendCount : defendList.length});
    } catch(error){
        res.status(500).send({message: "보증금 정보를 가져오는 도중 오류가 발생했습니다.", error});
    }
};

//보증금 내역 수정하기
exports.updateDeposit = async(req, res)=>{
    try{
        const {userId, deductionIdx} = req.params;
        const {deductedAmount, deductionDetail} = req.body;

        const user = await User.findById(userId);
        if(!user){
            return res.status(400).send({message : "존재하지 않는 사용자입니다."});
        }

        const deposit = await Deposit.findOne({user : user._id});
        if(!deposit){
            return res.status(400).send({message : "보증금 내역이 존재하지 않습니다."})
        }

        const deductionIndex = deposit.deductionList.findIndex(deduction => deduction.deductionIdx === parseInt(deductionIdx, 10));
        if(deductionIndex === -1){
            return res.status(400).send({message : "해당 차감 내역을 찾을 수 없습니다."});
        }

        //내역 업데이트
        const oldDeductedAmount = deposit.deductionList[deductionIndex].deductedAmount;
        deposit.deductionList[deductionIndex].deductedAmount = deductedAmount;
        deposit.deductionList[deductionIndex].deductionDetail = deductionDetail;

        //보증금 업데이트
        deposit.updateDeposit(deductedAmount - oldDeductedAmount);

        await deposit.save();

        res.status(200).send({message : "차감 내역이 성공적으로 수정되었습니다", deductionList : deposit.deductionList});

    }catch(error){
        res.status(500).send({message : "차감 내역을 수정하는 도중 오류가 발생했습니다.", error});
    }
}

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