const ejs = require("ejs");
const AWS = require("aws-sdk");

// container에 주입된 환경변수 받아오기
const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env;

// AWS SES에 활용할 아마존 accesskey, secreykey config
const SES_CONFIG = {
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: "ap-northeast-2",
};

// 위 config 정보를 토대로 SES 객체 생성
const AWS_SES = new AWS.SES(SES_CONFIG);

/**
 * 이 함수는 아마존 SES를 활용해 이메일을 송신하는 함수입니다.
 * @param {recipientEmail} 수신자 이메일
 * @param {title} 설문 제목
 * @param {surveyId} 설문 링크
 * @param {deployId} 설문 배포링크
 * @returns "FAIL" or "SUCCESS"
 */
const sendEmail = async (recipientEmail, title, surveyId, deployId) => {
  try {
    const renderFile = await ejs.renderFile("./templates/mail.ejs", {
      title: title,
      surveyId: surveyId,
      deployId: deployId,
    });
    const params = {
      Source: "support@the-form.io",
      Destination: {
        ToAddresses: [recipientEmail],
      },
      ReplyToAddresses: [],
      Message: {
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: renderFile,
          },
        },
        Subject: {
          Charset: "UTF-8",
          Data: `더폼에서 작성하신 <${title}>에 대한 설문 정보입니다.`,
        },
      },
    };
    await AWS_SES.sendEmail(params).promise();
  } catch (err) {
    console.log("이메일 송신에 실패하였습니다.");
    return false;
  }
  return true;
};

module.exports = { sendEmail };
