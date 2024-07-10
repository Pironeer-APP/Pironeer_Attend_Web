const mongoose = require('mongoose');
const Attend = require('./api/models/attend'); // 기존 Attend 모델
const Session = require('./api/models/session');
require('dotenv').config();

const uri = process.env.MONGODB_URI;

const migrateData = async () => {
    try {
        // MongoDB 연결
        await mongoose.connect( uri , { 
            useNewUrlParser: true, 
            useUnifiedTopology: true 
        });

        const attends = await Attend.find();

        for (let attend of attends) {
            const session = await Session.findById(attend.session);

            if (session) {
                attend.sessionName = session.name; // 세션 이름 필드
                attend.sessionDate = session.date; // 세션 날짜 필드

                await attend.save();
            }
        }
        console.log('Data migration completed successfully.');
    } catch (error) {
        console.error('Error during data migration:', error);
    } finally {
        mongoose.connection.close();
    }
};

migrateData(); // 스크립트를 실행합니다.

module.exports = migrateData;