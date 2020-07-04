const upload = require('../lib/awsimageupload.js');
const deleteaws = require('../lib/awsdelete.js');
const profileImageUpload = upload.any();
const LPM = require('../models/listPMethods');
const POs = require('../models/paymentoptions');
const paymenthandler = require('../lib/paymenthandler');
const paymentMiddleware = require('../middleware/payments');
const paystackHelper = require('../lib/paystack');
const authroute = require('../middleware/auth.js');
const User = require('../models/userTable');
const Square = require('../lib/square');

module.exports = {

    addPaymentMethods: async (req, res) => {
        try {
            profileImageUpload(req, res, async function (err, some) {
                var file = req.files;
                var data = req.body;
                //checking for email in DB
                var verify = await LPM.getPMsByType({ type: data.type });
                // checking if there are any files or null
                if (!file) {
                    return res.json(helper.showValidationErrorResponse('IMAGE_IS_REQUIRED'));
                }
                // if any error on AWS
                if (err) {
                    //console.log("Image uplaod error", err);
                    return res.json(helper.showAWSImageUploadErrorResponse('IMAGE_UPLOAD_ERROR', err.message));
                }
                data.logo = req.files[0].location

                // clearing AWS S3 of previous images
                if (verify) {
                    var keyimage = verify.logo;
                    deleteaws(keyimage);
                }
                try {       // updating in DB
                    LPM.addPMs(data, (err, resdata) => {
                        if (err) {
                            //console.log("Error adding data", err);
                            return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                        }
                        else {
                            res.json(helper.showSuccessResponse('DATA_ADDED_SUCCESS', resdata));
                        }
                    });
                }
                catch (err) {
                    //console.log(err);
                    res.json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
                }
            })
        }
        catch (err) {
            res.json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    },

    deletePaymentMethodById: async (req, res) => {
        try {
            var data = req.body;
            LPM.removePMs(data._id, (err, resdata) => {
                if (err) {
                    return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                } else {
                    res.json(helper.showSuccessResponse('DELETE_SUCCESS', resdata));
                }
            });
        }
        catch (err) {
            res.json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    },

    getEnabledPaymentMethodList: async (req, res) => {
        try {

            LPM.getPMsVisible((err, resdata) => {
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

    getUserAddedPaymentOptions: async (req, res) => {
        try {
            var verifydata = await authroute.validateCustomer(req);
            if (verifydata == null) {
                return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
            }
            POs.getPObyCustomerId({ customerId: verifydata._id }, (err, resdata) => {
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

    getUserSelectedPaymentOption: async (req, res) => {
        try {
            var data = req.body;
            var verifydata = await authroute.validateCustomer(req);
            if (verifydata == null) {
                return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
            }
            POs.getSelectedPO(data.customerId, (err, resdata) => {
                if (err) {
                    return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                } else {
                    if (resdata === null) {
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

    updateUserSelectedPaymentOption: async (req, res) => {
        try {
            var data = req.body;
            var verifydata = await authroute.validateCustomer(req);
            if (verifydata == null) {
                return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
            }
            POs.updateSelected(data, (err, resdata) => {
                if (err) {
                    return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                } else {
                    res.json(helper.showSuccessResponse('DATA_UPDATED_SUCCESS', resdata));
                }
            });
        }
        catch (err) {
            res.json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    },

    addUserPaymentOptionByStripe: async (req, res) => {
        try {
            var data = req.body;
            var verifydata = await authroute.validateCustomer(req);
            if (verifydata == null) {
                return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
            }
            var mdata = { type: "Card" }
            var verifypms = await LPM.getPMsByType(mdata);
            if (!verifypms || verifypms === undefined) {
                return res.json(helper.showValidationErrorResponse('PAYMENT_METHOD_IS_NOT_AVAILABLE'));
            }
            data.logo = verifypms.logo;
            data.email = verifydata.email;
            //console.log("Payment option by stripe",data);
            paymenthandler.POhandler(data, (err, handler) => {
                if (err) {
                    return res.json(helper.showStripeErrorResponse(err.message));
                }

                data.token = handler.id;
                data.detials = {};

                POs.addPaymentOptions(data, (err, resdata) => {
                    if (err) {
                        res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                    } else {
                        res.json(helper.showSuccessResponse('DATA_ADDED_SUCCESS', resdata));
                    }
                });
            });

        }
        catch (err) {
            res.json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    },

    addUserPaymentOptionBySquare: async (req, res) => {
        try {
            var data = req.body;
            var verifydata = await authroute.validateCustomer(req);
            if (verifydata == null) {
                return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
            }

            var mdata = { type: "Card" }
            var verifypms = await LPM.getPMsByType(mdata);
            if (!verifypms || verifypms === undefined) {
                return res.json(helper.showValidationErrorResponse('PAYMENT_METHOD_IS_NOT_AVAILABLE'));
            }

            data.logo = verifypms.logo;
            data.customerId = verifydata._id;

            Square.createCustomer({ email: verifydata.email }, (customerResponse) => {
                if (customerResponse.status) {

                    var cardRequest = {
                        customerId: customerResponse.data.customer.id,
                        card_nonce: data.token,
                        postal_code: data.postalCode
                    }

                    Square.createCustomerCard(cardRequest, (cardResponse) => {
                        if (cardResponse.status) {

                            //console.log("cardResponse, ", cardResponse);

                            data.token = customerResponse.data.customer.id;
                            data.lastd = cardResponse.data.card.last_4;
                            data.name = cardResponse.data.card.card_brand;
                            data.type = "Card";
                            data.detials = cardResponse.data.card;

                            POs.addPaymentOptions(data, (err, resdata) => {
                                if (err) {
                                    res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                                } else {
                                    res.json(helper.showSuccessResponse('DATA_ADDED_SUCCESS', resdata));
                                }
                            });

                        } else {
                            return res.json(helper.showStripeErrorResponse(cardResponse.message));
                        }
                    });

                } else {
                    return res.json(helper.showStripeErrorResponse(response.message));
                }
            });

        } catch (error) {
            res.json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    },

    deleteUserPaymentOption: async (req, res) => {
        try {
            var data = req.body;
            var verifydata = await authroute.validateCustomer(req);
            if (verifydata == null) {
                return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
            }

            POs.removePO(data._id, (err, resdata) => {
                if (err) {
                    return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                } else {
                    res.json(helper.showSuccessResponse('DELETE_SUCCESS', resdata));
                }
            });
        }
        catch (err) {
            res.json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    },

    addUserPaystackPaymentOption: async (req, res) => {
        try {
            var data = req.body;
            //console.log('card add', data);
            var verifydata = await authroute.validateCustomer(req)
            if (verifydata == null) {
                return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
            }
            var mdata = { type: data.type }
            var verifypms = await LPM.getPMsByType(mdata);
            if (!verifypms || verifypms === undefined) {
                return res.json(helper.showValidationErrorResponse('PAYMENT_METHOD_IS_NOT_AVAILABLE'));
            }
            data.logo = verifypms.logo;
            data.email = verifydata.email;
            var referenceNumber = data.token;
            if (data.type != 'Cash') {

                paystackHelper.verifyTransactionByReferenceNumber(referenceNumber, (response) => {
                    // console.log('response', response);
                    if (response.status) {
                        //console.log('inside');
                        //console.log('auth', response.data.authorization.authorization_code);
                        data.token = response.data.authorization.authorization_code;
                        paystackHelper.refundFirstTransaction(referenceNumber, (refundRes) => {
                            if (refundRes.status) {
                                POs.addPaymentOptions(data, (err, resdata) => {
                                    if (err || resdata === null) {
                                        return res.status(404).json({ "message": "Duplicate Card Number", "data": {}, "error": err })
                                    }
                                    else {
                                        return res.json({ "message": "Added Payment Method", "data": {}, "error": {} })
                                    }
                                });
                            }
                            else {
                                return res.json({ "status": "failure", "message": refundRes.message, "data": {}, "error": '' });
                            }
                        })
                    } else {
                        return res.json({ "status": "failure", "message": response.message, "data": {}, "error": '' });
                    }
                })
            }

        }
        catch (err) {
            return res.json({ "message": "Add Payment Internal Server Error!", "data": {}, "error": err })
        }
    },

    addMoneyToUserWalletByPaystack: async (req, res) => {

        try {
            var paramsList = [
                { name: 'walletCredit', type: 'number' },
                { name: 'paymentSourceRefNo', type: 'string' }
            ];

            var data = req.body;

            helper.checkRequestParams(data, paramsList, async (response) => {
                if (response.status) {
                    var verifydata = await authroute.validateCustomer(req);
                    if (verifydata == null) {
                        return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
                    }

                    var previousWalletCredit = verifydata.walletCredit;

                    if (!data.walletCredit) {
                        return res.json({ "status": "failure", "message": "Amount is required!" });
                    }

                    if (!data.paymentSourceRefNo) {
                        return res.json({ "status": "failure", "message": "paymentSourceRefNo is required!" });
                    }

                    var getCard = await POs.getPObyId(data.paymentSourceRefNo);

                    if (getCard == null) {
                        res.json({ "status": "failure", "message": "Not a Valid paymentSourceRefNo!", "data": {}, "error": {} });
                    }

                    var stripeCost = data.walletCredit * 100;
                    var finalcost = parseInt(stripeCost);

                    var chargeData = {
                        paystackAuthToken: getCard.token,
                        cost: finalcost,
                        customerId: getCard.customerId
                    }

                    paystackHelper.charge(chargeData, (presponse) => {
                        if (!presponse.status) {
                            return res.json({ "status": "failure", "message": presponse.message, "data": {}, "error": '' });
                        } else {

                            var totalCredit = Math.round((previousWalletCredit + data.walletCredit) * 100) / 100;
                            var userData = {
                                walletCredit: totalCredit,
                                customerId: verifydata._id
                            }

                            User.addToUserWallet(userData, (err, resdata) => {
                                if (err) {
                                    res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                                } else {
                                    res.json(helper.showSuccessResponse('DATA_ADDED_SUCCESS', resdata));
                                }
                            });
                        }
                    });

                } else {

                    res.json({
                        status: "failure",
                        error_code: response.error_code,
                        message: response.message,
                        data: {}
                    });
                }
            });
        } catch (error) {
            //console.log(error);
            res.json({ "message": "Internal Server Error!", "data": {}, "error": error });
        }
    },

    addMoneyToUserWalletByStripe: async (req, res) => {
        try {
            var paramsList = [
                { name: 'walletCredit', type: 'number' },
                { name: 'paymentSourceRefNo', type: 'string' }
            ];

            var data = req.body;

            helper.checkRequestParams(data, paramsList, async (response) => {
                if (response.status) {
                    var verifydata = await authroute.validateCustomer(req);
                    if (verifydata == null) {
                        return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
                    }

                    var previousWalletCredit = verifydata.walletCredit;

                    if (!data.walletCredit) {
                        return res.json(helper.showValidationErrorResponse('AMOUNT_IS_REQUIRED'));
                    }

                    if (!data.paymentSourceRefNo) {
                        return res.json(helper.showValidationErrorResponse('PAYMENT_IS_REQUIRED'));
                    }

                    var chargeData = {
                        cost: data.walletCredit,
                        paymentSourceRefNo: data.paymentSourceRefNo
                    }

                    paymentMiddleware.paymentByStripe(chargeData, (presponse) => {
                        if (!presponse.status) {
                            res.json(helper.showStripeErrorResponse(presponse.message));
                        } else {

                            var totalCredit = Math.round((previousWalletCredit + data.walletCredit) * 100) / 100;
                            var userData = {
                                walletCredit: totalCredit,
                                customerId: verifydata._id
                            }

                            User.addToUserWallet(userData, (err, resdata) => {
                                if (err) {
                                    res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                                } else {
                                    res.json(helper.showSuccessResponse('DATA_ADDED_SUCCESS', resdata));
                                }
                            });
                        }
                    });

                } else {
                    res.json(helper.showParamsErrorResponse(response.message));
                }
            });
        } catch (error) {
            res.json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    },

    addMoneyToUserWalletBySquare: async (req, res) => {
        try {
            var paramsList = [
                { name: 'walletCredit', type: 'number' },
                { name: 'paymentSourceRefNo', type: 'string' }
            ];

            var data = req.body;

            helper.checkRequestParams(data, paramsList, async (response) => {
                if (response.status) {
                    var verifydata = await authroute.validateCustomer(req);
                    if (verifydata == null) {
                        return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
                    }

                    var previousWalletCredit = verifydata.walletCredit;

                    if (!data.walletCredit) {
                        return res.json(helper.showValidationErrorResponse('AMOUNT_IS_REQUIRED'));
                    }

                    if (!data.paymentSourceRefNo) {
                        return res.json(helper.showValidationErrorResponse('PAYMENT_IS_REQUIRED'));
                    }

                    var chargeData = {
                        cost: data.walletCredit,
                        paymentSourceRefNo: data.paymentSourceRefNo
                    }

                    paymentMiddleware.paymentBySquare(chargeData, (presponse) => {
                        if (!presponse.status) {
                            res.json(helper.showStripeErrorResponse(presponse.message));
                        } else {

                            var totalCredit = Math.round((previousWalletCredit + data.walletCredit) * 100) / 100;
                            var userData = {
                                walletCredit: totalCredit,
                                customerId: verifydata._id
                            }

                            User.addToUserWallet(userData, (err, resdata) => {
                                if (err) {
                                    res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                                } else {
                                    res.json(helper.showSuccessResponse('DATA_ADDED_SUCCESS', resdata));
                                }
                            });
                        }
                    });

                } else {
                    res.json(helper.showParamsErrorResponse(response.message));
                }
            });
        } catch (error) {
            res.json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    }
}