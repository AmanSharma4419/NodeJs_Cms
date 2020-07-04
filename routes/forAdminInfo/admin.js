const express = require('express');
const router = express.Router();
const authentication = require('../../middleware/authentication')
const pagesController = require('../../controller/pagesController.js');
const adminController = require('../../controller/adminController.js');
const contentController = require('../../adminController/contentController.js');
const CarTypesController = require('../../controller/cartypecontroller');
const countryController = require('../../adminController/countryController');
const cityController = require('../../adminController/cityController');
const languageController = require('../../adminController/langaugeController');
const cityTypeController = require('../../adminController/cityTypeController');
const faqController = require('../../adminController/faqController');
const userController = require('../../adminController/userController');
var driverController = require('../../adminController/driverController');
const multipart = require('connect-multiparty');
const multipartMiddleware = multipart();


router.post('/adminLogin',userController.adminLogin);
router.post('/addAdmin',userController.addAdmin);
router.get('/getAllAdminList',userController.getAllAdminList);
router.post('/editAdmin',userController.editAdmin);
router.post('/addUser', userController.addUser);
router.post('/getUsersWithFilter', userController.getUserWithFilter);
router.post('/editUser', userController.editUser);
router.get('/getUserById/:userId', userController.getUserById);
router.post('/removeUser',userController.removeUser);
router.post('/sendNotification',userController.sendNotification);
router.post('/blockUnblockCustomer', userController.blockUnBlockCustomer)


router.get('/aboutus', pagesController.getAboutUsContent);
router.get('/privacypolicy', pagesController.getPrivacyPolicyContent);
router.get('/refundpolicy', pagesController.getRefundPolicyContent);
router.get('/termsandconditions', pagesController.getTermsAndConditionsContent);
router.get('/helpandsupport', pagesController.getHelpAndSupportContent);


//pages content
router.post('/contents', contentController.getAllContents);
router.get('/contents/edit/:id', contentController.getContentById);
router.post('/contents/update', contentController.editContent);
router.post('/contents/remove', contentController.deleteContent);
router.post('/contents/add', contentController.addContent);

//send support email to admin for both customer and driver app
router.post('/sendsupportemail', adminController.sendSupportEmail);

// get all car type list
router.get('/cartypes', CarTypesController.getCartypeList);
router.get('/enabledcartypes', CarTypesController.getEnabledCartypeList);
router.get('/cartypes/edit/:_id', CarTypesController.getCartypeDetails);
router.post('/addcartypes', CarTypesController.addCarTypeData);
router.post('/removecartypes', CarTypesController.removeCarTypeData);
router.post('/updatecartype', CarTypesController.updateCartypeDetails);

//languages
router.get('/languagescodes', languageController.gatLanguagesCode);
router.post('/addlanguage', languageController.addLanguageData);
router.get('/languages', languageController.getLanguageList);
router.get('/enabledlanguages', languageController.getEnabledLanguageList);
router.get('/languagedetails/:_id', languageController.getLanguageDetailsById);
router.post('/updatelanguage', languageController.updateLanguageData);
router.post('/removelanguage', languageController.removeLanguageData);

//country
router.post('/addcountry', countryController.addCountryData);
router.get('/allcountries', countryController.getCountryList);
router.get('/enabledcountries', countryController.getEnabledCountryList);
router.get('/countrydetails/:_id', countryController.getCountryDetailsById);
router.post('/updatecountry', countryController.updateCountryData);
router.post('/removecountry', countryController.removeCountryData);
router.get('/countriesdropdown', countryController.getCountriesDropdownList);

//cities
router.post('/addcity', cityController.addCityData);
router.get('/allcities', cityController.getCityList);
router.get('/enabledcities', cityController.getEnabledCityList);
router.get('/citydetails/:_id', cityController.getCityDetailsById);
router.post('/citybycountry', cityController.getCityByCountryId);
router.post('/updatecity', cityController.updateCityData);
router.post('/removecity', cityController.removeCityData);

//city types
router.post('/addcitytype', cityTypeController.addCityTypeData);
router.get('/allcitytypes', cityTypeController.getCityTypeList);
router.get('/enabledcitytypes', cityTypeController.getEnabledCityTypeList);
router.get('/citytypedetails/:_id', cityTypeController.getCityTypeDetailsById);
router.post('/updatecitytype', cityTypeController.updateCityTypeData);
router.post('/removecitytype', cityTypeController.removeCityTypeData);


router.post('/addFaq', faqController.addFaq);
router.post('/editFaq',faqController.editFaq);
router.post('/deleteFaq', faqController.deleteFaq);
router.post('/getAllFaqs', faqController.getAllFaqs);
router.get('/getFaqsById/:id', faqController.getFaqsById);

//socket test
router.get('/socket', adminController.socketCheck);

module.exports = router;