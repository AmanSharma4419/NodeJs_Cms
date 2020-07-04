var express = require('express');
var router = express.Router();
const multipart = require('connect-multiparty');
const multipartMiddleware = multipart();
const driverController = require('../../adminController/driverController');
const authentication = require('../../middleware/authentication');

router.post('/addDriver',  multipartMiddleware, driverController.addDriver)
router.post('/driversList', driverController.getDriverList);
router.post('/editDriverProfile', multipartMiddleware, driverController.editDriverProfile);
router.post('/driverAccountDetails',  multipartMiddleware, driverController.driverAccountDetails);
router.post('/driversBolckedList',driverController.driversBolckedList);
router.post('/statusChange', driverController.statusChange);
router.post('/blockUnblock', driverController.blockUnBlockDriver);
router.post('/driversOnlineList', driverController.driversOnlineList);
router.post('/getDriverPaymentDetails', driverController.getDriverPaymentDetails);
router.post('/driverPayments', driverController.driverPayments);
router.post('/getTripsByStatus', driverController.getTripsByStatus);
router.post('/getDashboardDetails',  driverController.getDashboardDetails);
router.get('/getAllDriverTransactionsById/:id', multipartMiddleware, driverController.getAllDriverTransactionsById);
router.get('/getTripsByDriverId/:id', multipartMiddleware, driverController.getTripsByDriverId);
router.get('/getTripsById/:id', multipartMiddleware, driverController.getTripsById);
router.get('/deleteDriver/:driverId', driverController.removeDriver);
router.get('/getDriverById/:driverId', driverController.getDriverById);
router.post('/updateDriver', driverController.editDriver);
router.get('/getDriverTrips/:id', multipartMiddleware, driverController.getDriverTrips);

module.exports = router;
