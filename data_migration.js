const mongoose = require('mongoose');
const Attend = require('./api/models/attend'); // 기존 Attend 모델
const User = require('./api/models/user');
const Session = require('./api/models/session');

const migrateData = async () => {
    try {
        const attends = await Attend.find();

        for (const attend of attends) {
            const user = await User.findById(attend.user);
            const session = await Session.findById(attend.session);

            if (user && session) {
                attend.user = {
                    userId: user._id,
                    username: user.username // 사용자 이름 필드
                };
                attend.session = {
                    sessionId: session._id,
                    name: session.name, // 세션 이름 필드
                    date: session.date // 세션 날짜 필드
                };

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

module.exports = migrateData;