const mongoose = require('mongoose');
const User = require('../models/user');

const depositSchema = new mongoose.Schema({
    //유저 객체
    user : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    //유저이름
    userName:{
        type: String,
        required: true
    },
    //현재 보증금 잔액
    deposit:{
        type: Number,
        default: 80000,
        min: 0
    },
    //보증금 방어권 리스트
    defendList:[{
        defendIdx:{
            type: Number,
            required: true
        },
        //사용 여부 : false(아직 사용 안 함), true(사용 완료)
        status:{
            type: Boolean,
            default: false
        },
        usedDate:{
            type: Date,
            required: true,
        }
    }],
    //갱신 시간
    modifiedTime:{
        type: Date,
        default: Date.now
    },
    //보증금 차감 내역 리스트 : 보증금 차감 이유, 날짜
    deductionList:[{
        deductionIdx:{
            type: Number,
            required: true
        },
        deductionDate:{
            type: Date,
            required: true
        },
        deductedAmount:{
            type: Number,
            required: true
        },
        deductionDetail:{
            type: String,
            required: true
        }
    }]
});

// 보증금 업데이트 메서드
depositSchema.methods.updateDeposit = function (amount) {
    if (amount > 0) {
        this.deposit = Math.min(80000, this.deposit + amount);
    } else {
        this.deposit = Math.max(0, this.deposit + amount);
    }
};

depositSchema.pre('save', function(next){
    this.modifiedTime = Date.now;
    next();
});

//deposit모델이 중간에 생겨서 deposit객체가 없는 유저도 있기 때문에 있으면 조회 없으면 생성하도록 하기 위해 만든 메서드
depositSchema.statics.getOrCreateDeposit = async (userId) => {
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

const Deposit = mongoose.model('Deposit', depositSchema);

module.exports = Deposit;