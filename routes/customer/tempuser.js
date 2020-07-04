var express = require('express');
var router = express.Router();
var tucontroller = require('../../controller/tempusercontroller.js');

// get all tempusers
router.get('/', tucontroller.getTempUsersList);
// for pupulating DB
router.post('/pop', tucontroller.tempUserPopulateDB);
//remove temp user
router.delete('/remove/:mobileNumber',tucontroller.removeTempUser);

module.exports = router;
