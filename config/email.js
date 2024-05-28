const express = require('express');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');

const app = express();

app.use(cookieParser());

// const SMTPTransport = require('nodemailer/lib/smtp-transport');

let transporter = nodemailer.createTransport({
    service : "naver",
    port: 587,
    auth : {
        user : process.env.USER,
        pass : process.env.PASS,
    },
    tls : {
        rejectUnauthorized : false
    }
});

//이메일 전송
exports.sendEmail =  async(req, res)=>{
    const email = req.body.email;

    try{
        let authNum = Math.random().toString().substring(2, 6);
        const hashAuth = await bcrypt.hash(authNum, 12);

        res.cookie('hashAuth', hashAuth, {
            maxAge: 300000
        });

        const mailOptions = {
            from : process.env.USER,
            to: email,
            subject: "인증 관련 메일입니다",
            text: "인증번호는 " + authNum + " 입니다."
        };
        
        await transporter.sendMail(mailOptions, (err, res) =>{
            if(err){
                console.log(err);
            } else{
                console.log(hashAuth);
            }
            transporter.close();
        });

        return res.status(201).send({ message : "인증 메일을 성공적으로 보냈습니다."});
    } catch(err){
        res.send({ message : "인증 메일 전송에 실패했습니다."});
        console.error(err);
    }
};

//이메일 인증
exports.certEmail = async(req, res) =>{
    const code = req.body.code;
    const hashAuth = req.headers.cookie;
    console.log(hashAuth);

    try{
        if(bcrypt.compare(code, hashAuth)){
            res.send({ message : "인증 성공"});
        }
        else{
            res.send({ message : "인증 코드가 일치하지 않습니다"});
        }
    } catch(err){
        res.send({ message : "인증 실패"});
        console.error(err);
    }
};