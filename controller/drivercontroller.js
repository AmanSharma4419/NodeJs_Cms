const Driver = require('../models/drivertable.js');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const upload = require('../lib/awsimageupload.js');
const deleteaws = require('../lib/awsdelete.js');
const profileImageUpload = upload.any();
const SocketD = require('../models/socketDriver');
const MailTemplate = require('../models/mailTemplate.js');
const mailgunSendEmail = require('../lib/mailgunSendEmail.js');
const trips = require('../models/triptable.js');
const otpVerification = require('../lib/otpverification.js');
const Auth = require('../middleware/auth');
const CarTypes = require('../models/ServicesCars');
const Cars = require('../models/cartable');
var ChatHistory = require('../models/chatHistory');
var Chat = require('../models/chatTable');


module.exports = {

    getDriversList: async (req, res) => {
        try {
            Driver.getDriversList((err, resdata) => {
                if (err) {
                    return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                } else {
                    if (resdata.length === 0) {
                        res.json(helper.showSuccessResponse('NO_DATA_FOUND', []));
                    } else {
                        res.json(helper.showSuccessResponse('DATA_SUCCESS', resdata));
                    }
                }
            });
        }
        catch (err) {
            res.json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    },

    driverRegister: async (req, res) => {
        try {

            var data = req.body

            // if (!data.languageId) {
            //     return res.json(helper.showValidationErrorResponse('LANGUAGE_IS_REQUIRED'));
            // }

            // var getLanguage = await Language.getLanguageByIdAsync(data.languageId);

            // if (getLanguage == null) {
            //     return res.json(helper.showValidationErrorResponse('NOT_VALID_ID'));
            // }

            // data.languageDetails = getLanguage;


            if (!data.name) {
                return res.json(helper.showValidationErrorResponse('NAME_IS_REQUIRED'));
            }

            data.email = data.email.trim().toLowerCase();

            if (!data.email) {
                return res.json(helper.showValidationErrorResponse('EMAIL_IS_REQUIRED'));
            }

            if (!validator.isEmail(data.email)) {
                return res.json(helper.showValidationErrorResponse('EMAIL_INVALID'));
            }

            var verify = await Driver.findDriver(data.email);
            if (verify.length != 0) {
                return res.json(helper.showValidationErrorResponse('USER_EMAIL_EXIST'));
            }

            if (!data.mobileNumber) {
                return res.json(helper.showValidationErrorResponse('MOBILE_NUMBER_IS_REQUIRED'));
            }

            if (!data.password) {
                return res.json(helper.showValidationErrorResponse('PASSWORD_IS_REQUIRED'));
            }

            if (!data.address) {
                return res.json(helper.showValidationErrorResponse('ADDRESS_IS_REQUIRED'));
            }

            data.password = require('crypto').createHash('sha256').update(data.password).digest('hex');

            console.log("Driver Register Data", data);

            data.documentsList = [];

            Driver.addDriver(data, async (err, datad) => {
                if (err || datad == null) {
                    res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                } else {

                    res.json(helper.showSuccessResponse('DRIVER_ADDED_SUCCESS', { driverId: datad._id }));

                    var mTemplate = await MailTemplate.findOne({ title: 'DRIVER_REGISTER' });
                    //console.log(mTemplate);
                    if (mTemplate == null || mTemplate == undefined) {
                        var msg = __('DRIVER_WELCOME_MSG', constant.APP_NAME, datad.name);
                        var sub = __('DRIVER_REGISTER_SUB', constant.APP_NAME);
                        var senemail = await mailgunSendEmail.sendEmail(datad.email, sub, msg);
                    } else {
                        var msg = mTemplate.body.replace('XXXXXX', datad.name);
                        var senemail = await mailgunSendEmail.sendEmail(datad.email, mTemplate.emailTitle, msg);
                        // console.log(senemail);
                    }

                }
            });

        }
        catch (err) {
            res.json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    },

    driverStatusUpdate: async (req, res) => {
        try {
            var data = req.body;

            if (!data.email) {
                return res.json(helper.showValidationErrorResponse('EMAIL_IS_REQUIRED'));
            }

            data.email = data.email.trim().toLowerCase();

            if (!validator.isEmail(data.email)) {
                return res.json(helper.showValidationErrorResponse('EMAIL_INVALID'));
            }

            if (!data.status) {
                return res.json(helper.showValidationErrorResponse('STATUS_IS_REQUIRED'));
            }

            Driver.updateDriverStatus(data, async (err, resdata) => {
                if (err) {
                    res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                } else {
                    if(status === "approved"){
                        var mTemplate = await MailTemplate.findOne({ title: 'ADMIN_APPROVE_DRIVER' });
                        if(mTemplate){
                            var msg = mTemplate.body;
                            await mailgunSendEmail.sendEmail(data.email,mTemplate.emailTitle,msg);
                        }else{
                            var msg = 'Hi,<br><br><br> Your Elite account is scuccessfully approved';
                            await mailgunSendEmail.sendEmail(data.email, 'Account Approval', msg);
                        }
                    }
                    res.json(helper.showSuccessResponse('DRIVER_STATUS_UPDATE_SUCCESS', resdata));
                }
            });
        }
        catch (err) {
            console.log(err)
            res.json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    },

    driverStatusUpdateFT: async (req, res) => {
        try {
            var data = req.body;

            data.email = data.email.trim().toLowerCase();

            if (!data.email) {
                return res.json(helper.showValidationErrorResponse('EMAIL_IS_REQUIRED'));
            }

            if (!validator.isEmail(data.email)) {
                return res.json(helper.showValidationErrorResponse('EMAIL_INVALID'));
            }

            if (!data.status) {
                return res.json(helper.showValidationErrorResponse('STATUS_IS_REQUIRED'));
            }

            Driver.updateDriverStatusd(data, (err, data) => {
                if (err || data == null) {
                    res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                } else { res.json(helper.showSuccessResponse('DRIVER_STATUS_UPDATE_SUCCESS', data)); }
            });
        }
        catch (err) {
            res.json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    },

    resendOTPDriver: async (req, res) => {
        try {
            var data = req.body;

            data.email = data.email.trim().toLowerCase();

            if (!data.email) {
                return res.json(helper.showValidationErrorResponse('EMAIL_IS_REQUIRED'));
            }

            if (!validator.isEmail(data.email)) {
                return res.json(helper.showValidationErrorResponse('EMAIL_INVALID'));
            }

            var exptime = new Date();
            exptime.setHours(exptime.getHours() + 1);
            data.OTPexp = exptime;
            data.OTP = otpVerification.generateOTP();
            var mTemplate = await MailTemplate.findOne({ title: 'DRIVER_RESEND_OTP' });
            //console.log(mTemplate);
            if (mTemplate == null || mTemplate == undefined) {
                var msg = __('DRIVER_RESEND_OTP_MSG', data.OTP);
                var sub = __('DRIVER_RESEND_OTP_SUB', constant.APP_NAME);
                var senemail = await mailgunSendEmail.sendEmail(data.email, sub, msg);
            } else {
                var msg = mTemplate.body.replace('XXXXXX', data.OTP);
                var senemail = await mailgunSendEmail.sendEmail(data.email, mTemplate.emailTitle, msg);
                // console.log(senemail);
            }

            var userc = await Driver.findOne({ email: data.email });

            if (userc != null) {
                data.token = jwt.sign({ email: userc.email, userId: userc._id }, 'secret', { expiresIn: "2h" });
                var uOTP = await Driver.updateOTPDriverAsync(data);
            }

            // tempUser.updateTempUserEmail(data, (err, user) => {
            //     if (err) {
            //         return res.json({ "status": "failure", "message": "Server not responding", "data": {}, "error": err });
            //     } else {
            //         return res.json({ "status": "success", "message": "OTP Send!", "data": user });
            //     }
            // });

            res.json(helper.showSuccessResponse('OTP_SUCCESS', data));

        } catch (error) {
            res.json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    },

    driverForgotPassword: async (req, res) => {
        try {
            var data = req.body;
            data.email = data.email.trim().toLowerCase();

            if (!data.email) {
                return res.json(helper.showValidationErrorResponse('EMAIL_IS_REQUIRED'));
            }

            if (!validator.isEmail(data.email)) {
                return res.json(helper.showValidationErrorResponse('EMAIL_INVALID'));
            }

            var verifyemail = await Driver.findDriver(data.email);
            if (verifyemail.length == 0) {
                return res.json(helper.showValidationErrorResponse('EMAIL_NOT_EXISTS'));
            }
            verifyemail = verifyemail[0];
            data.OTP = otpVerification.generateOTP();
            var mTemplate = await MailTemplate.findOne({ title: 'DRIVER_FORGOT_PASSWORD_OTP' });
            // console.log(mTemplate);
            if (mTemplate == null || mTemplate == undefined) {
                var msg = "Your OTP for Forgot Password: " + data.OTP;
                var msg = __("DRIVER_FORGOT_PASSWORD_MSG", data.OTP);
                var sub = __("DRIVER_FORGOT_PASSWORD_SUB", constant.APP_NAME);
                var senemail = await mailgunSendEmail.sendEmail(verifyemail.email, sub, msg);
            } else {
                var msg = mTemplate.body.replace('XXXXXX', data.OTP);
                var senemail = await mailgunSendEmail.sendEmail(verifyemail.email, mTemplate.emailTitle, msg);
                //console.log(senemail); 
            }
            var exptime = new Date();
            exptime.setHours(exptime.getHours() + 1);
            data.OTPexp = exptime;
            Driver.updateOTPDriver(data, function (err, resdata) {
                if (err || resdata == null) {
                    return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                }
                res.json(helper.showSuccessResponse('OTP_SUCCESS', resdata));
            })
        }
        catch (err) {
            res.json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    },

    driverResetPassword: async (req, res) => {
        try {
            var data = req.body;

            if (!data.password) {
                return res.json(helper.showValidationErrorResponse('PASSWORD_IS_REQUIRED'));
            }

            if (!data.cnfpassword) {
                return res.json(helper.showValidationErrorResponse('CNF_PASSWORD_IS_REQUIRED'));
            }

            if (data.password != data.cnfpassword) {
                return res.json(helper.showValidationErrorResponse('PASSWORD_CNFPASSWORD_NOT_MATCH'));
            }

            data.email = data.email.trim().toLowerCase();

            if (!data.email) {
                return res.json(helper.showValidationErrorResponse('EMAIL_IS_REQUIRED'));
            }

            if (!validator.isEmail(data.email)) {
                return res.json(helper.showValidationErrorResponse('EMAIL_INVALID'));
            }

            var verifyemail = await Driver.findDriver(data.email);
            if (verifyemail.length == 0) {
                return res.json(helper.showValidationErrorResponse('EMAIL_NOT_EXISTS'));
            }
            var passmain = data.password;
            verifyemail = verifyemail[0];
            var cDate = new Date();
            var exptime = new Date(verifyemail.OTPexp);
            if (cDate.getTime() >= exptime.getTime()) {
                return res.json(helper.showValidationErrorResponse('OTP_EXPIRED'));
            }
            data.password = require('crypto').createHash('sha256').update(data.password).digest('hex');
            var token = jwt.sign(
                {
                    email: verifyemail.email,
                    userId: verifyemail._id
                },
                'secret',
                {
                    expiresIn: "2h"
                }
            );
            data.token = token;
            Driver.updatePasswordDriver(data, async function (err, resdata) {
                if (err || resdata == null) {
                    return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                }

                var mTemplate = await MailTemplate.findOne({ title: 'DRIVER_RESET_PASSWORD' });
                //console.log(mTemplate);
                if (mTemplate != null && !mTemplate) {
                    var msg = mTemplate.body.replace('XXXXXX', passmain);
                    var senemail = mailgunSendEmail.sendEmail(data.email, mTemplate.emailTitle, msg);
                    // console.log(senemail);
                } else {
                    var msg = __('PASSWORD_RESET_MSG', passmain);
                    var sub = __('%s Reset Password', constant.APP_NAME);
                    var senemail = await mailgunSendEmail.sendEmail(data.email, sub, msg);
                }

                res.json(helper.showSuccessResponse('PASSWORD_RESET_SUCCESS', resdata));
            })
        }
        catch (err) {
            res.json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    },

    driverLogin: async (req, res) => {
        try {
            var data = req.body;

            data.email = data.email.trim().toLowerCase();

            if (!data.email) {
                return res.json(helper.showValidationErrorResponse('EMAIL_IS_REQUIRED'));
            }

            if (!validator.isEmail(data.email)) {
                return res.json(helper.showValidationErrorResponse('EMAIL_INVALID'));
            }

            if (!data.password) {
                return res.json(helper.showValidationErrorResponse('PASSWORD_IS_REQUIRED'));
            }

            var verifydriver = await Driver.findDriver(data.email);
            verifydriver = verifydriver[0];
            if(!verifydriver) {
                return res.json(helper.showValidationErrorResponse('EMAIL_NOT_EXISTS'));
            }

            if (verifydriver && verifydriver.isBlocked === true) {
                return res.json(helper.showValidationErrorResponse('USER_BLOCKED'));
            }

            if (verifydriver && verifydriver.status != "approved") {
                return res.json(helper.showValidationErrorResponse('USER_NOT_APPROVED'));
            }

            //console.log("Driver Data", data);
            if (verifydriver && verifydriver.length == 0) {
                return res.json(helper.showValidationErrorResponse('EMAIL_NOT_EXISTS'));
            }
            
            data.password = require('crypto').createHash('sha256').update(data.password).digest('hex');
            if (data.password != verifydriver.password) {
                return res.json(helper.showValidationErrorResponse('WRONG_PASSWORD'));
            }
            if (!data.firebaseToken) {
                return res.json(helper.showValidationErrorResponse('FIREBASE_TOKEN_IS_REQUIRED'));
            }

            var token = jwt.sign(
                {
                    email: verifydriver.email,
                    userId: verifydriver._id
                },
                'secret',
                {
                    expiresIn: "2h"
                }
            );
           
            data.token = token;

            Driver.updateTokenDriver(data, function (err, tokendata) {
                if (err || tokendata == null) {
                    return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                }
                else {
                    res.json(helper.showSuccessResponse('LOGIN_SUCCESS', tokendata));
                }
            })
        }
        catch (err) {
            console.log("Error", err);
            res.json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    },

    driverUploadProfileImage: async (req, res) => {
        try {
            // upload images
            profileImageUpload(req, res, async function (err, some) {
                var file = req.files;
                var data = req.body
                var verifydata = await Auth.validateDriver(req)
                if (verifydata == null) {
                    return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
                }
                data.driverId = verifydata._id;
                // checking if there are any files or null
                if (!file) {
                    return res.json(helper.showValidationErrorResponse('IMAGE_IS_REQUIRED'));
                }
                // if any error on AWS 
                if (err) {
                    return res.json(helper.showAWSImageUploadErrorResponse('IMAGE_UPLOAD_ERROR', err.message));
                }
                try {
                    data.profileImage = req.files[0].location
                }
                catch (err) {
                    return res.json(helper.showAWSImageUploadErrorResponse('IMAGE_UPLOAD_ERROR', err));
                }
                if (verifydata.profileImage != null || verifydata.profileImage != undefined) {
                    var keyimage = verifydata.profileImage;
                    deleteaws(keyimage);
                }
                try {
                    var resdata = await Driver.updateProfileImageDriver(data);

                    res.status(200).json(helper.showSuccessResponse('PROFILE_IMAGE_CHANGED_SUCCESS', resdata));

                }
                catch (err) {
                    return res.json(helper.showAWSImageUploadErrorResponse('IMAGE_UPLOAD_ERROR', err));
                }
            })
        }
        catch (err) {
            res.json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }

    },

    driverUpdateProfile: async (req, res) => {
        try {
            var data = req.body;
            var verifydata = await Auth.validateDriver(req)
            if (verifydata == null) {
                return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
            }
            data._id = verifydata._id;
            var updateProfile = await Driver.updateDriverProfile(data);

            res.status(200).json(helper.showSuccessResponse('PROFILE_UPDATE_SUCCESS', updateProfile));
        }
        catch{
            res.json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    },

    driverChangePassword: async (req, res) => {
        try {
            var data = req.body;
            // console.log('change password data0', data);

            var verifydata = await Auth.validateDriver(req);
            //console.log("verifydata", verifydata);
            if (verifydata === null) {
                return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
            }

            if (!data.password) {
                return res.json(helper.showValidationErrorResponse('PASSWORD_IS_REQUIRED'));
            }

            if (!data.cnfpassword) {
                return res.json(helper.showValidationErrorResponse('CNF_PASSWORD_IS_REQUIRED'));
            }

            if (data.password != data.cnfpassword) {
                return res.json(helper.showValidationErrorResponse('PASSWORD_CNFPASSWORD_NOT_MATCH'));
            }
            var passmain = data.password;

            //console.log('change password data1', data);

            if (!data.currentPassword) {
                return res.json(helper.showValidationErrorResponse('CURRENT_PASSWORD_IS_REQUIRED'));
            }

            var currentPassword = require('crypto').createHash('sha256').update(data.currentPassword).digest('hex');

            if (currentPassword != verifydata.password) {
                return res.json(helper.showValidationErrorResponse('PASSWORD_MISSMATCH'));
            }

            data.email = verifydata.email;
            data.password = require('crypto').createHash('sha256').update(data.password).digest('hex');
            data.token = jwt.sign(
                {
                    email: verifydata.email,
                    userId: verifydata._id
                },
                'secret',
                {
                    expiresIn: "2h"
                }
            );

            //console.log('change password data', data);

            Driver.updatePasswordDriver(data, async function (err, resdata) {
                if (err || resdata == null) {
                    return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                }

                var mTemplate = await MailTemplate.findOne({ title: 'DRIVER_CHANGE_PASSWORD' });
                //console.log('mailtemplate', mTemplate);
                if (mTemplate == null || mTemplate == undefined) {
                    var msg = __('PASSWORD_CHANGED_MSG', passmain);
                    var sub = __('PASSWORD_CHANGED_SUBJECT', constant.APP_NAME);
                    var senemail = await mailgunSendEmail.sendEmail(verifydata.email, sub, msg);
                } else {
                    var msg = mTemplate.body.replace('XXXXXX', passmain);
                    var senemail = mailgunSendEmail.sendEmail(verifydata.email, mTemplate.emailTitle, msg);
                    //console.log(senemail); 
                }

                res.status(200).json(helper.showSuccessResponse('PASSWORD_CHANGED_SUCCESS', resdata));

            })
        }
        catch (err) {
            res.json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    },

    driverGoOnlineOffline: async (req, res) => {
        try {
            var data = req.body;
            //console.log('Driver Online/Offline Called', data);
            var verifydata = await Auth.validateDriver(req)
            if (verifydata == null) {
                return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
            }

            if (!data.driverStatus) {
                return res.json(helper.showValidationErrorResponse('STATUS_IS_REQUIRED'));
            }

            data.email = verifydata.email;

            Driver.statusOnlineOffline(data, function (err, resdata) {
                if (err || resdata == null) {
                    return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                }

                res.status(200).json(helper.showSuccessResponse('STATUS_UPDATE_SUCCESS', resdata));
            });
        }
        catch (err) {
            res.json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    },

    driverEndOfDayTrip: async (req,res) => {
       try{
            var data = req.body;
            var verifydata = await Auth.validateDriver(req)
            if (verifydata == null) {
                return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
            }
            if(!data.isEndOfDay){
                return res.json(helper.showValidationErrorResponse('STATUS_IS_REQUIRED'));
            }
            data.email = verifydata.email;
            
            Driver.updateEndOfDayTrip(data,function(err,resdata){
                if(err || resdata == null){
                    return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                }
                return res.status(200).json(helper.showSuccessResponse('STATUS_UPDATE_SUCCESS', resdata));
            })
       }catch(err) {
           res.json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
       }
    },

    driverLogout: async (req, res) => {
        try {
            var data = req;
            var verifydata = await Auth.validateDriver(req);
            if (verifydata == null) {
                return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
            }

            data.email = verifydata.email;

            Driver.logout(data, (err, loggedout) => {
                if (err || loggedout == null) {
                    return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                }
                else {
                    res.json(helper.showSuccessResponse('LOGOUT_SUCCESS', {}));
                }
            });

        }
        catch (err) {
            res.json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    },

    driverAddDoc: async (req, res) => {
        try {
            profileImageUpload(req, res, async function (err, some) {
                var file = req.files;
                var data = req.body;
                //checking for email in DB
                // var verifydata = await Auth.validateDriver(req);
                // if (verifydata == null) {
                //     return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
                // }

                data.driverId = req.headers.driverid;

                //carDetails licenceDetails driverPolice carPolice carInspection

                if (!data.type) {
                    return res.json(helper.showValidationErrorResponse('TYPE_IS_REQUIRED'));
                }

                if (!data.date) {
                    return res.json(helper.showValidationErrorResponse('EXPDATE_IS_REQUIRED'));
                }

                if (!data.number) {
                    return res.json(helper.showValidationErrorResponse('NUMBER_IS_REQUIRED'));
                }

                // checking if there are any files or null
                if (!file) {
                    return res.json(helper.showValidationErrorResponse('IMAGE_IS_REQUIRED'));
                }
                // if any error on AWS 
                if (err) {
                    return res.json(helper.showAWSImageUploadErrorResponse('IMAGE_UPLOAD_ERROR', err.message));
                }
                try {
                    data.image = req.files[0].location
                }
                catch (err) {
                    return res.json(helper.showAWSImageUploadErrorResponse('IMAGE_UPLOAD_ERROR', err));
                }

                //console.log("data", data);

                Driver.addDocument(data, (err, resdata) => {
                    if (err || resdata == null) {
                        //console.log("Driver Update Doc error", err);
                        return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                    }
                    else {
                        res.json(helper.showSuccessResponse('DOCUMENT_UPDATE_SUCCESS', resdata));
                    }
                });

            });

        } catch (err) {
            res.json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    },

    driverUpdateDoc: async (req, res) => {
        try {
            profileImageUpload(req, res, async function (err, some) {
                var file = req.files;
                var data = req.body;

                //console.log(data);
                //checking for email in DB
                var verifydata = await Auth.validateDriver(req);
                if (verifydata == null) {
                    return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
                }

                data.driverId = verifydata._id;

                if (!data.docId) {
                    return res.json(helper.showValidationErrorResponse('ID_IS_REQUIRED'));
                }

                if (!data.type) {
                    return res.json(helper.showValidationErrorResponse('TYPE_IS_REQUIRED'));
                }

                if (!data.date) {
                    return res.json(helper.showValidationErrorResponse('EXPDATE_IS_REQUIRED'));
                }

                if (!data.number) {
                    return res.json(helper.showValidationErrorResponse('NUMBER_IS_REQUIRED'));
                }

                // checking if there are any files or null
                if (file.length == 0) {
                    data.image = data.image;
                } else {
                    data.image = req.files[0].location;
                }

                Driver.updateDocument(data, (err, resdata) => {
                    if (err || resdata == null) {
                        //console.log("Driver Update Doc error", err);
                        return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                    }
                    else {
                        res.json(helper.showSuccessResponse('DOCUMENT_UPDATE_SUCCESS', resdata));
                    }
                });

            });

        } catch (error) {
            res.json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    },

    driverGetProfileData: async (req, res) => {
        try {
            var verifydata = await Auth.validateDriver(req);
            if (verifydata == null) {
                return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
            }

            Driver.getDriverById(verifydata._id, (err, resdata) => {
                if (err) {
                    return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                } else {
                    res.json(helper.showSuccessResponse('DATA_SUCCESS', resdata));
                }
            });

        } catch (error) {
            res.json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    },

    driverAddBankAccount: async (req, res) => {
        try {
            var data = req.body;
            var verifydata = await Auth.validateDriver(req)
            if (verifydata == null) {
                return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
            }

            if (!data.accountNumber) {
                return res.json(helper.showValidationErrorResponse('ACCOUNT_NUMBER_IS_REQUIRED'));
            }

            if (!data.routingNumber) {
                return res.json(helper.showValidationErrorResponse('ROUTING_NUMBER_IS_REQUIRED'));
            }

            if (!data.name) {
                return res.json(helper.showValidationErrorResponse('ACCOUNT_NAME_IS_REQUIRED'));
            }

            if (!data.bankName) {
                return res.json(helper.showValidationErrorResponse('BANK_NAME_IS_REQUIRED'));
            }

            data._id = verifydata._id;

            Driver.updateAccountDetails(data, (err, resdata) => {
                if (err || resdata == null) {
                    return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                } else {
                    res.json(helper.showSuccessResponse('ACCOUNT_UPDATE_SUCCESS', resdata));
                }
            });

        }
        catch (err) {
            res.json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    },

    driverGetEverythingData: async (req, res) => {
        try {
            var verifydata = await Auth.validateDriver(req);
            if (verifydata == null) {
                return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
            }

            let [CarTypesList, driverUpcoming, driverPastTrips, carList] = await Promise.all([
                CarTypes.getTruckListAsync(),
                trips.getDriverUpcomingTripsAsync({ driverId: verifydata._id }),
                trips.getDriverPastTripsASync({ driverId: verifydata._id }),
                Cars.getCarsByDriverListAsync({ driverId: verifydata._id })
            ]);

            var resdata = {
                CarTypesList: CarTypesList,
                driverUpcomingTrips: driverUpcoming,
                driverPastTrips: driverPastTrips,
                profile: verifydata,
                carList: carList
            }

            res.json(helper.showSuccessResponse('DATA_SUCCESS', resdata));

            if (verifydata.driverStatus === "On trip") {
                //console.log("Driver is on trip!");
                var trip = await trips.getDriverTripForResume({ driverId: verifydata._id });

                var sendto = await SocketD.findDSocketById(verifydata._id);
                var io = req.app.get('socketio');

                if (sendto != null && sendto.offline === "no") {
                    //console.log("Customer is waiting for an trip socket hit!");
                    io.to(sendto.socketId).emit('trip_driver_socket', trip[0]);
                }

            } else {

                if (verifydata.driverStatus === "Finding Trips") {

                    var day = new Date();
                    day = day.toLocaleDateString();
                    // var eData = await stats.checkDayStats({ driverId: verifydata._id, day: day });

                    //console.log("eDdat", eData);

                    // if(eData != null){
                    //     var d;
                    //         d = new Date(eData.date);
                    //         d.setSeconds(d.getSeconds() + 25);
                    //         console.log("ddd",d);
                    //     var d2 = new Date();
                    //     if(d2.getTime() <= d.getTime()){

                    //         var trip = await trips.getTripsByIdFindTrip(eData.tripId);

                    //         var sendto = await SocketD.findDSocketById(verifydata._id);
                    //         var io = req.app.get('socketio');

                    //         if (sendto != null && sendto.offline === "no") {
                    //             console.log("driver new request finding trips socket hit");
                    //             io.to(sendto.socketId).emit('trip_driver_socket', trip);
                    //         }
                    //     }
                    // }
                }
            }

        } catch (error) {
            res.json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    },

    getDriverChatHistory:  async(req, res) => {
        try {
            var data = req.body;
            var verifydata = await Auth.validateDriver(req)
            if(verifydata == null){
                return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
            }
            if(!data.customerId){
                return res.json(helper.showValidationErrorResponse('CUSTOMER_ID_REQUIRED'));
            }
            var userChat = await Chat.getUserChat({driverId:verifydata._id,customerId:data.customerId});
            if(userChat == null){
                return res.json(helper.showValidationErrorResponse('NO_MESSAGE_FOUND'));
            }else{
                ChatHistory.getChatHistory({chatId:userChat._id},(err,resdata) => {
                    if(err){
                        return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                    }else{
                        return res.json(helper.showSuccessResponse('MESSAGE_LIST', resdata));
                    }
                });
            }
          }catch (error) {
            return res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
          }
     }
}