var express = require('express');
var router = express.Router();
var CarTypesController = require('../../controller/cartypecontroller');

// get all car type list
router.get('/', CarTypesController.getCartypeList);
//Add car type data
router.post('/addcartypes', CarTypesController.addCarTypeData);
//Remove Car type
router.post('/removecartypes', CarTypesController.removeCarTypeData);


module.exports = router;