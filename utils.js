/**
 * This function returns a response json
 * @param {Number} status
 * @param {Object} data
 */
const getResponse = (data, comment = "Success") => ({
  data,
  comment,
});

module.exports = getResponse;
