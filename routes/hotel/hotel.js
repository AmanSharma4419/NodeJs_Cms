var express = require('express');
var router = express.Router();
var hotelController = require('../../controller/hotelController.js');
var hotelPaymentController = require('../../controller/hotelPaymentController');


router.post('/', hotelController.getAllHotelList);

router.post('/register', hotelController.registerHotelByAdmin);

router.post('/login', hotelController.hotelLoginAuth);

router.get('/profile/view', hotelController.getHotelProfileDetails);

router.post('/updateprofile', hotelController.hotelUpdateProfile);

router.post('/changepassword', hotelController.fmChangePassword);

router.post('/forgotpassword', hotelController.fmForgotPassword);

router.post('/resetpassword', hotelController.fmResetPassword);

router.post('/estimatedcost', hotelController.hotelCalculateEstimateCost);

router.post('/createrequest', hotelController.hotelCreateCustomerRequest);

router.post('/request', hotelController.getHotelRideNowRequest);

router.post('/futurerequest', hotelController.getHotelRideLaterRequest);

router.get('/trip/:_id', hotelController.getHoterTripDeatails);

router.get('/hotelById/:hotelId', hotelController.getHotelById);

router.post('/getTripsByStatus', hotelController.getTripsByStatus);

router.post('/cancelrequest', hotelController.cancelHotelTripRequest);

router.post('/remove', hotelController.removeHotelByAdmin);

//hotel payment info
router.get('/payment/list', hotelPaymentController.getUserAddedPaymentOptions);

router.post('/payment/addcard', hotelPaymentController.addUserPaymentOption);

router.post('/payment/selected', hotelPaymentController.updateUserSelectedPaymentOption);

router.post('/payment/delete', hotelPaymentController.deleteUserPaymentOption);

module.exports = router;