const express = require('express');
const router = express.Router();
const drivercontroller = require('../../controller/drivercontroller.js');

// get all drivers remove it later
router.get('/', drivercontroller.getDriversList);
// zaprroved or not .. after registering   remove it later
router.post('/status', drivercontroller.driverStatusUpdate);
//update driver status to "Finding Trips"
router.post('/udstatus', drivercontroller.driverStatusUpdateFT);
//nodemailer fun uncomment and add creds ---need to change to mailget
router.post('/forgotpassword', drivercontroller.driverForgotPassword);
// after forgot password
router.post('/resetpassword', drivercontroller.driverResetPassword);
// Log in driver 
router.post('/login', drivercontroller.driverLogin);
// register the driver
router.post('/register', drivercontroller.driverRegister);
// upload profile image for driver
router.post('/profileimage', drivercontroller.driverUploadProfileImage);
// update other fields in profile
router.post('/updateprofile', drivercontroller.driverUpdateProfile);
router.post('/addaccount', drivercontroller.driverAddBankAccount);
//update doc
router.post('/updatedoc', drivercontroller.driverUpdateDoc);
router.post('/adddoc', drivercontroller.driverAddDoc);

// after logging into app 
router.post('/changepassword', drivercontroller.driverChangePassword);
//  expiry date validations either here or use agenda 
router.post('/onlineoffline', drivercontroller.driverGoOnlineOffline);
// driver offline api for any button later introduced
// logout driver

router.post('/endofdaytrip', drivercontroller.driverEndOfDayTrip);

router.get('/logout', drivercontroller.driverLogout);

router.get('/profile', drivercontroller.driverGetProfileData);

router.post('/resendotp', drivercontroller.resendOTPDriver);

router.post('/chathistory', drivercontroller.getDriverChatHistory);

router.get('/everything', drivercontroller.driverGetEverythingData);


module.exports = router;