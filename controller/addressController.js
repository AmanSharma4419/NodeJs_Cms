var authroute = require('../middleware/auth.js');
var addressTable = require('../models/userAddressTable');


module.exports = {

    getUserAddressList : async(req,res) => {
        try{
            var verifydata = await authroute.validateCustomer(req);
            if (verifydata == null) {
                return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
            }
            addressTable.getUserAddress(verifydata._id, async (err, resdata) => {
                if (err) {
                    return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                } else {
                    return res.json(helper.showSuccessResponse('ADDRESS_LIST', resdata));     
                }
            });

        }catch (error){
            console.log("Error", error);
            return res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    },

    userAddAddress: async (req, res) => {
        try {
            var data = req.body;
            var verifydata = await authroute.validateCustomer(req);
            if (verifydata == null) {
                return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
            }
            if(!data.name){
                return res.json(helper.showValidationErrorResponse('NAME_IS_REQUIRED'));
            }
            if (!data.address) {
                return res.json(helper.showValidationErrorResponse('LOCATION_IS_REQUIRED'));
            }
            data.customerId = verifydata._id;
            data.customerDetails = verifydata._id;
            addressTable.addAddress(data, (err, resdata) => {
                if (err) {
                    console.log("Error in db", err);
                    return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                } else {
                    return res.json(helper.showSuccessResponse('ADDRESS_ADDED', resdata));
                }
            });

        } catch (error) {
            console.log("Error in saved address", error);
            return res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    },

    userGetAddressDetails: async (req, res) => {
        try {
            var verifydata = await authroute.validateCustomer(req);
            if (verifydata == null) {
                return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
            }
            var addressId = req.params._id;
            if (!addressId) {
                return res.json(helper.showValidationErrorResponse('ADDRESS_ID_REQUIRED'));
            }
            addressTable.getAddressById(addressId, (err, resdata) => {
                if (err) {
                    return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                } else {
                    return res.json(helper.showSuccessResponse('ADDRESS_DETAIL', resdata));
                }
            });
        } catch (error) {
            return res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    },

    userUpdateAddress: async (req, res) => {
        try {
            var data = req.body;
            var verifydata = await authroute.validateCustomer(req);
            if (verifydata == null) {
                return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
            }

            if (!data.addressId) {
                return res.json(helper.showValidationErrorResponse('ADDRESS_ID_REQUIRED'));
            }

            if (!data.address) {
                return res.json(helper.showValidationErrorResponse('LOCATION_IS_REQUIRED'));
            }

            if(!data.name){
                return res.json(helper.showValidationErrorResponse('NAME_IS_REQUIRED'));
            }
        
            data.customerId = verifydata._id;
            data.customerDetails = verifydata._id;
            var getAddressDetails = await addressTable.getAddressByIdAsync(data.addressId);
            if (getAddressDetails == null) {
                return res.json(helper.showValidationErrorResponse('ADDRESS_ID_INVALID'));
            }
            addressTable.updateAddress(data, (err, resdata) => {
                if (err) {
                    return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                } else {
                    return res.json(helper.showSuccessResponse('ADDRESS_UPDATED', resdata));
                }
            });
        } catch (error) {
            return res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    },

    userUpdateDefaultAddress: async (req, res) => {
        try {
            var data = req.body;
            var verifydata = await authroute.validateCustomer(req);
            if (verifydata == null) {
                return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
            }
            if (!data.addressId) {
                return res.json(helper.showValidationErrorResponse('ADDRESS_ID_REQUIRED'));
            }
            data.customerId = verifydata._id;
            await addressTable.updateOthertAddressFalse(data);
            var updateDefault = await addressTable.updateDefaultTrue(data);
            return res.json(helper.showSuccessResponse('ADDRESS_UPDATED', updateDefault));
        } catch (error) {
            return res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    },

    userRemoveAddress: async (req, res) => {
        try {
            var data = req.body;
            var verifydata = await authroute.validateCustomer(req);
            if (verifydata == null) {
                return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
            }
            if (!data.addressId) {
                return res.json(helper.showValidationErrorResponse('ADDRESS_ID_REQUIRED'));
            }
            addressTable.removeAddress(data.addressId, (err, resdata) => {
                if(err){
                    return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                } else {
                    return res.json(helper.showSuccessResponse('ADDRESS_UPDATED', resdata));
                }
            });
        } catch (error) {
            return res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    }
}