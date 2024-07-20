const Deposit = require('../models/deposit');
const User = require('../models/user');
const Session = require('../models/session');
const Attend = require('../models/attend');

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

// 보증금 새로고침 (모든 유저)
exports.depositReloadAll = async (req, res) => {
  
};

// 과제 정보 입력
exports.AssignmentInsert = async (req, res) => {
  try {
    const { userId } = req.params;
    const { assignmentIdx, assignment, assignedDate, check } = req.body;
    const deposit = await Deposit.findOne({ user: userId });

    if (!deposit) {
      return res.status(404).send({ message: "보증금을 찾을 수 없습니다" });
    }

    deposit.assignmentList.push({ assignmentIdx, assignment, assignedDate, check });
    await deposit.save();

    res.status(200).send({ message: "과제 정보가 입력되었습니다", assignmentList: deposit.assignmentList });
  } catch (error) {
    res.status(500).send({ message: "과제 정보 입력 중 오류가 발생했습니다", error });
  }
};

// 과제 정보 수정(과제 리스트 수정)
exports.AssignmentUpdate = async (req, res) => {
  try {
    const { userId } = req.params;
    const { assignmentIdx, assignment, assignedDate, check } = req.body;
    const deposit = await Deposit.findOne({ user: userId });

    if (!deposit) {
      return res.status(404).send({ message: "보증금을 찾을 수 없습니다" });
    }

    const assignmentItem = deposit.assignmentList.find(a => a.assignment === assignment);
    if (!assignmentItem) {
      return res.status(404).send({ message: "과제 정보를 찾을 수 없습니다" });
    }
    
    assignmentItem.assignmentIdx =assignmentIdx;
    assignmentItem.assignment = assignment;
    assignmentItem.assignedDate = assignedDate;
    assignmentItem.check = check;
    await deposit.save();
    res.status(200).send({ message: "과제 정보가 수정되었습니다", assignmentList: deposit.assignmentList });
  }catch (error) {
    res.status (500).send({ message: "과제 정보 수정 중 오류가 발생했습니다", error });
  }
};