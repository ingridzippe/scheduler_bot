var express = require('express');
var router = express.Router();


router.get('/', function(req, res, next) {
  // res.redirect('https://slack.com/oauth/authorize')
  // axios.get('https://slack.com/oauth/authorize', {
  //   params: {
  //     client_id: process.env.CLIENT_ID,
  //     scope: ,
  //   }
  // })
  // .then(function (response) {
  //   console.log(response);
  // })
  // .catch(function (error) {
  //   console.log(error);
  // });
  res.send('noob')
});

router.post('/', function(req, res, next) {
  console.log('Body', req.body)
  
})

module.exports = router;
