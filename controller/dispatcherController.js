var Dispatcher = require('../models/dispatcherTable');
var jwt = require('jsonwebtoken');
var validator = require('validator');
var moment = require('moment-timezone');
var Auth = require('../middleware/auth');
var CarTypes = require('../models/ServicesCars');
var GoogleMapsAPI = require('googlemaps');
var trips = require('../models/triptable');
var User = require('../models/userTable');
var Driver = require('../models/drivertable');
const tripModel = require('../models/triptable');
var POs = require('../models/dispatcherPaymentOptions');
const stats = require('../models/reports');
let agenda = require('../jobs/agenda');
const Country = require('../models/countryTable');
const City = require('../models/cityTable');
const CityType = require('../models/citytypeTable');
const socketDriver = require('../models/socketDriver');
var Payment = require('../lib/paymenthandler.js');
var MailTemplate = require('../models/mailTemplate.js');
var mailgunSendEmail = require('../lib/mailgunSendEmail.js');
var otpVerification = require('../lib/otpverification.js');
const basicsetting = require('../config/basicsetting.json');
const ObjectId = require('objectid');
const googleMapsClient = require('@google/maps').createClient({
    key: 'AIzaSyCS6VfhaV6MNwtOHaXfBJY0ntUs34YUhaA',
    //language: 'en',
    Promise: Promise
});

