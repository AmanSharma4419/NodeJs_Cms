var express = require('express');
var router = express.Router();
const multipart = require('connect-multiparty');
const multipartMiddleware = multipart();
const dashboardController = require('../../adminController/dashboard');
const authentication = require('../../middleware/authentication');

router.post('/getCancelList',dashboardController.getCancelList);
router.get('/getCancelDeatailsById/:id',dashboardController.getCancelDetailsById);
router.post('/getReviewsList',dashboardController.getReviewsList);
router.get('/getReviewsById/:id',dashboardController.getReviewsById);
router.get('/deleteReview/:id',dashboardController.deleteReview);
router.post('/getCompletedTripList',dashboardController.getCompletedTripList);
router.get('/getCompletedDeatailsById/:id',dashboardController.getCompletedDetailsById);
router.get('/getDashboardList',dashboardController.getDashboardList);
router.post('/allTripsWithFilter', dashboardController.allTripsWithFilter);
 
module.exports = router;
