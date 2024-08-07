const mongoose = require('mongoose');
const Attend = require('./api/models/attend'); // 기존 Attend 모델
const Session = require('./api/models/session');
const User = require('./api/models/user');

const { google } = require('googleapis');

require('dotenv').config();

const uri = process.env.MONGODB_URI;

// 이 양반은 모든 출석 가져와서 출석에 해당하는 정보를 찾고 반영
// db조회가 개많음 출석 문서수(700) * 2
// 동일 네트 워크 기준 14초
const migrateData = async () => {
    try {
        console.time('Execution Time'); // 타이머 시작

        // MongoDB 연결
        await mongoose.connect( uri , { 
            useNewUrlParser: true, 
            useUnifiedTopology: true 
        });

        const attends = await Attend.find();

        for (let attend of attends) {
            const session = await Session.findById(attend.session);
            const user = await User.findById(attend.user)

            if (session && user) {
                // // 세션과 유저가 존재할 경우 정보 업데이트
                // attend.userName = user.username;
                // attend.sessionName = session.name;
                // attend.sessionDate = session.date;
                console.log(attend.sessionName)
                let money = 0;
                let noCheck = 0;
                attend.attendList.forEach(attend => {
                  if (attend.status === false) {
                    noCheck += 1;
                  }
                });
                if (noCheck == 1) {
                    money = 10000;
                } else if (noCheck > 1) {
                    money = 20000;
                }
                // attend.noname = money
                console.log(money)
                // // // 출석 정보 저장
                // await attend.save();
            } else {
                // 세션 또는 유저가 존재하지 않을 경우 출석 정보 삭제
                await Attend.deleteOne({ _id: attend._id });
                console.log(`Deleted attend record with ID: ${attend._id}`);
            }

        }
        console.log('Data migration completed successfully.');
    } catch (error) {
        console.error('Error during data migration:', error);
    } finally {
        mongoose.connection.close();
        console.timeEnd('Execution Time'); // 타이머 종료 및 결과 출력
    }
};

// 이 양반은 유저를 기준으로 가져와 비교적 적으나 한번에 안가져오는 것은 동일
// 유저 문서 수 * 1
// 동일 네트 워크 기준 1초
const TESTuserDeposit1 = async () => {
    try {
        console.time('Execution Time'); // 타이머 시작

        // MongoDB 연결
        await mongoose.connect( uri , { 
            useNewUrlParser: true, 
            useUnifiedTopology: true 
        });

        // 모든 유저 가져오기
        const users = await User.find();

        for (let user of users) {
            console.log(user.username)
            const attends = await Attend.find({user:user})
            let totalMoney = 0
            for (let attend of attends){
                console.log(attend.sessionName)
                let money = 0;
                let noCheck = 0;
                attend.attendList.forEach(attend => {
                    if (attend.status === false) {
                    noCheck += 1;
                    }
                });
                if (noCheck == 1) {
                    money = 10000;
                } else if (noCheck > 1) {
                    money = 20000;
                }
                totalMoney += money
                // attend.noname = money
                console.log(money)

                // // // 출석 정보 저장
                // await attend.save();
            } 
            console.log("totalMoney : " , totalMoney)
        }
        console.log('Data migration completed successfully.');
    } catch (error) {
        console.error('Error during data migration:', error);
    } finally {
        mongoose.connection.close();
        console.timeEnd('Execution Time'); // 타이머 종료 및 결과 출력
    }
};

//퀴리 문 두개로 다 가져와 맵핑
// 동일 네트 워크 기준 0.5초
const TESTuserDeposit = async () => {
    try {
        console.time('Execution Time'); // 타이머 시작

        // MongoDB 연결
        await mongoose.connect( uri , { 
            useNewUrlParser: true, 
            useUnifiedTopology: true 
        });

        // 모든 유저 가져오기
        const users = await User.find();

        // 유저의 아이디를 미리 가져와서 한 번의 쿼리로 모든 출석 기록을 가져옵니다.
        const userIds = users.map(user => user._id);
        const allAttends = await Attend.find({ user: { $in: userIds } });

        // 유저별로 출석 기록을 그룹화합니다.
        const attendsByUser = allAttends.reduce((acc, attend) => {
            acc[attend.user] = acc[attend.user] || [];
            acc[attend.user].push(attend);
            return acc;
        }, {});

        for (let user of users) {
            console.log(user.username);

            // 해당 유저의 출석 기록 목록 가져오기
            const attends = attendsByUser[user._id] || [];
            let totalMoney = 0;

            for (let attend of attends) {
                console.log(attend.sessionName);
                let money = 0;
                let noCheck = 0;
                attend.attendList.forEach(attend => {
                    if (attend.status === false) {
                        noCheck += 1;
                    }
                });
                if (noCheck == 1) {
                    money = 10000;
                } else if (noCheck > 1) {
                    money = 20000;
                }
                totalMoney += money;
                // attend.noname = money
                console.log(money);

                // // // 출석 정보 저장
                // await attend.save();
            }
            console.log("totalMoney : ", totalMoney);
        }
        console.log('Data test completed successfully.');
    } catch (error) {
        console.error('Error during data test:', error);
    } finally {
        mongoose.connection.close();
        console.timeEnd('Execution Time'); // 타이머 종료 및 결과 출력
    }
};

