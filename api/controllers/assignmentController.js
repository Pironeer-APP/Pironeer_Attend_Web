const Assignment = require('../models/assignment');
const Grade = require('../models/grade');
const User = require('../models/user');

//과제 생성
exports.createAssignment = async(req, res, next)=>{
    try{

        const {name, date, xList, triList} = req.body;

        if(!name || !date){
            return res.status(400).send({message : "과제 이름과 날짜는 필수입니다."});
        }

        // xList와 triList를 문자열로 받아서 배열로 변환
        const xListArray = xList ? xList.split(',').map(item => item.trim()) : [];
        const triListArray = triList ? triList.split(',').map(item => item.trim()) : [];

        const assignment = new Assignment({name, date});
        await assignment.save();

        const users = await User.find();
        if(!users.length){
            return res.status(400).send({message : "사용자가 없습니다"});
        }

        // 모든 user에 대한 grade db 생성
        const gradeDocuments = users.map(user => {
            let deduction = 0;

            if (xListArray.includes(user.username)) { // username을 기준으로 비교
                deduction = -20000;
            } else if (triListArray.includes(user.username)) { // username을 기준으로 비교
                deduction = -10000;
            }

            return {
                user: user._id,
                userName: user.username,
                assignment: assignment._id,
                assignmentName: assignment.name,
                assignmentDate: assignment.date,
                deduction: deduction
            };
        });

        await Grade.insertMany(gradeDocuments);
        req.assignmentData = {  assignment, gradeDocuments, dbState : 1 };
        next();
        // res.status(201).send({message : "과제가 성공적으로 생성되었습니다", assignment});
    } catch(error){
        res.status(500).send({message : "과제 생성 도중 오류가 발생했습니다", error});
    }
};

//모든 과제 조회
exports.getAllAssignments = async(req, res)=>{
    try{
        const assignments = await Assignment.find();
        res.status(200).send(assignments);
    } catch(error){
        res.status(500).send({message : "과제를 가져오는 도중 오류가 발생했습니다", error});
    }
};

//특정 과제 조회 + 해당 과제의 모든 채점 결과도 조회
exports.getAssignmentById = async(req, res)=>{
    try{
        const {assignmentId} = req.params;

        const assignment = await Assignment.findById(assignmentId);
        if(!assignment){
            return res.status(404).send({message : "과제를 찾을 수 없습니다"});
        }

        const grades = await Grade.find({assignment : assignment._id});
        res.status(200).send({assignment, grades});
    } catch(error){
        res.status(500).send({message : "과제를 가져오는 도중 오류가 발생했습니다", error});
    }
};

//과제 삭제
exports.deleteAssignment = async(req, res)=>{
    try{
        const {assignmentId} = req.params;

        if(!assignmentId){
            return res.status(400).send({message : "과제 ID가 필요합니다"});
        }

        //Id에 해당하는 과제가 존재하는지 확인
        const assignment = await Assignment.findById(assignmentId);
        if(!assignment){
            return res.status(404).send({message : "해당 과제를 찾을 수 없습니다"});
        }

        //해당 과제의 채점 정보 삭제
        await Grade.deleteMany({assignment : assignmentId});

        //과제 삭제
        await Assignment.findByIdAndDelete(assignmentId);


        res.status(200).send({message: "과제가 성공적으로 삭제되었습니다"});
    }catch(error){
        res.status(500).send({message : "과제 삭제 도중 오류가 발생했습니다", error});
    }
};