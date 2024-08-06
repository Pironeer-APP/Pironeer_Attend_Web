const mongoose = require('mongoose');

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

const Deposit = mongoose.model('Deposit', depositSchema);

module.exports = Deposit;