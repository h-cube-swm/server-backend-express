const crypto = require('crypto');

function getUUID() {
  return crypto.randomBytes(48, function (err, buffer) {
    var token = buffer.toString('hex');
  });
}

// For survey
const surveySchema = {
  _id: 'Id provided by mongo',
  userId: userId,
  surveyId: 'Unique identifier for each survey', // _id를 대신 사용 가능함
  responseId: 'Unique identifier for surveys',
  title: 'ASDF',
  description: "",
  questions: [
    // Objects
  ],
  state: string,
  meta: {}
};

const responseSchema = {
  _id: id,
  userId: userId, // 응답하는 사람
  surveyId: asdf,
  responses: {
    questionId: response
  }
};

const user = {
  _id: id,
  kakaoId: string,
  localId: string,
};

/**
 * JWT vs Session
 *
 * JWT의 장점 :
 *  이미 다 만들어놓음.
 *  DB에 부하가 약간 적다.
 *
 * 세션 :
 *  아직 못 만들었지만 만들기 쉽다.
 *  옛날부터 쓰던 거라 별 문제가 없다.
 */

/**
 * 유저 추가 / 삭제를 어떻게 할 것인가?
 * 모든 사용자는 반드시 고유한 ID를 가진다. 로그인을 하지 않은 유저라도 마찬가지다.
 * 일단은 다른 것은 고려하지 않고, 유저는 오직 카카오톡으로 로그인한 경우만을 고려한다고 가정하자.
 * 그러면 여러가지 생각할 것이 줄어든다.
 * 먼저 유저는 auth server에서 카카오톡 로그인 인증을 받는다.
 */