module.exports = {

    getAllDispatcherList: async (req, res) => {
        try {
            var verifydata = await Auth.validateAdmin(req.headers);
            if (verifydata == null) {
                return res.status(401).json({ message: "Not Authorized!", data: {}, error: {} })
            }
            const {orderBy, order, page, limit, fieldName, fieldValue, filter} =req.body
            var pageSize       = limit  || 10;
            var sortByField    = orderBy ||"createdAt";
            var sortOrder      = order   || -1;
            var paged          = page || 1;
            let obj={};
            if(fieldName && fieldValue) {
                obj[fieldName]={ $regex: fieldValue || '', $options : 'i'};
            }
            if (filter) {
                obj['$and'] = [];
                obj['$and'].push({
                    '$or': [{ name: { $regex: filter || '', $options: 'i' } },
                            { email: { $regex: filter || '', $options: 'i' } }
                            ]
                })
            } 
            let count = await Dispatcher.aggregate([{$match:obj},{ $group: { _id: null, count: { $sum: 1 } } }]);
            Dispatcher.aggregate(
                [
                  {$match:obj},
                  {$sort :{[sortByField]: parseInt(sortOrder)}},
                  {$skip: (paged-1)*pageSize},
                  {$limit: parseInt(pageSize)},
               ], async function (err, resdata) {
                   if(err){
                      res.status(404).json({ "message": "No Dispatchers in database!", data: {}, "error": err });
                   }else{
                      res.status(200).json({ "message": "Dispatchers  List!", data: resdata,  "totalcount":count[0]?count[0].count:0 ,"error": {} });
                   }
               })
        } catch (error) {
            res.status(500).json({ "message": "Internal Server Error!", data: {}, "error": error });
        }
    },

    registerDispatcherByAdmin: async (req, res) => {
        try {
            var data = req.body;

            if (!data.name) {
                return res.status(400).json({ "status": "failure", "message": "Name is required!" });
            }

            data.name = data.name.trim();

            var checkDispatcherName = await Dispatcher.getDispatcherByName({ name: data.name });

            if (checkDispatcherName != null) {
                return res.status(400).json({ "status": "failure", "message": "Dispatcher Name is already exist!" });
            }

            if (!data.phoneNumber) {
                return res.status(400).json({ "status": "failure", "message": "Phone Number is required!" });
            }
            var checkDispatcherEmail = await Dispatcher.getDispatcherByEmail({ email: data.email });
            if(checkDispatcherEmail != null){
                return res.status(400).json({ "status": "failure", "message": "Dispatcher email already exist already exist!" });
            }
            if (!data.email) {
                return res.status(400).json({ "status": "failure", "message": "Email is required!" });
            }

            if (!validator.isEmail(data.email)) {
                return res.status(400).json({ "message": "Enter valid email!", "data": {}, "error": {} })
            }

            if (!data.address) {
                return res.status(400).json({ "status": "failure", "message": "Address is required!" });
            }

            if(!data.discountStatus){
                return res.status(400).json({ "status": "failure", "message": "Discount Status is required!" });
            }

            if(data.discountStatus == "yes"){

                if(!data.discountPercentage){
                    return res.status(400).json({ "status": "failure", "message": "Discount Percentage is required!" });
                }

            }else{
                data.discountStatus = "no";
                data.discountPercentage = 15;
            }

            if (!data.city) {
                return res.status(400).json({ "status": "failure", "message": "City is required!" });
            }

            if (!data.countryName) {
                return res.status(400).json({ "status": "failure", "message": "Country Name is required!" });
            }

            if (!data.password) {
                return res.status(400).json({ "status": "failure", "message": "Password is required!" });
            };

            if (!data.lat || !data.lng) {
                return res.status(400).json({ "status": "failure", "message": "Lat and lng is required!" });
            };

            data.password = require('crypto').createHash('sha256').update(data.password).digest('hex');

            data.dispatcherLocation = { type: "Point", coordinates: [data.lng, data.lat] };

            Dispatcher.addDispatcher(data, (err, resdata) => {
                if (err || resdata == null) {
                    return res.status(400).json({ "status": "failure", "message": "Unable to register dispatcher!", "data": {}, "error": err });
                } else {
                    res.status(200).json({ "status": "success", "message": "Dispatcher registered successfully!", "data": resdata });
                }
            });

        } catch (error) {
            console.log(error);
            res.status(500).json({ "message": "Internal Server Error!", data: {}, "error": error });
        }
    },
    
     
    dispatcherLoginAuth: async (req, res) => {
        try {
            var data = req.body;
            data.email = data.email.trim().toLowerCase();

            if (!data.email) {
                return res.status(200).json({ "message": "Please Enter Email!.", "data": {}, "error": {} });
            }

            if (!validator.isEmail(data.email)) {
                return res.status(200).json({ "message": "Enter valid email!", "data": {}, "error": {} })
            }

            if (!data.password) {
                return res.status(200).json({ "message": "Please Enter password!.", "data": {}, "error": {} });
            }

            data.password = data.password.trim();

            var verify = await Dispatcher.getDispatcherByEmail({ email: data.email });

            if (verify == null) {
                return res.status(200).json({ "message": "Email does not exist!", "data": {}, "error": {} });
            }

            data.password = require('crypto').createHash('sha256').update(data.password).digest('hex');

            if (data.password != verify.password) {
                return res.status(200).json({ "message": "Wrong Password!", "data": {}, "error": {} });
            }

            var token = jwt.sign(
                {
                    email: verify.email,
                    userId: verify._id
                },
                'secret',
                {
                    expiresIn: "2h"
                }
            );

            data.token = token;
            console.log("Token", token);

            Dispatcher.updateTokenDispatcher(data, function (err, tokendata) {
                console.log("Token Data", token);
                if (err || tokendata == null) {
                    return res.status(200).json({ "message": "Unable to login!", "data": {}, "error": err })
                }
                else {
                    res.json({ "message": "Login Successful!", "data": tokendata, "error": {} })
                }
            });
            
        } catch (error) {
            console.log(error);
            res.status(500).json({ "message": "Internal Server Error!", data: {}, "error": error });
        }
    },

    getDispatcherProfileDetails: async (req, res) => {
        try {
            var verifydata = await Auth.validateDispatcher(req.headers);
            var verifyadmin = await Auth.validateAdmin(req.headers);
            if (verifydata == null && verifyadmin == null) {
                return res.status(401).json({ message: "Not Authorized!", data: {}, error: {} })
            }

            Dispatcher.getDispatcherById(verifydata._id, (err, resdata) => {
                if (err || resdata == null) {
                    return res.status(400).json({ "message": "Not a valid Dispatcher!", "data": {}, "error": err })
                }
                else {
                    res.json({ "message": "Dispatcher Details!", "data": resdata, "error": {} })
                }
            });

        } catch (error) {
            console.log(error);
            res.status(500).json({ "message": "Internal Server Error!", data: {}, "error": error });
        }
    },

    getDispatcherProfileDetailsById: async (req,res) => {
        try {
            var verifydata = await Auth.validateDispatcher(req.headers);
            var verifyadmin = await Auth.validateAdmin(req.headers);
            if (verifydata == null && verifyadmin == null) {
                return res.status(401).json({ message: "Not Authorized!", data: {}, error: {} })
            }

            Dispatcher.getDispatcherById(req.params.id, (err, resdata) => {
                if (err || resdata == null) {
                    return res.status(400).json({ "message": "Not a valid Dispatcher!", "data": {}, "error": err })
                }
                else {
                    res.json({ "message": "Dispatcher Details!", "data": resdata, "error": {} })
                }
            });

        } catch (error) {
            console.log(error);
            res.status(500).json({ "message": "Internal Server Error!", data: {}, "error": error });
        }
    },

    getDispatcherById: async (req,res) => {
        try{
            var verifydataadmin = await Auth.validateAdmin(req.headers);
            if( verifydataadmin == null){
                return res.status(401).json({ message: "Not Authorized!", data: {}, error: {} })
            }
            if(!req.params.dispatcherId){
                return res.status(200).json({ "message": "Dispatcher id is required.", "data": {}, "error": {} });
            }
            Dispatcher.getDispatcherById(req.params.dispatcherId, (err, resdata) => {
                if(err){
                    return res.status(400).json({ "message": "Not a valid Dispatcher!", "data": {}, "error": err })
                }else{
                    res.json({ "message": "Dispatcher Details!", "data": resdata, "error": {} })
                }
            });
        }catch(error){
            res.status(500).json({ "message": "Internal Server Error!", data: {}, "error": error });
        }
    },

    dispatcherUpdateProfile: async (req, res) => {
        try {
            var verifydata = await Auth.validateDispatcher(req.headers);
            var verifydataadmin = await Auth.validateAdmin(req.headers);
            if (verifydata == null && verifydataadmin == null) {
                return res.status(401).json({ message: "Not Authorized!", data: {}, error: {} })
            }

            var data = req.body;
            if(verifydata){
                data.dispatcherId = verifydata._id;
            }
            console.log("data", data);

            if (!data.name) {
                return res.status(400).json({ "status": "failure", "message": "Name is required!" });
            }

            data.name = data.name.trim();

            if (!data.phoneNumber) {
                return res.status(400).json({ "status": "failure", "message": "Phone Number is required!" });
            }

            if (!data.email) {
                return res.status(400).json({ "status": "failure", "message": "Email is required!" });
            }

            if (!validator.isEmail(data.email)) {
                return res.status(400).json({ "message": "Enter valid email!", "data": {}, "error": {} })
            }

            if (!data.address) {
                return res.status(400).json({ "status": "failure", "message": "Address is required!" });
            }

            if (!data.city) {
                return res.status(400).json({ "status": "failure", "message": "City is required!" });
            }

            if (!data.countryName) {
                return res.status(400).json({ "status": "failure", "message": "Country Name is required!" });
            }

            if(data.password) {
                data.password = require('crypto').createHash('sha256').update(data.password).digest('hex');
            }

            if (!data.lat || !data.lng) {
                return res.status(400).json({ "status": "failure", "message": "Lat and lng is required!" });
            };

            data.dispatcherLocation = { type: "Point", coordinates: [data.lng, data.lat] };

            Dispatcher.updateProfile(data, (err, resdata) => {
                if (err || resdata == null) {
                    return res.status(400).json({ "message": "Not a valid Dispatcher!", "data": {}, "error": err })
                }
                else {
                    res.json({ "message": "Updated Profile!", "data": resdata, "error": {} })
                }
            });

        } catch (error) {
            console.log(error);
            res.status(500).json({ "message": "Internal Server Error!", data: {}, "error": error });
        }
    },

    removeDispatcherByAdmin: async (req, res) => {
        try {
            var data = req.body;

            if (!data.dispatcherId) {
                return res.status(400).json({ "status": "failure", "message": "Dispatcher Id is required!", "data": {}, "error": {} });
            }

            Dispatcher.removeDispatcher(data.dispatcherId, (err, resdata) => {
                if (err || resdata == null) {
                    return res.status(400).json({ "status": "failure", "message": "Wrong Dispatcher id!", data: {}, "error": err });
                }
                else {
                    res.json({ "status": "success", "message": "Dispatcher deleted successfully!", data: resdata, "error": {} });
                }
            });


        } catch (error) {
            console.log(error);
            res.status(500).json({ "status": "failure", "message": "Internal Server Error!", data: {}, "error": error });
        }
    },

    fmChangePassword: async (req, res) => {
        try {
            var data = req.body;
            //console.log('change password data0', data);

            var verifydata = await Auth.validateDispatcher(req.headers);
            //console.log("verifydata", verifydata);
            if (verifydata === null) {
                return res.status(401).json({ message: "Not Authorized! Please logout and login!", data: {}, error: {} })
            }

            if (data.password != data.cnfpassword) {
                return res.status(400).json({ "message": "Password and confirm password does not match", "data": {}, "error": {} })
            }

            var passmain = data.password;

            //console.log('change password data1', data);

            if (!data.currentPassword) {
                return res.status(400).json({ "status": "failure", "message": "Current Password is required!", data: {} });
            }

            var currentPassword = require('crypto').createHash('sha256').update(data.currentPassword).digest('hex');

            if (currentPassword != verifydata.password) {
                return res.status(400).json({ "status": "failure", "message": "Old Password didn't match!", data: {} });
            }

            data.dispatcherId = verifydata._id;
            data.password = require('crypto').createHash('sha256').update(data.password).digest('hex');
            var token = jwt.sign(
                {
                    _id: verifydata._id.toString()
                },
                'secret',
                {
                    expiresIn: "15d"
                }
            );

            //data.tokens = verifydata.tokens.concat({ token });
            //console.log('change password data', data);
            data.token = token;

            Dispatcher.updatePasswordDispatcher(data, async function (err, resdata) {
                if (err || resdata == null) {
                    return res.status(400).json({ "message": "Can not update password", "data": {}, "error": err })
                }

                var mTemplate = await MailTemplate.findOne({ title: 'DRIVER_CHANGE_PASSWORD' });
                //  console.log('mailtemplate', mTemplate);
                if (mTemplate != null && !mTemplate) {
                    var msg = mTemplate.body.replace('XXXXXX', passmain);
                    var senemail = mailgunSendEmail.sendEmail(verifydata.email, mTemplate.emailTitle, msg);
                    //console.log(senemail); 
                } else {
                    var msg = 'Hi,<br><br><br> Password is successfully Changed to: ' + passmain;
                    var senemail = await mailgunSendEmail.sendEmail(verifydata.email, 'Elite Change Password', msg);
                }

                return res.json({ "message": "Password Changed Successfully!", "data": resdata, "error": {} })
            })
        }
        catch (err) {
            return res.status(500).json({ "message": "Internal Server Error!", "data": {}, "error": err });
        }
    },

    fmForgotPassword : async(req,res) => {
        try {
          var data = req.body;
          data.email = data.email.trim().toLowerCase();
  
          if (!data.email) {
              return res.status(400).json({ "message": "Please Enter Email!.", "data": {}, "error": {} });
          }
  
          if (!validator.isEmail(data.email)) {
              return res.status(400).json({ "message": "Enter valid email!", "data": {}, "error": {} })
          }
  
          var verifyemail = await Dispatcher.findDispatcher(data.email);
          if (verifyemail.length == 0) {
              return res.status(400).json({ "message": "Email not found! please try again", "data": {}, "error": {} })
          }
          verifyemail = verifyemail[0];
          data.OTP = otpVerification.generateOTP();
          
          var msg = "Your OTP for Forgot Password: " + data.OTP;
          var senemail = await mailgunSendEmail.sendEmail(verifyemail.email, "Elite Forgot Password OTP", msg);
  
          var exptime = new Date();
          exptime.setHours(exptime.getHours() + 1);
          data.OTPexp = exptime;
      
          Dispatcher.updateOTPDispatcher(data, function (err, resdata) {
              if (err || resdata == null) {
                  return res.status(400).json({ "message": "Can not update OTP", "data": {}, "error": err })
              }
              return res.json({ "message": "OTP send on Email", "data": resdata, "error": {} })
          });
  
        } catch (error) {
          return res.status(500).json({ "message": "Internal Server Error!", "data": {}, "error": err });
        }
    },

    fmResetPassword : async(req,res) => {
        try {
          var data = req.body;
  
          if (data.password != data.cnfpassword) {
              return res.status(400).json({ "message": "Password and confirm password does not match", "data": {}, "error": {} })
          }
         
          if (!data.email) {
              return res.status(400).json({ "message": "Please Enter Email!.", "data": {}, "error": {} });
          }
  
          data.email = data.email.trim().toLowerCase();
  
          if (!validator.isEmail(data.email)) {
              return res.status(400).json({ "message": "Enter valid email!", "data": {}, "error": {} })
          }
  
          var verifyemail = await Dispatcher.findDispatcher(data.email);
          if (verifyemail.length == 0) {
              return res.status(401).json({ "message": "Email not found! please try again", "data": {}, "error": {} })
          }
          var passmain = data.password;
          verifyemail = verifyemail[0];
          var cDate = new Date();
          var exptime = new Date(verifyemail.OTPexp);
          if (cDate.getTime() >= exptime.getTime()) {
              return res.status(400).json({ "message": "OTP not valid", "data": {}, "error": {} })
          }
          data.password = require('crypto').createHash('sha256').update(data.password).digest('hex');
          
          var token = jwt.sign(
              {
                  _id: verifyemail._id.toString()
              },
              'secret',
              {
                  expiresIn: "15d"
              }
          );
  
          data.token = token
  
          Dispatcher.updatePasswordDispatcherPanle(data, async function (err, resdata) {
              if (err || resdata == null) {
                  return res.status(400).json({ "message": "Can not update password", "data": {}, "error": err })
              }
  
              var mTemplate = await MailTemplate.findOne({ title: 'DRIVER_RESET_PASSWORD' });
              console.log(mTemplate);
              if (mTemplate != null && !mTemplate) {
                  var msg = mTemplate.body.replace('XXXXXX', passmain);
                  await mailgunSendEmail.sendEmail(data.email, mTemplate.emailTitle, msg);
              } else {
                  var msg = 'Hi,<br><br><br> Password is successfully Reset to: ' + passmain;
                  await mailgunSendEmail.sendEmail(data.email, 'Elite Reset Password', msg);
              }
  
              return res.json({ "message": "Password reset Successful", "data": resdata, "error": {} })
          })
        } catch (error) {
            console.log("Error", error);
          return res.status(500).json({ "message": "Internal Server Error!", "data": {}, "error": error });
        }
    },

    dispatcherCalculateEstimateCost: async (req, res) => {
        try {
            var verifydata = await Auth.validateDispatcher(req.headers);
            if (verifydata == null) {
                return res.status(401).json({ message: "Not Authorized!", data: {}, error: {} })
            }
            
            var data = req.body;
            data.startLocationAddr = '';
            data.startLocation = {};
            data.endLocationAddr = '';
            data.endLocation = {};
            data.distance = 0;
            data.estimatedTime = 0;

            if (!data.source) {
                return res.json(helper.showValidationErrorResponse('SOURCE_LOCATION_IS_REQUIRED'));
            }

            if (!data.destination) {
                return res.json(helper.showValidationErrorResponse('DESTINATION_LOCATION_IS_REQUIRED'));
            }

            if (!data.source.addressComponents) {
                return res.json(helper.showValidationErrorResponse('SOURCE_LOCATION_IS_REQUIRED'));
            }

            data.startLocationAddr = data.source.startLocationAddr;
            data.startLocation = { lat: data.source.startLocation.lat, lng: data.source.startLocation.lng };

            data.endLocationAddr = data.destination.endLocationAddr;
            data.endLocation = { lat: data.destination.endLocation.lat, lng: data.destination.endLocation.lng };

            data.source.addressComponents.forEach(addresses => {

                if (addresses.types.includes("country")) {
                    data.country = addresses.long_name;
                    data.countryCode = addresses.short_name.toUpperCase().trim();
                }

                if (addresses.types.includes("administrative_area_level_1")) {
                    data.state = addresses.long_name;
                    data.stateCode = addresses.short_name;
                }

                if (addresses.types.includes("locality")) {
                    data.city = addresses.long_name;
                    data.cityCode = addresses.short_name;
                }
            });

            var isBusinessInCountry = await Country.isBusinessInCountry(data.countryCode);

            if (isBusinessInCountry == null) {
                return res.json(helper.showValidationErrorResponse('SERVICE_NOT_AVAIABLE'));
            }

            var params = {
                origins: data.startLocation, //"Washington, DC, USA"
                destinations: data.endLocation, //"New York, NY, USA"
                mode: "driving"
            }

            var distanceMatrixDetails = googleMapsClient.distanceMatrix(params)
                .asPromise()
                .then((response) => {
                    return response.json;
                })
                .catch((err) => {
                    return err.json;
                });

            let [distanceMatrix] = await Promise.all([distanceMatrixDetails]);

            if (distanceMatrix.status != "OK") {
                return res.json(helper.showGoogleMapsErrorResponse(distanceMatrix.error_message));
            }

            console.log("Distance Matrix", distanceMatrix);

            var distance = distanceMatrix.rows[0].elements[0].distance.value;
            //convert distance meters to km
            data.distance = Math.round((distance / 1000) * 100) / 100;
            var estimatedTime = distanceMatrix.rows[0].elements[0].duration.value;
            data.estimatedTime = Math.round((estimatedTime / 60) * 100) / 100; //time in seconds convert to min

            City.getCityByCountryCodeAndCityGoogleCode(data, (err, cityResponse) => {
                if (err) {
                    console.log("Errro1", err);
                    return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                }

                if (cityResponse === null) {

                    CarTypes.getEnabledCarsTypes((err, carTypeResponse) => {
                        if (err) {
                            console.log("Err", err);
                            return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                        }
                        else {

                            if (carTypeResponse.length === 0) {
                                return res.json(helper.showValidationErrorResponse("CARTYPES_NOT_ADDED"));
                            }else{
                                carTypeResponse.forEach(element => {

                                    var CalculateEstimatedCost = helper.caculateTripEstimatedCost(data.distance, data.estimatedTime, element);
                                    var estimatedCost = CalculateEstimatedCost.estimatedCost;
                                    var isSurgeTime = CalculateEstimatedCost.isSurgeTime;
                                    var surgeMultiplier = CalculateEstimatedCost.surgeMultiplier;
                                    var unit = CalculateEstimatedCost.unit;
                                    var actualDistance = CalculateEstimatedCost.distance;
    
                                    //console.log("actualDistance", actualDistance);
    
                                    element.set('unit', unit, { strict: false });
                                    element.set('estimatedCost', estimatedCost, { strict: false });
                                    element.set('distance', actualDistance, { strict: false });
                                    element.set('estimatedTime', data.estimatedTime, { strict: false });
                                    element.set('startLocationAddr', data.startLocationAddr, { strict: false });
                                    element.set('startLocation', data.startLocation, { strict: false });
                                    element.set('endLocationAddr', data.endLocationAddr, { strict: false });
                                    element.set('endLocation', data.endLocation, { strict: false });
                                    element.set('country', data.country, { strict: false });
                                    element.set('countryCode', data.countryCode, { strict: false });
                                    element.set('state', data.state, { strict: false });
                                    element.set('stateCode', data.stateCode, { strict: false });
                                    element.set('city', data.city, { strict: false });
                                    element.set('cityCode', data.cityCode, { strict: false });
                                    element.set('pricingType', "global", { strict: false });
                                    element.set('isSurgeTime', isSurgeTime, { strict: false });
                                    element.set('surgeMultiplier', surgeMultiplier, { strict: false });
    
                                });
    
                                res.json(helper.showSuccessResponse('DATA_SUCCESS', carTypeResponse));
    
                            }                            
                        }
                    });

                } else {

                    CityType.getCityTypeByCityId(cityResponse._id, (err, CityTypeResponse) => {
                        if (err) {
                            console.log("Error", err);
                            return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                        }
                        else {

                            if (CityTypeResponse.length === 0) {
                                return res.json(helper.showValidationErrorResponse("CARTYPES_NOT_ADDED"));
                            }else{
                                
                            CityTypeResponse.forEach(element => {

                                var CalculateEstimatedCost = helper.caculateTripEstimatedCost(data.distance, data.estimatedTime, element);
                                var estimatedCost = CalculateEstimatedCost.estimatedCost;
                                var isSurgeTime = CalculateEstimatedCost.isSurgeTime;
                                var surgeMultiplier = CalculateEstimatedCost.surgeMultiplier;
                                var unit = CalculateEstimatedCost.unit;
                                var actualDistance = CalculateEstimatedCost.distance;

                                element.set('carType', element.carTypeDetails.carType, { strict: false });
                                element.set('carImage', element.carTypeDetails.carImage, { strict: false });
                                element.set('unit', unit, { strict: false });
                                element.set('estimatedCost', estimatedCost, { strict: false });
                                element.set('distance', actualDistance, { strict: false });
                                element.set('estimatedTime', data.estimatedTime, { strict: false });
                                element.set('startLocationAddr', data.startLocationAddr, { strict: false });
                                element.set('startLocation', data.startLocation, { strict: false });
                                element.set('endLocationAddr', data.endLocationAddr, { strict: false });
                                element.set('endLocation', data.endLocation, { strict: false });
                                element.set('country', data.country, { strict: false });
                                element.set('countryCode', data.countryCode, { strict: false });
                                element.set('state', data.state, { strict: false });
                                element.set('stateCode', data.stateCode, { strict: false });
                                element.set('city', data.city, { strict: false });
                                element.set('cityCode', data.cityCode, { strict: false });
                                element.set('pricingType', "city", { strict: false });
                                element.set('isSurgeTime', isSurgeTime, { strict: false });
                                element.set('surgeMultiplier', surgeMultiplier, { strict: false });

                            });

                            res.json(helper.showSuccessResponse('DATA_SUCCESS', CityTypeResponse));
                          }

                        }
                    });
                }
            });
        }
        catch (err) {
            console.log("err", err);
            return res.json(helper.showInternalServerErrorResponse());
        }
    },

    dispatcherCreateCustomerRequest: async (req, res) => {
        try {
            var data = req.body;
            
            console.log("Data inside", data);

            if (!data.trip_type) {
                return res.json(helper.showValidationErrorResponse('TRIP_TYPE_IS_REQUIRED'));
            }
            
            data.description = null;

            if (data.trip_type === "ridenow") {
                module.exports.addUserTripInstant(data, req.headers, (response) => {
                    res.json(response);
                });
            } else if (data.trip_type === "ridelater") {
                module.exports.addUserScheduleTrip(data, req.headers, (response) => {
                    res.json(response);
                });
            } else {
                return res.json(helper.showValidationErrorResponse('INVALID_TRIP_TYPE'));
            }

        } catch (error) {
            return res.json(helper.showInternalServerErrorResponse());
        }
    },

    addUserTripInstant: async (data, headerData, responseCallback) => {
        console.log("Data", data);
        try {
            var paramsList = [
                { name: 'country', type: 'string' },
                { name: 'countryCode', type: 'string' },
                { name: 'state', type: 'string' },
                { name: 'stateCode', type: 'string' },
                { name: 'city', type: 'string' },
                { name: 'cityCode', type: 'string' },
                { name: 'pricingType', type: 'string' },
                { name: 'isSurgeTime', type: 'string' },
                { name: 'surgeMultiplier', type: 'number' },
                { name: 'unit', type: 'string' },
                { name: 'estimatedCost', type: 'number' },
                { name: 'carTypeRequired', type: 'string' },
                { name: 'distance', type: 'number' },
                { name: 'estimatedTime', type: 'number' },
                { name: 'startLocation', type: 'object' },
                { name: 'endLocation', type: 'object' },
                { name: 'paymentMethod', type: 'string' },
                { name: 'paymentSourceRefNo', type: 'string' }
            ];

            helper.checkRequestParams(data, paramsList, async (response) => {
                if (response.status) {
                    var verifydata = await Auth.validateDispatcher(headerData);
                    if (verifydata == null) {
                        responseCallback(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
                    }
                    if (!data.startLocation) {
                        responseCallback(helper.showValidationErrorResponse('SOURCE_LOCATION_IS_REQUIRED'));
                    }
                    if (!data.endLocation) {
                        responseCallback(helper.showValidationErrorResponse('DESTINATION_LOCATION_IS_REQUIRED'));
                    }
                    if (!data.distance) {
                        responseCallback(helper.showValidationErrorResponse('DISTANCE_IS_REQUIRED'));
                    }
                    if (!data.estimatedTime) {
                        responseCallback(helper.showValidationErrorResponse('ESTIMATED_TIME_IS_REQUIRED'));
                    }
                    if (!data.paymentMethod) {
                        responseCallback(helper.showValidationErrorResponse('PAYMENT_METHOD_IS_REQUIRED'));
                    }
                    if (!data.estimatedCost) {
                        responseCallback(helper.showValidationErrorResponse('ESTIMATED_COST_IS_REQUIRED'));
                    }
                    if (!data.scheduleTimezone) {
                        responseCallback(helper.showValidationErrorResponse('TIMEZONE_IS_REQUIRED'));
                    }
                    var a = helper.getCurrentDateAndTimeInCityTimezoneFromUTC(data.scheduleTimezone);
                    data.readableDate = a.format('LLLL');
                    data.scheduleTime = a.format('LT'); 
                    data.scheduleDate = a.format('L'); 

                    if (!data.carTypeRequired) {
                        responseCallback(helper.showValidationErrorResponse('CARTYPE_IS_REQUIRED'));
                    }

                    if (!data.paymentSourceRefNo) {
                        responseCallback(helper.showValidationErrorResponse('PAYMENT_IS_REQUIRED'));
                    }

                    if (data.paymentMethod === "stripe" || data.paymentMethod === "Stripe") {
                        var getCard = await POs.getPObyId(data.paymentSourceRefNo);
                        if (getCard == null) {
                            responseCallback(helper.showValidationErrorResponse('INVALID_PAYMENT_OPTIONS'));
                        }
                    }
                    data.tripByDispatcher = "yes";
                    data.startLocationAddr = data.startLocationAddr;
                    data.endLocationAddr = data.endLocationAddr;
                    var endLocation = { type: "Point", coordinates: [data.endLocation.lng, data.endLocation.lat] }
                    var startLocation = { type: "Point", coordinates: [data.startLocation.lng, data.startLocation.lat] }
                    data.endLocation = endLocation;
                    data.startLocation = startLocation;
                    data.dispatcherId = verifydata._id;
                    data.dispatcherIdRef = verifydata._id;
                    data.customerNumber = data.customerDetails.mobileNumber;
                    data.countryCode = data.customerDetails.countryCode;
                    data.customerName = data.customerDetails.firstName + ' ' + data.customerDetails.lastName;
                    data.customerAvgRating = verifydata.dispatcherAvgRating;
                    
                    var cdata = {};
                    cdata.userType = "nonregistered";
                    cdata.name = data.customerDetails.firstName + ' ' + data.customerDetails.lastName;
                    data.customerName = cdata.name;
                    if (data.customerDetails.mobileNumber != undefined && data.customerDetails.mobileNumber != '') {
                        cdata.mobileNumber = data.customerDetails.mobileNumber;
                        data.customerNumber = cdata.mobileNumber;
                    }
                    if (data.customerDetails.email != undefined && data.customerDetails.email != '') {
                        cdata.email = data.customerDetails.email;
                    }
                    if (data.customerDetails.floor != undefined && data.customerDetails.floor != '') {
                        cdata.floor = data.customerDetails.floor;
                    }
                    if (data.customerDetails.roomNumber != undefined && data.customerDetails.roomNumber != '') {
                        cdata.roomNumber = data.customerDetails.roomNumber;
                    }
                    var addDispatcherCustomer = await User.addDispatcherCustomer(cdata);
                    data.customerId = addDispatcherCustomer._id;
                    data.customerRefId = addDispatcherCustomer._id;

                    
                    if (data.pricingType === "global") {
                        var getCartype = await CarTypes.getCarsTypesByIdAsync(data.carTypeRequired);
                        data.carTypeRequired = getCartype;
                        data.carTypeId = getCartype._id.toString();

                    } else if (data.pricingType === "city") {
                        var getCartype = await CityType.getCityTypeByIdAsync(data.carTypeRequired);
                        getCartype.carType = getCartype.carTypeDetails.carType;
                        getCartype.carImage = getCartype.carTypeDetails.carImage;
                        data.carTypeRequired = getCartype;
                        data.carTypeId = getCartype.carTypeId.toString();
                    }

                    if (data.promoCode != undefined && data.promoCode != '' && data.promoCode != "none") {
                        data.promoCode = data.promoCode;
                    } else {
                        data.promoCode = "none";
                    }

                    var nearByData = {
                        startPoint: data.startLocation,
                        radius: Number(basicsetting.App_Settings.Default_Search_Radius),
                        query: { 
                            driverStatus: constant.DRIVER_FINDING_TRIPS.toString(), 
                            selectedCarTypeId: data.carTypeId.toString(), 
                            status: "approved", 
                            isRequestSend: "no" 
                        }
                    }
                    var results = await Driver.getNearByDrivers(nearByData);
                    var nearByTempDrivers = [];
                    if (results.length > 0) {
                        results.forEach(element => {
                            nearByTempDrivers.push(element._id);
                        });
                        data.nearByTempDrivers = nearByTempDrivers;
                        data.isDriverFound = "yes";
                    } else {
                        data.nearByTempDrivers = [];
                        data.isDriverFound = "no";
                    }

                    tripModel.addTripInstantDispatcher(data, async (err, datad) => {
                        if (err) {
                            responseCallback(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                        }
                        else {
                            responseCallback(helper.showSuccessResponse('RESPONSE_SUCCESS', { isDriverFound: datad.isDriverFound, tripId: datad._id, trip_type: datad.trip_type }));
                            var Cdata = {
                                customerId: datad.customerId,
                                ref: datad._id
                            }
                            User.AddRefToTrip(Cdata);
                            if (datad.isDriverFound === "yes") {
                                module.exports.sendRequestToNearByDrivers(datad.nearByTempDrivers, datad.customerName, datad._id);
                            }
                        }  
                    });
                } else {
                    responseCallback(helper.showParamsErrorResponse(response.message));
                }
            });
        }
        catch (err) {
            console.log("Error", err);
            responseCallback(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    },

    addUserScheduleTrip: async (data, headerData, responseCallback) => {
       
        console.log("Data in schedule", data);

        try {
            var paramsList = [
                { name: 'country', type: 'string' },
                { name: 'countryCode', type: 'string' },
                { name: 'state', type: 'string' },
                { name: 'stateCode', type: 'string' },
                { name: 'city', type: 'string' },
                { name: 'cityCode', type: 'string' },
                { name: 'pricingType', type: 'string' },
                { name: 'isSurgeTime', type: 'string' },
                { name: 'surgeMultiplier', type: 'number' },
                { name: 'unit', type: 'string' },
                { name: 'estimatedCost', type: 'number' },
                { name: 'carTypeRequired', type: 'string' },
                { name: 'distance', type: 'number' },
                { name: 'estimatedTime', type: 'number' },
                { name: 'startLocation', type: 'object' },
                { name: 'endLocation', type: 'object' },
                { name: 'paymentMethod', type: 'string' },
                { name: 'paymentSourceRefNo', type: 'string' },
                { name: 'scheduleTimezone', type: 'string' },
                { name: 'scheduleDate', type: 'string' },
                { name: 'scheduleTime', type: 'string' }
            ];

            helper.checkRequestParams(data, paramsList, async (response) => {
                if (response.status) {

                    var verifydata = await Auth.validateDispatcher(headerData);

                    if (verifydata == null) {
                        responseCallback(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
                    }
                    if (!data.startLocation) {
                        responseCallback(helper.showValidationErrorResponse('SOURCE_LOCATION_IS_REQUIRED'));
                    }
                    if (!data.endLocation) {
                        responseCallback(helper.showValidationErrorResponse('DESTINATION_LOCATION_IS_REQUIRED'));
                    }
                    if (!data.distance) {
                        responseCallback(helper.showValidationErrorResponse('DISTANCE_IS_REQUIRED'));
                    }
                    if (!data.estimatedTime) {
                        responseCallback(helper.showValidationErrorResponse('ESTIMATED_TIME_IS_REQUIRED'));
                    }
                    if (!data.paymentMethod) {
                        responseCallback(helper.showValidationErrorResponse('PAYMENT_METHOD_IS_REQUIRED'));
                    }
                    if (!data.estimatedCost) {
                        responseCallback(helper.showValidationErrorResponse('ESTIMATED_COST_IS_REQUIRED'));
                    }
                    if (!data.scheduleTimezone) {
                        responseCallback(helper.showValidationErrorResponse('TIMEZONE_IS_REQUIRED'));
                    }
                    if (!data.carTypeRequired) {
                        responseCallback(helper.showValidationErrorResponse('CARTYPE_IS_REQUIRED'));
                    }
                    if (!data.paymentSourceRefNo) {
                        responseCallback(helper.showValidationErrorResponse('PAYMENT_IS_REQUIRED'));
                    }

                    if (data.paymentMethod === "stripe") {
                        var getCard = await POs.getPObyId(data.paymentSourceRefNo);
                        if (getCard == null) {
                            responseCallback(helper.showValidationErrorResponse('INVALID_PAYMENT_OPTIONS'));
                        }
                    }

                    if (!data.scheduleDate) {
                        responseCallback(helper.showValidationErrorResponse('SCHEDULE_DATE_IS_REQUIRED'));
                    }

                    if (!data.scheduleTime) {
                        responseCallback(helper.showValidationErrorResponse('SCHEDULE_TIME_IS_REQUIRED'));
                    }

                    if (!helper.isValidDate(data.scheduleDate, "DD-MM-YYYY")) {
                        responseCallback(helper.showValidationErrorResponse('CORRECT_DATE_FORMAT'));
                    }
                    data.tripByDispatcher = "yes";
                    data.startLocationAddr = data.startLocationAddr;
                    data.endLocationAddr = data.endLocationAddr;

                    var endLocation = { type: "Point", coordinates: [data.endLocation.lng, data.endLocation.lat] }
                    var startLocation = { type: "Point", coordinates: [data.startLocation.lng, data.startLocation.lat] }
                    data.endLocation = endLocation;
                    data.startLocation = startLocation;
                    data.dispatcherId = verifydata._id;
                    data.dispatcherIdRef = verifydata._id;
                    data.customerNumber = data.customerDetails.mobileNumber;
                    data.countryCode = data.customerDetails.countryCode;
                    data.customerName = data.customerDetails.firstName + ' ' + data.customerDetails.lastName;
                    data.customerAvgRating = verifydata.dispatcherAvgRating;
                    
                    var cdata = {};
                    cdata.userType = "nonregistered";
                    cdata.name = data.customerDetails.firstName + ' ' + data.customerDetails.lastName;
                    data.customerName = cdata.name;
                    if (data.customerDetails.mobileNumber != undefined && data.customerDetails.mobileNumber != '') {
                        cdata.mobileNumber = data.customerDetails.mobileNumber;
                        data.customerNumber = cdata.mobileNumber;
                    }
                    if (data.customerDetails.email != undefined && data.customerDetails.email != '') {
                        cdata.email = data.customerDetails.email;
                    }
                    if (data.customerDetails.floor != undefined && data.customerDetails.floor != '') {
                        cdata.floor = data.customerDetails.floor;
                    }
                    if (data.customerDetails.roomNumber != undefined && data.customerDetails.roomNumber != '') {
                        cdata.roomNumber = data.customerDetails.roomNumber;
                    }
                    var addDispatcherCustomer = await User.addDispatcherCustomer(cdata);
                    data.customerId = addDispatcherCustomer._id;
                    data.customerRefId = addDispatcherCustomer._id;

                    if (data.pricingType === "global") {
                        var getCartype = await CarTypes.getCarsTypesByIdAsync(data.carTypeRequired);
                        getCartype.set("carTypeId",getCartype._id.toString(), {strict:false});
                        data.carTypeRequired = getCartype;
                    } else if (data.pricingType === "city") {
                        var getCartype = await CityType.getCityTypeByIdAsync(data.carTypeRequired);
                        getCartype.carType = getCartype.carTypeDetails.carType;
                        getCartype.carImage = getCartype.carTypeDetails.carImage;
                        data.carTypeRequired = getCartype;
                    }

                    var split = data.scheduleDate.split('-');
                    var split2 = data.scheduleTime.split(':');
                    var ds = split[2] + "-" + split[1] + "-" + split[0] + " " + split2[0] + ":" + split2[1];

                    var a = helper.getDateAndTimeInCityTimezone(ds, data.scheduleTimezone);
                    data.readableDate = a.format('LLLL');
                    data.scheduleTime = a.format('LT'); 
                    data.scheduleDate = a.format('L'); 

                    var b = new Date(a.utc().format());
                    var mdate = helper.getCurrentDateAndTimeInCityTimezoneFromUTC(data.scheduleTimezone);

                    var c = new Date(mdate.utc().format());
                    var resultInMinutes = helper.getTimeDifferenceInMinute(b, c);

                    data.scheduleCompare = b;
                    data.scheduledAt = b;
                    var thdate = b.setMinutes(b.getMinutes() - 15);
                    var cd = new Date(thdate);

                    if (data.promoCode != undefined && data.promoCode != '' && data.promoCode != "none") {
                        data.promoCode = data.promoCode;
                    } else {
                        data.promoCode = "none";
                    }

                    if (resultInMinutes < 31) {
                        responseCallback(helper.showValidationErrorResponse('BOOKING_NOT_ALLOWED'));
                    }else{
                        tripModel.addScheduleDispatcherTrip(data, async (err, datad) => {
                            if (err) {
                                responseCallback(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                            }
                            else {
                                responseCallback(helper.showSuccessResponse('RIDE_SCHEDULED_SUCCESS', datad));
                                var Cdata = {
                                    customerId: datad.customerId,
                                    ref: datad._id
                                }
                                User.AddRefToTrip(Cdata);
                                agenda.schedule(cd, 
                                    'archive ride', 
                                    { rideId: datad._id }, 
                                ).then(() => {
                                   
                                 });
    
                                User.findCSocketCallback(datad.customerId, (err, cresponse) => {
                                    if (err || cresponse == null) {
                                    } else {
                                        if (cresponse.firebaseToken != undefined && cresponse.firebaseToken != '' && cresponse.firebaseToken != null && cresponse.firebaseToken != "none") {
                                            var title = __('TRIP_SCHEDULE_SUCCESS');
                                            var body = 'Your Trip Has Been Scheduled At: ' + datad.readableDate
                                            var registrationToken = cresponse.firebaseToken;
                                            helper.sendPushNotificationCustomer(title, body, registrationToken);
                                        }
                                    }
                                });
    
                            }
                        });    
                    }
                    
                } else {
                    responseCallback(helper.showParamsErrorResponse(response.message));
                }
            });
        }
        catch (err) {
            console.log("Error", err);
            responseCallback(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    },

    sendRequestToNearByDrivers: async (nearByTempDrivers, customerName, tripId) => {
        await Driver.updateMany({ _id: { $in: nearByTempDrivers } }, { "$set": { isRequestSend: "yes", isTripAccepted: "no", "currentTripId": tripId, tripRequestTime: new Date() } });
        Driver.getDriversByIds(nearByTempDrivers, (err, driversList) => {
            driversList.forEach(dresponse => {
                if (dresponse.firebaseToken != undefined && dresponse.firebaseToken != '' && dresponse.firebaseToken != null && dresponse.firebaseToken != "none") {
                    var title = __('TRIP_REQUEST_SUCCESS');
                    var body = 'Trip Request From :' + customerName;
                    var registrationToken = dresponse.firebaseToken;
                    helper.sendPushNotificationDriver(title, body, registrationToken);
                    var sdata = {
                        receivedRequest: 1,
                        driverId: dresponse._id,
                        tripId: tripId
                    };
                    stats.addRequestRec(sdata);
                }

                if (dresponse.socketStatus === "no") {
                    var tripRequestSocketData = {
                        success: true,
                        tripId: tripId,
                        tripStatus: constant.DRIVER_FINDING_TRIPS,
                        driverStatus: dresponse.driverStatus,
                        driverLocation: dresponse.driverLocation,
                        angle: 0,
                        isNewRequest: "yes",
                        isTripAccepted: "no"
                    }
                    helper.emitDriverSocket(dresponse.socketId, tripRequestSocketData);
                }
            });
        });

        setTimeout(async function () {
            await Driver.updateMany({ _id: { $in: nearByTempDrivers } }, { "$set": { isRequestSend: "no" } });
        }, 32000);
    },

    getDispatcherRideNowRequest: async (req, res) => {
        try {
            var verifydata = await Auth.validateDispatcher(req.headers);
            if (verifydata == null) {
                return res.status(401).json({ message: "Not Authorized!", data: {}, error: {} })
            }
            console.log("Data", req.body);
            const {orderBy, order, page, limit, fieldName, fieldValue, filter, status, startDate,endDate} =req.body
            var pageSize       = limit   ||  10;
            var sortByField    = orderBy || "tripCreatedAt";
            var sortOrder      = order   || -1;
            var paged          = page    ||  1;
            let obj={};

            if(fieldName && fieldValue) {
                obj[fieldName]={ $regex: fieldValue || '', $options : 'i'};
            } 

            if (filter) {
                obj['$and'] = [];
                obj['$and'].push({
                    '$or': [
                        { customerName: { $regex: filter || '', $options: 'i' } },
                        { driverName: { $regex: filter || '', $options: 'i' } }
                    ]
                })
            }
    
            if(status){
                if(!filter){ console.log("entered filter");
                  obj['$and'] = [];
                  obj['$and'].push({ tripStatus: status} );
                } else {
                  obj['$and'].push({ tripStatus: status});
                }
            }else {
                obj['$and'] = [];
                obj['$and'].push({ tripStatus: {$nin : ["searching","Completed","Cancelled"]}} );
             }
          
            if(startDate){
                obj['$and'].push({"tripCreatedAt":{"$gte":ISODate(startDate),"$lte": endDate? ISODate(endDate): new Date()}});
            }
            console.log("Filter Object", obj);
            let count = await trips.aggregate([{$match:obj},{$match:{dispatcherIdRef:ObjectId(verifydata._id)}},{$match:{trip_type: "ridenow"}},{ $group: { _id: null, count: { $sum: 1 } } }]);
            trips.aggregate([
                {$match:{dispatcherIdRef:ObjectId(verifydata._id)}},
                {$match:obj},
                {$match:{trip_type: "ridenow"}},
                {$sort :{[sortByField]: parseInt(sortOrder)}},{$skip: (paged-1)*pageSize},
                {$limit: parseInt(pageSize)},
             ],function(err,resdata){
               if(err){  
                return res.status(400).json({ "message": "No request available!", data: {}, "error": err });
               }
               else{
                 return res.status(200).json({"status":"success", "message":"Request available!", "data":resdata, "totalcount":count[0]?count[0].count:0});   
               }
             });
        } catch (error) {
            console.log(error);
            res.status(500).json({ "message": "Internal Server Error!", data: {}, "error": error });
        }
    },

    getDispatcherRideLaterRequest: async (req, res) => {
        try {
            var verifydata = await Auth.validateDispatcher(req.headers);
            console.log("Data", req.body);
            if (verifydata == null) {
                return res.status(401).json({ message: "Not Authorized!", data: {}, error: {} })
            }

            const {orderBy, order, page, limit, fieldName, fieldValue, filter, status, startDate,endDate} =req.body
            var pageSize       = limit  || 10;
            var sortByField    = orderBy ||"tripCreatedAt";
            var sortOrder      = order   || -1;
            var paged          = page || 1;
            let obj={};

            if(fieldName && fieldValue) {
                obj[fieldName]={ $regex: fieldValue || '', $options : 'i'};
            } 

            if (filter) {
                obj['$and'] = [];
                obj['$and'].push({
                    '$or': [{ customerName: { $regex: filter || '', $options: 'i' } },
                            { driverName: { $regex: filter || '', $options: 'i' } }
                            ]
                })
            }
    
            if(status){
                if(!filter){ console.log("entered filter");
                  obj['$and'] = [];
                  obj['$and'].push({ tripStatus: status} );
                } else {
                  obj['$and'].push({ tripStatus: status});
                }
            }else {
                obj['$and'] = [];
                obj['$and'].push({ tripStatus: {$nin : ["searching","Completed","Cancelled"]}} );
             }
          
            if(startDate){
              obj['$and'].push({"tripCreatedAt":{"$gte":ISODate(startDate),"$lte": endDate? ISODate(endDate): new Date()}});
            }
            console.log("Filter Object", obj);
            let count = await trips.aggregate([{$match:obj},{$match:{dispatcherIdRef:ObjectId(verifydata._id)}},{$match:{trip_type: "ridelater"}},{ $group: { _id: null, count: { $sum: 1 } } }]);
            
            trips.aggregate([
                {$match:{dispatcherIdRef:ObjectId(verifydata._id)}},
                {$match:obj},
                {$match:{trip_type: "ridelater"}},
                {$sort :{[sortByField]: parseInt(sortOrder)}},{$skip: (paged-1)*pageSize},
                {$limit: parseInt(pageSize)},
             ],function(err,resdata){
                 console.log("Data", resdata);
               if(err){  
                return res.status(400).json({ "message": "No request available!", data: {}, "error": err });
               }
               else{
                 return res.status(200).json({"status":"success", "message":"Request available!", "data":resdata, "totalcount":count[0]?count[0].count:0});   
               }
             });
        } catch (error) {
            console.log(error);
            res.status(500).json({ "message": "Internal Server Error!", data: {}, "error": error });
        }
    },

    getDispatcherTripDeatails: async (req, res) => {
        try {
            var verifydata = await Auth.validateDispatcher(req.headers);
            if (verifydata == null) {
                return res.status(401).json({ message: "Not Authorized!", data: {}, error: {} })
            }

            if (!req.params._id) {
                return res.status(400).json({ "status": "failure", "message": "Trip Id is required!", "data": {}, "error": {} });
            }

            trips.getTripsByIdCallback(req.params._id, (err, resdata) => {
                if (err || resdata == null) {
                    return res.status(400).json({ "status": "failure", "message": "Wrong trip id!", data: {}, "error": err });
                }
                else {
                    res.json({ "status": "success", "message": "Trip Details!", data: resdata, "error": {} });
                }
            });

        } catch (error) {
            console.log(error);
            res.status(500).json({ "status": "failure", "message": "Internal Server Error!", data: {}, "error": error });
        }
    },

    getTripsByStatus: async (req,res) =>{
      try{
        var verifydata = await Auth.validateDispatcher(req.headers);
        console.log("Data", verifydata);
        if (verifydata == null) {
            return res.status(401).json({ message: "Not Authorized!", data: {}, error: {} })
        }

        const {orderBy, order, page, limit, fieldName, fieldValue, filter, status, startDate,endDate} =req.body
        var pageSize       = limit  || 10;
        var sortByField    = orderBy ||"tripCreatedAt";
        var sortOrder      = order   || -1;
        var paged          = page || 1;
        let obj={};

        if(fieldName && fieldValue) {
            obj[fieldName]={ $regex: fieldValue || '', $options : 'i'};
        } 

        if (filter) {
            obj['$and'] = [];
            obj['$and'].push({
                '$or': [{ customerName: { $regex: filter || '', $options: 'i' } },
                        { driverName: { $regex: filter || '', $options: 'i' } }
                        ]
            })
        }

        if(status){
            if(!filter){ console.log("entered filter");
              obj['$and'] = [];
              obj['$and'].push({ tripStatus: status} );
            } else {
              obj['$and'].push({ tripStatus: status});
            }
        }else {
            obj['$and'] = [];
            obj['$and'].push({ tripStatus: {$in :['Completed','Cancelled']}} );
         }
      
        if(startDate){
          if(!status || (status ==null && filter == null) ){      
           obj['$and'] = [];  
          }
          obj['$and'].push({"tripCreatedAt":{"$gte":new Date(startDate),"$lte": endDate? new Date(endDate): new Date()}});
        }

        let count = await trips.aggregate([{$match:{dispatcherIdRef:ObjectId(verifydata._id)}},{$match:obj},{ $group: { _id: null, count: { $sum: 1 } } }]);
        trips.aggregate([
            {$match:{dispatcherIdRef:ObjectId(verifydata._id)}},
            {$match:obj},
            {$sort :{[sortByField]: parseInt(sortOrder)}},{$skip: (paged-1)*pageSize},
            {$limit: parseInt(pageSize)},
         ],function(err,resdata){
             console.log("Data", resdata);
           if(err){  
            return res.status(400).json({ "message": "No request available!", data: {}, "error": err });
           }
           else{
             return res.status(200).json({"status":"success", "message":"Trip History", "data":resdata, "totalcount":count[0]?count[0].count:0});   
           }
         });
        }catch(error){
            console.log(error);
            res.status(500).json({ "message": "Internal Server Error!", data: {}, "error": error });
        }
     },

     cancelDispatcherTripRequest : async(req,res) => {
        try {
            var verifydata = await Auth.validateDispatcher(req.headers);
            if (verifydata == null) {
                return res.status(401).json({ message: "Not Authorized!", data: {}, error: {} })
            }
            var data = req.body;
            if (!data.tripId) {
                return res.status(400).json({ "status": "failure", "message": "Trip Id is required!", "data": {}, "error": {} });
            } 
            trips.customerCancel(data.tripId, async (err, datad) => {
                console.log('cancel data2', datad);
                if (err || datad == null) {
                    console.log("error in cancel customer:", err);
                    res.status(400).json({ "message": "Not able to Cancel", data: {}, "error": err });
                } else {
                    res.status(200).json({ "message": "Cancelled Trip!", data: datad, "error": {} });
                }
            });
        } catch (error) {
            console.log(error);
            res.status(500).json({ "status": "failure", "message": "Internal Server Error!", data: {}, "error": error });
        }
    },

    getTripById: async(req,res) => {
         try{
            var verifydata = await Auth.validateDispatcher(req.headers);
            if (verifydata == null) {
                return res.status(401).json({ message: "Not Authorized!", data: {}, error: {} })
            }
            var tripId = req.params.id;
            if (!tripId) {
                return res.status(400).json({ "status": "failure", "message": "Trip Id is required!", "data": {}, "error": {} });
            } 
            trips.getDispatcherTripById(tripId, async (err, datad) => {
                if (err || datad == null) {
                    res.status(400).json({ "message": "No data found", data: {}, "error": err });
                } else {
                    res.status(200).json({ "message": "Trip Detail", data: datad, "error": {} });
                }
            });
         }catch(error){
            console.log(error);
            res.status(500).json({ "status": "failure", "message": "Internal Server Error!", data: {}, "error": error });
         }
    }  

    
}