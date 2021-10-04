const ROOT = '/admin';

const getJson = async (url) => (await fetch(url).then(x => x.json())).data;

const isLoggedIn = async () => await getJson(ROOT + '/isLoggedIn');

export { isLoggedIn };