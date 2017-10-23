var express = require('express');
var router = express.Router();


router.get('/', function(req, res, next) {
  res.send('yes')
});

router.post('/', function(req, res, next) {
  res.send(req.body.challenge)
})


module.exports = router;
