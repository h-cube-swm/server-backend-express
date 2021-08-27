const {
  version: uuidVersion,
  validate: uuidValidate,
} = require("uuid");

/**
 * This function returns a response json
 * @param {Number} status
 * @param {Object} data
 */
const getResponse = (result, comment = "Success") => ({
  result,
  comment,
});

const getComment = (comment) => getResponse(null, comment);

/**
 * 
 * @param {*} uuid 
 * @returns 
 */
async function checkUUID(uuid) {
  // ToDo : 여기서 에러 발생 시 정상적으로 동작한다. 왜??
  return uuidValidate(uuid) && uuidVersion(uuid) === 4;
}

module.exports = { getResponse, getComment, checkUUID };
