const mongoose = require('mongoose');

//채점 정보 : 유저와 과제에 대한 채점 리스트
const gradeSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    userName:{
        type: String,
        required: true
    },
    assignment:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assignment',
        required: true,
        index: true
    },
    assignmentName:{
        type: String,
        required: true
    },
    assignmentDate:{
        type: Date,
        required: true
    },
    deduction:{
        type: Number,
        enum:[0, -10000, -20000],
        default: 0
    }
});

const Grade = mongoose.model('Grade', gradeSchema);

module.exports = Grade;