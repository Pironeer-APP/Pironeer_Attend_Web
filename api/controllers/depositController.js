const Deposit = require('../models/deposit');
const Attend = require('../models/attend');
const User = require('../models/user');
const AttendanceTokenCache = require('../cache/token');

//잔여 보증금 보여주기
exports.checkDeposit = async(req, res)=>{
    try{
        const { userId } = req.params;

        const user = await User.findById(userId);
        if(!user){
            return res.status(404).send({message: "존재하지 않는 사용자입니다."});
        }

        const deposit = await Deposit.findOne({user: user._id}).select('deposit deductionList');
        if(!deposit){
            return res.status(400).send({message : "보증금 내역이 존재하지 않습니다."});
        }

        const deductionList = deposit.deductionList;

        res.status(200).send({user, deposit: deposit.deposit, deductionList});
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
            return res.status(404).send({message : "존재하지 않는 사용자입니다."});
        }

        const deposit = await Deposit.findOne({user: user._id}).select('deposit defendList deductionList');
        if(!deposit){
            return res.status(400).send({message : "보증금 내역이 존재하지 않습니다."});
        }

        const defendList = deposit.defendList;
        const availableDefend = defendList.find(defend => defend.status === false);
        if(!availableDefend){
            return res.status(400).send({message : "사용 가능한 보증금 방어권이 없습니다."});
        }

        availableDefend.status = true;
        availableDefend.usedDate = new Date();

        const sortedDeductionList = deposit.deductionList.sort((a, b) => b.deductedAmount - a.deductedAmount);
        if(sortedDeductionList.length > 0){
            deposit.deposit += sortedDeductionList[0].deductedAmount;
            sortedDeductionList[0].isDefended = true;
            await deposit.save();
        }
        else{
            await deposit.save();
            return res.status(200).send({message : "보증금 차감 내역이 존재하지 않습니다."});
        }

        res.status(200).send({message: "보증금 방어권이 정상적으로 사용되었습니다", user, defendList});
    }catch(error){
        res.status(500).send({message : "보증금 방어권을 사용하는 도중 오류가 발생했습니다.", error});
    }
};

//새로고침 버튼
exports.depositReload = async(req, res)=>{
    try{
        //새로고침 버튼을 누름 -> modifiedTime 갱신 -> 보증금 객체 반환
        const { userId } = req.params;

        const user = await User.findById(userId);
        if(!user){
            return res.status(404).send({message : "존재하지 않는 사용자입니다."});
        }

        const deposit = await Deposit.findOne({user: user._id})
        if(!deposit){
            return res.status(400).send({message : "보증금 내역이 존재하지 않습니다."});
        }

        deposit.modifiedTime = new Date();
        await deposit.save();

        res.status(200).send({message : "보증금 내역이 정상적으로 업데이트 되었습니다.", user, deposit});
    } catch(error){
        res.status(500).send({message : "최근 내역 로딩 중 오류가 발생하였습니다.", error});
    }
};