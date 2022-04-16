
  //메일 보내기
    var 진행중할일리스트 = function() {
        db.collection('post').find({작성자 : 요청.user.id, 완료 : false}).toArray(function(에러, 결과){
            return 결과;
        })
    }
    

  const auth = {
    SendEmail : async(req, res) => {
        const todolist = 진행중할일리스트()

        const { sendEmail } = req.body;

        const mailOptions = {
            from: "할일, 앱",
            to: sendEmail,
            subject: "오늘의 할 일, 리스트입니다.",
            text: " 오늘까지 진행 중인 할 일 리스트입니다. " + todolist
        };

        const result = await smtpTransport.sendMail(mailOptions, (error, responses) => {
            if (error) {
                return res.status(statusCode.OK).send(util.fail(statusCode.BAD_REQUEST, responseMsg.AUTH_EMAIL_FAIL))
            } else {
              /* 클라이언트에게 인증 번호를 보내서 사용자가 맞게 입력하는지 확인! */
                return res.status(statusCode.OK).send(util.success(statusCode.OK, responseMsg.AUTH_EMAIL_SUCCESS, {
                    number: number
                }))
            }
            smtpTransport.close();
        });
    }
}

const nodemailer = require('nodemailer');

// 메일발송 객체
const mailSender = {
  // 메일발송 함수
  sendGmail: function (param) {
    var transporter = nodemailer.createTransport({
      service: 'younsun0107@gmail.com',   // 메일 보내는 곳
      prot: 587,
      host: 'smtp.gmlail.com',  
      secure: false,  
      requireTLS: true ,
      auth: {
        user: senderInfo.user,  // 보내는 메일의 주소
        pass: senderInfo.pass   // 보내는 메일의 비밀번호
      }
//     });
//     // 메일 옵션
//     var mailOptions = {
//       from: younsun0107@naver.com, // 보내는 메일의 주소
//       to: param.toEmail, // 수신할 이메일
//       subject: param.subject, // 메일 제목
//       text: param.text // 메일 내용
//     };
    
//     // 메일 발송    
//     transporter.sendMail(mailOptions, function (error, info) {
//       if (error) {
//         console.log(error);
//       } else {
//         console.log('Email sent: ' + info.response);
//       }
//     });

//   }
// }

// module.exports = mailSender;