const jose = require("node-jose");
const axios = require("axios");

const AUTH_KEY_URL = "https://auth.the-form.io/keys";

let verifier = null;

let timeout = true;
async function updateKeyStore() {
  if (!timeout) return;
  timeout = false;
  setTimeout(() => {
    timeout = true;
  }, 1000);

  try {
    // Get RS256 JWT public key and create verifier
    const response = await axios.get(AUTH_KEY_URL);
    const publicKey = response.data;
    const keyStore = await jose.JWK.asKeyStore(publicKey);
    verifier = jose.JWS.createVerify(keyStore);
  } catch (e) {
    console.error(e);
  }
}
updateKeyStore();

function verify(jwt) {
  updateKeyStore();
  return verifier.verify(jwt);
}

module.exports = verify;
