const ROOT = '/admin';

const getJson = async (url) => (await fetch(url).then(x => x.json())).data;

const getIsLoggedIn = async () => await getJson(ROOT + '/isLoggedIn');

const getSurveys = async () => await getJson(ROOT + '/surveys');

export { getIsLoggedIn, getSurveys };