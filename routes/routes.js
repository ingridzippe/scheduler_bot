var express = require('express');
var router = express.Router();

router.post('/', function(req, res, next) {
  console.log('Body', req.body)
  console.log('here');
  res.send(req.query.challenge)
})

router.get('/', function(req, res, next) {
  res.send('hello')
});


module.exports = router;
