const User = require('../models/user');
const Attend = require('../models/attend');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// JWT 비밀키
const JWT_SECRET = 'piro';

// Create: 새로운 사용자를 생성합니다.
exports.createUser = async (req, res) => {
  try {
    const { username, password, email } = req.body;
    const user = new User({ username, password, email });
    await user.save();
    res.status(201).send({ message: "User created successfully", user });
  } catch (error) {
    res.status(400).send({ message: "Error creating user", error });
  }
};

// Read: 모든 사용자를 조회합니다.
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({});
    res.status(200).send(users);
  } catch (error) {
    res.status(500).send({ message: "Error retrieving users", error });
  }
};

// Read: 특정 사용자를 ID로 조회합니다.
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    res.status(200).send(user);
  } catch (error) {
    res.status(500).send({ message: "Error retrieving user", error });
  }
};

// Update: 특정 사용자의 정보를 업데이트합니다.
exports.updateUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { username, email, password }, { new: true });
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    res.status(200).send({ message: "User updated successfully", user });
  } catch (error) {
    res.status(400).send({ message: "Error updating user", error });
  }
};

// Delete: 특정 사용자를 삭제합니다.
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    res.status(200).send({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).send({ message: "Error deleting user", error });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).send('비밀번호 틀림');
    }
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Login successfully', token });
  } catch (error) {
    res.status(500).send('Login error');
  }
};

exports.checkAttencance = async(req, res) => {
  try {
    var absent = 0;
    const user = await User.findById(req.params.id);
    const attend = await Attend.find({ user: user });
    if (!attend) {
      return res.status(404).send({ message: "출석 정보가 없습니다." });
    }
    attend.forEach(attendance => {
      if (attendance.status == false) {
        absent = absent +1;
      }
    });
    res.status(200).send({ message: "출석 정보가 확인되었습니다.", attend, absent });
  } catch(error) {
    res.status(500).send({message: "Error Checking Attendance"});
  }
};
