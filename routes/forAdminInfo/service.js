var express = require('express');
var router = express.Router();
const multipart = require('connect-multiparty');
const multipartMiddleware = multipart();
const serviceController = require('../../adminController/serviceController');
const authentication = require('../../middlewares/authentication')


router.post('/addService',authentication,serviceController.addService);
router.post('/editService',authentication,serviceController.editService);
router.post('/serviceStop',authentication,serviceController.serviceStop);
router.get('/getAllServices',authentication,serviceController.getAllServices);
router.get('/getServicesById/:id',authentication,serviceController.getServicesById);
router.post('/searchServices',authentication,serviceController.searchServices);
router.post('/addNewCar',authentication,multipartMiddleware,serviceController.addNewCar);
router.post('/editCar',authentication,multipartMiddleware,serviceController.editCar);
router.post('/changeCarStatus',authentication,serviceController.changeCarStatus);


module.exports = router;
