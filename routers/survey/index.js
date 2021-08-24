const express = require('express');

const router = express.Router();

function middelware(req, res, next) {

}

router.get('/', middelware, (req, res) => {

});

router.get('/add', (req, res) => {
  //Do some precess
});

router.pose('/sub', () => {

});

router.put('/');

module.exports = router;