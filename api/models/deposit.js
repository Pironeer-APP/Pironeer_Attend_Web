const mongoose = require('mongoose');

const depositSchema = new mongoose.Schema({
    user : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
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
    //과제 체크 리스트 : 미흡 또는 안 함 표시
    assignmentList: [{
        assignmentIdx:{
            type: Number,
            required: true
        },
        assignment:{
            type: String,
            required: true
        },
        assignedDate:{
            type: Date,
            required: true
        },
        check:{
            type: Boolean,
            default: true //기본값은 true(미흡) : 안 함 처리 하고 싶으면 false로
        }
    }],
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
        deductionDetail:{
            type: String,
            required: true
        }
    }]
});

depositSchema.pre('save', function(next){
    this.modifiedTime = Date.now;
    next();
});

const Deposit = mongoose.model('Deposit', depositSchema);

module.exports = Deposit;