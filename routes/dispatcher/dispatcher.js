var express = require('express');
var router = express.Router();
var dispatcherController = require('../../controller/dispatcherController.js');
var dispatcherPaymentController = require('../../controller/dispatcherPaymentController');


router.post('/', dispatcherController.getAllDispatcherList);

router.post('/register', dispatcherController.registerDispatcherByAdmin);

router.post('/login', dispatcherController.dispatcherLoginAuth);

router.get('/profile/view', dispatcherController.getDispatcherProfileDetails);

router.post('/updateprofile', dispatcherController.dispatcherUpdateProfile);

router.post('/changepassword', dispatcherController.fmChangePassword);

router.post('/forgotpassword', dispatcherController.fmForgotPassword);

router.post('/resetpassword', dispatcherController.fmResetPassword);

router.post('/estimatedcost', dispatcherController.dispatcherCalculateEstimateCost);

router.post('/createrequest', dispatcherController.dispatcherCreateCustomerRequest);

router.post('/request', dispatcherController.getDispatcherRideNowRequest);

router.post('/futurerequest',dispatcherController.getDispatcherRideLaterRequest);

router.get('/trip/:_id', dispatcherController.getDispatcherTripDeatails);

router.get('/dispatcherById/:dispatcherId', dispatcherController.getDispatcherById);

router.post('/getTripsByStatus', dispatcherController.getTripsByStatus);

router.post('/cancelrequest', dispatcherController.cancelDispatcherTripRequest);

router.post('/remove', dispatcherController.removeDispatcherByAdmin);

//hotel payment info
router.get('/payment/list', dispatcherPaymentController.getUserAddedPaymentOptions);

router.post('/payment/addcard', dispatcherPaymentController.addUserPaymentOption);

router.post('/payment/selected', dispatcherPaymentController.updateUserSelectedPaymentOption);

router.post('/payment/delete', dispatcherPaymentController.deleteUserPaymentOption);

module.exports = router;