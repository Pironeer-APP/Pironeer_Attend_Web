const Assignment = require('../models/assignment');
const Grade = require('../models/grade');
const User = require('../models/user');


//특정 유저의 과제 점수 수정
exports.updateScore = async(req, res)=>{
    try{
        const {assignmentId, userId} = req.params;
        const {score} = req.body;

        //기존의 grade 찾기
        const grade = await Grade.findOne({assignment : assignmentId, user: userId});
        if(!grade){
            return res.status(404).send({message : "점수를 찾을 수 없습니다"});
        }

        grade.deduction = score;

        await grade.save();

        res.status(200).send({message : "점수를 성공적으로 업데이트 하였습니다", score : score, userId : userId, assignmentId : assignmentId});
    } catch(error){
        res.status(500).send({message : "점수 업데이트 중 오류가 발생했습니다", error});
    }
}

//특정 유저의 모든 채점 결과 조회
exports.getScore = async(req, res)=>{
    try{
        const {userId} = req.params;

        const grades = await Grade.find({user : userId});
        if(!grades.length){
            return res.status(404).send({message : "채점 결과를 찾을 수 없습니다"});
        }

        res.status(200).send({message : "채점 결과를 성공적으로 조회했습니다", grades : grades});
    } catch(error){
        res.status(500).send({message : "채점 결과를 조회하는 중 오류가 발생했습니다", error});
    }
}