// 절대 실행하지마
const generateData = async (sessionId) => {
    try {
        // MongoDB 연결
        await mongoose.connect(uri, { 
            useNewUrlParser: true, 
            useUnifiedTopology: true 
        });

        // 주어진 sessionId로 출석 데이터 찾기
        const attends = await Attend.find({ session: sessionId });

        // 출석 데이터에 대해 작업 수행
        for (const attend of attends) {
            attend.attendList = [attend.attendList[0]];

            let status = attend.attendList[0].status;
            for (let attendIdx = 1; attendIdx < 3; attendIdx++) {  
                const attendAtIdx = { attendIdx, status: status };
                attend.attendList.push(attendAtIdx);
            }
            await attend.save(); // 출석 정보 저장
        }

        console.log('Data migration completed successfully.');
    } catch (error) {
        console.error('Error during data migration:', error);
    } finally {
        await mongoose.connection.close(); // await로 연결 닫기
    }
};


// 구글 스프레드 시트
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const KEYFILE_PATH = process.env.KEYFILE_PATH;

const auth = new google.auth.GoogleAuth({
    keyFile: KEYFILE_PATH,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const spreadUserDeposit = async () => {
    try {
        console.time('Execution Time'); // 타이머 시작

        // MongoDB 연결
        await mongoose.connect( uri , { 
            useNewUrlParser: true, 
            useUnifiedTopology: true 
        });

        // 모든 유저 가져오기
        const users = await User.find();

        // 유저의 아이디를 미리 가져와서 한 번의 쿼리로 모든 출석 기록을 가져옵니다.
        const userIds = users.map(user => user._id);
        const allAttends = await Attend.find({ user: { $in: userIds } });

        // 유저별로 출석 기록을 그룹화합니다.
        const attendsByUser = allAttends.reduce((acc, attend) => {
            acc[attend.user] = acc[attend.user] || [];
            acc[attend.user].push(attend);
            return acc;
        }, {});
        const sessions = await Session.find() 
        
        // 첫번쨰 행은 /로 시작해 세션 이름을 순서대로(인덱스 순 즉, 날짜순)
        const firstCol = []
        firstCol.push('/')
        sessions.forEach( session => {
            firstCol.push(session.name)
        })

        // 이 외의 행 저장
        const cols = []
        for (let user of users) {
            console.log(user.username);
            // 이외의 행의 처음은 유저 이름(/ 위치) 
            const col = []
            col.push(user.username);

            // 해당 유저의 출석 기록 목록 가져오기
            const attends = attendsByUser[user._id] || [];
            let totalMoney = 0;

            // 출석을 순회하며 차감 액 계산
            for (let attend of attends) {
                let money = 0;
                let noCheck = 0;
                attend.attendList.forEach(attend => {
                    if (attend.status === false) {
                        noCheck += 1;
                    }
                });
                if (noCheck == 1) {
                    money = 10000;
                } else if (noCheck > 1) {
                    money = 20000;
                }
                totalMoney += money;
                // attend.noname = money

                console.log(money);
                // 차감 액을 해당 세션 이름의 위치에 삽입
                col[firstCol.indexOf(attend.sessionName)] = money;
                // // // 출석 정보 저장
                // await attend.save();
            }
            console.log("totalMoney : ", totalMoney);
            col.push(totalMoney)
            cols.push(col)
        }
        // 스프레드 시트로 전달
        await updateSpreadsheet(firstCol, cols);
        console.log('Data test completed successfully.');
    } catch (error) {
        console.error('Error during data test:', error);
    } finally {
        mongoose.connection.close();
        console.timeEnd('Execution Time'); // 타이머 종료 및 결과 출력
    }
};

// 스프레드시트 업데이트 함수
const updateSpreadsheet = async (firstCol, cols) => {
    const sheets = google.sheets({ version: 'v4', auth: auth});

    try {
        // 기존 데이터 삭제
        await sheets.spreadsheets.values.clear({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Sheet1' // 모든 데이터를 삭제합니다.
        });

        // 새로운 데이터 추가
        const values = [firstCol, ...cols];

        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Sheet1!A1',
            valueInputOption: 'RAW',
            resource: {
                values,
            },
        });

        console.log('Spreadsheet updated successfully.');
    } catch (error) {
        console.error('Error updating spreadsheet:', error);
    }
};

spreadUserDeposit();
// generateData('66b17963528e076e46ccc042')
// migrateData(); // 스크립트를 실행합니다.

//TESTuserDeposit();

module.exports = migrateData;