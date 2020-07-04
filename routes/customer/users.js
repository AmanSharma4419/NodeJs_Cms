const express = require('express');
const router = express.Router();
const usercontroller = require('../../controller/userController.js');
const addressController = require('../../controller/addressController.js');

//get all users
router.get('/', usercontroller.getUsersList);
/*
*User registration
*@params
* firstName, lastName, email, password
*/
router.post('/register', usercontroller.userRegister);

router.post('/importCsvList', usercontroller.importCsvList);

/*
*Customer Login
*@params: email, password
*/
router.post('/login', usercontroller.userLogin);

router.post('/acknowledgeSocialRegistration', usercontroller.acknowledgeSocialRegistration);

//login api password screen
router.post('/password', usercontroller.userPassword);

//upload user profile pic to aws s3
router.post('/upload', usercontroller.userUploadProfileImage);
/*
*Customer Forgot Password
*@params: email
*/
router.post('/forgotpassword', usercontroller.userForgotPassword);

/*
*Customer Reset Password
*@params: email, password, confirmPassword
*/
router.post('/resetpassword', usercontroller.userResetPassword);

/*
*Customer get profile
*@params: _id
*/
router.get('/profile', usercontroller.getUserProfileById);

//update profile
router.post('/updateprofile', usercontroller.userUpdateProfile);

/**
 * @changepassword : Api to change the password of the user
 */
router.post('/changepassword', usercontroller.changeUserPassword);

/**
 * @changepassword : Api to resend the Otp of the user
 */
router.post('/resendotp', usercontroller.resendOTP);

//user everything
router.get('/everything', usercontroller.userEverything);

//add user emergency contact
router.post('/addcontact', usercontroller.userAddContact);
//remove contact
router.post('/removecontact', usercontroller.removeUserContact);

//get user contacts
router.get('/getcontact', usercontroller.getUserContacts);
router.post('/panicsms', usercontroller.userSendPanicSMS);
router.post('/imagetest', usercontroller.imageTest);
router.get("/csvimport", usercontroller.csvImport)

//user manage address
router.get('/address', addressController.getUserAddressList);
router.post('/addaddress', addressController.userAddAddress);
router.get('/address/view/:_id', addressController.userGetAddressDetails);
router.post('/updateaddress', addressController.userUpdateAddress);
router.post('/addressdefault', addressController.userUpdateDefaultAddress);
router.post('/removeaddress', addressController.userRemoveAddress);

router.post('/chathistory', usercontroller.getUserChatHistory);

module.exports = router;