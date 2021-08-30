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

module.exports = { getResponse, getComment };
