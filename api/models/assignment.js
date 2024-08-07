const mongoose = require('mongoose');

//과제
const assignmentSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
    },
    date:{
        type: Date,
        required: true,
        index: true
    }
});

const  Assignment = mongoose.model('Assignment', assignmentSchema);

module.exports = Assignment;