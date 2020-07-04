const promo = require('../models/promocodes');
const promoused = require('../models/promocodeUsedtable');
const authroute = require('../middleware/auth.js');

module.exports = {

    getAllPromocodeList: async (req, res) => {
        try {
            promo.getAllPromoCodes((err, resdata) => {
                if (err) {
                    return res.status(200).json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
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
            res.status(200).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    },

    getAllPromocodeVisibleList: async (req, res) => {
        try {
            var verifydata = await authroute.validateCustomer(req);

            if (verifydata == null) {
                return res.status(200).json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
            }

            promo.getAllPromoCodesVisible((err, resdata) => {
                if (err) {
                    return res.status(200).json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
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
            res.status(200).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    },

    addPromoCode: async (req, res) => {
        try {
            var data = req.body;
            if (!data.upto) {
                var date = new Date();
                date.setDate(date.getDate() + 7);
                data.upto = date
            }

            promo.createPromocode(data, (err, resdata) => {
                if (err) {
                    return res.status(200).json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                } else {
                    res.json(helper.showSuccessResponse('DATA_ADDED_SUCCESS', resdata));
                }
            });
        }
        catch (err) {
            res.status(200).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    },

    applyPromoCode: async (req, res) => {
        try {
            var reqdata = req.body;
            var verifydata = await authroute.validateCustomer(req);

            if (verifydata == null) {
                return res.status(200).json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
            }

            if (!reqdata.promocode) {
                return res.status(200).json(helper.showValidationErrorResponse('PROMOCODE_IS_REQUIRED'));
            }

            reqdata.customerId = verifydata._id;
            
            //console.log("reqdata", reqdata);

            promo.findpromocodeCallback(reqdata, async (err, resdata) => {
                if (err) {
                    return res.status(200).json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                } else {

                    if (resdata == null) {
                        return res.status(200).json(helper.showValidationErrorResponse('PROMOCODE_IS_NOT_VALID'));
                    }

                    var checklimit = await promoused.findpromocode(reqdata);
                     
                    //console.log("checklimit", checklimit);

                    if (checklimit.length >= resdata.limit) {
                        return res.status(200).json(helper.showValidationErrorResponse('PROMOCODE_LIMIT_EXHAUSTED'));
                    }else{
                        res.json(helper.showSuccessResponse('PROMOCODE_VALID_SUCCESS', {}));
                    }

                    
                }
            });
        }
        catch (err) {
            res.status(200).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    },

    getPromoCodeList: async (req, res) => {
        try {
            var resdata = await promo.getAllPromoCodesVisible1();

            if (resdata == null || resdata.length === 0) {
                res.json(helper.showSuccessResponse('NO_DATA_FOUND', []));
            } else {
                res.json(helper.showSuccessResponse('DATA_SUCCESS', resdata));
            }

        }
        catch (err) {
            res.status(200).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    }
}