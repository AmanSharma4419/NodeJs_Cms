var express = require('express');
var router = express.Router();
var carscontroller = require('../../controller/carscontroller');

// get all cars list
router.get('/', carscontroller.getAllCarsList);
//Add car data
router.post('/addcar', carscontroller.addCarData);
//remove car by id
router.post('/removecar', carscontroller.removeCarById);
//get driver active car
router.post('/selectedcar', carscontroller.getDriverActiveSelectedCar);
//get driver added car list
 router.get('/getcarslist', carscontroller.getDriverAddedCarsList);

module.exports = router;
