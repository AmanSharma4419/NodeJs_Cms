const CarTypes = require('../models/ServicesCars');
const upload = require('../lib/awsimageupload.js');
const imageUpload = upload.any();

module.exports = {

    getCartypeList: async (req, res) => {
        try {
            CarTypes.getCarsTypesall((err, resdata) => {
                if (err) {
                    return res.status(500).json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
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
            res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    },

    getEnabledCartypeList: async (req, res) => {
        try {
            CarTypes.getEnabledCarsTypes((err, resdata) => {
                if (err) {
                    return res.status(500).json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
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
            res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    },

    addCarTypeData: async (req, res) => {
        try {

            imageUpload(req, res, async (err, some) => {

                var data = req.body;

                if (!data.carType) {
                    return res.status(400).json(helper.showValidationErrorResponse('CARTYPE_IS_REQUIRED'));
                }

                var file = req.files;

                if (file.length == 0) {
                    return res.status(400).json(helper.showValidationErrorResponse('IMAGE_IS_REQUIRED'));
                }

                if (err) {
                    return res.status(422).json(helper.showAWSImageUploadErrorResponse('IMAGE_UPLOAD_ERROR', err.message));
                }

                data.carImage = req.files[0].location;

                if (!data.maxPersons) {
                    return res.status(400).json(helper.showValidationErrorResponse('MAX_PERSONS_IS_REQUIRED'));
                }

                if (!data.minimumFare) {
                    return res.status(400).json(helper.showValidationErrorResponse('MINIMUM_PRICE_IS_REQUIRED'));
                }

                if (!data.distanceForBaseFare) {
                    return res.status(400).json(helper.showValidationErrorResponse('DISTANCE_BASE_FARE_IS_REQUIRED'));
                }

                if (!data.unit) {
                    return res.status(400).json(helper.showValidationErrorResponse('CITY_UNIT_IS_REQUIRED'));
                };

                if (!data.basePrice) {
                    return res.status(400).json(helper.showValidationErrorResponse('BASE_PRICE_IS_REQUIRED'));
                }

                if (!data.pricePerUnitDistance) {
                    return res.status(400).json(helper.showValidationErrorResponse('DISTANCE_UNIT_PRICE_IS_REQUIRED'));
                }

                if (!data.pricePerUnitTimeMinute) {
                    return res.status(400).json(helper.showValidationErrorResponse('TIME_UNIT_PRICE_IS_REQUIRED'));
                }

                if (!data.driverPercentCharge) {
                    return res.status(400).json(helper.showValidationErrorResponse('DRIVER_PERCENTAGE_IS_REQUIRED'));
                }

                if (!data.waitingTimeStartAfterMin) {
                    return res.status(400).json(helper.showValidationErrorResponse('WAITING_TIME_MIN_IS_REQUIRED'));
                }

                if (!data.waitingTimePrice) {
                    return res.status(400).json(helper.showValidationErrorResponse('WAITING_TIME_PRICE_IS_REQUIRED'));
                }

                if (!data.cancellationTimeMin) {
                    return res.status(400).json(helper.showValidationErrorResponse('CANCELLATION_TIME_MIN_IS_REQUIRED'));
                }

                if (!data.cancellationFee) {
                    return res.status(400).json(helper.showValidationErrorResponse('CANCELLATION_PRICE_IS_REQUIRED'));
                }

                if (!data.taxStatus) {
                    return res.status(400).json(helper.showValidationErrorResponse('TAX_STATUS_IS_REQUIRED'));
                }

                if (!data.taxPercentageCharge) {
                    return res.status(400).json(helper.showValidationErrorResponse('TAX_PERCENTAGE_CHARGE_IS_REQUIRED'));
                }

                if (!data.status) {
                    return res.status(400).json(helper.showValidationErrorResponse('STATUS_IS_REQUIRED'));
                }

                CarTypes.addCarType(data, (err, resdata) => {
                    if (err) {
                        return res.status(500).json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                    } else {
                        res.json(helper.showSuccessResponse('DATA_ADDED_SUCCESS', resdata));
                    }
                });

            });
        }
        catch (err) {
            res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    },

    getCartypeDetails: async (req, res) => {
        try {

            var id = req.params._id;

            if (!id) {
                return res.status(400).json(helper.showValidationErrorResponse('ID_IS_REQUIRED'));
            }

            CarTypes.getCarsTypesById(id, (err, resdata) => {
                if (err) {
                    return res.status(500).json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                } else {
                    if (resdata === null) {
                        res.json(helper.showSuccessResponse('NO_DATA_FOUND', []));
                    } else {
                        res.json(helper.showSuccessResponse('DATA_SUCCESS', resdata));
                    }
                }
            });

        } catch (err) {
            res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    },

    updateCartypeDetails: async (req, res) => {
        try {
            imageUpload(req, res, async (err, some) => {

                var data = req.body;

                if (!data.carTypeId) {
                    return res.status(400).json(helper.showValidationErrorResponse('ID_IS_REQUIRED'));
                }

                if (!data.carType) {
                    return res.status(400).json(helper.showValidationErrorResponse('CARTYPE_IS_REQUIRED'));
                }

                if (!data.maxPersons) {
                    return res.status(400).json(helper.showValidationErrorResponse('MAX_PERSONS_IS_REQUIRED'));
                }

                if (!data.minimumFare) {
                    return res.status(400).json(helper.showValidationErrorResponse('MINIMUM_PRICE_IS_REQUIRED'));
                }

                if (!data.distanceForBaseFare) {
                    return res.status(400).json(helper.showValidationErrorResponse('DISTANCE_BASE_FARE_IS_REQUIRED'));
                }

                if (!data.basePrice) {
                    return res.status(400).json(helper.showValidationErrorResponse('BASE_PRICE_IS_REQUIRED'));
                }

                if (!data.pricePerUnitDistance) {
                    return res.status(400).json(helper.showValidationErrorResponse('DISTANCE_UNIT_PRICE_IS_REQUIRED'));
                }

                if (!data.pricePerUnitTimeMinute) {
                    return res.status(400).json(helper.showValidationErrorResponse('TIME_UNIT_PRICE_IS_REQUIRED'));
                }

                if (!data.driverPercentCharge) {
                    return res.status(400).json(helper.showValidationErrorResponse('DRIVER_PERCENTAGE_IS_REQUIRED'));
                }

                if (!data.waitingTimeStartAfterMin) {
                    return res.status(400).json(helper.showValidationErrorResponse('WAITING_TIME_MIN_IS_REQUIRED'));
                }

                if (!data.waitingTimePrice) {
                    return res.status(400).json(helper.showValidationErrorResponse('WAITING_TIME_PRICE_IS_REQUIRED'));
                }

                if (!data.cancellationTimeMin) {
                    return res.status(400).json(helper.showValidationErrorResponse('CANCELLATION_TIME_MIN_IS_REQUIRED'));
                }

                if (!data.cancellationFee) {
                    return res.status(400).json(helper.showValidationErrorResponse('CANCELLATION_PRICE_IS_REQUIRED'));
                }

                if (!data.taxStatus) {
                    return res.status(400).json(helper.showValidationErrorResponse('TAX_STATUS_IS_REQUIRED'));
                }

                if (!data.taxPercentageCharge) {
                    return res.status(400).json(helper.showValidationErrorResponse('TAX_PERCENTAGE_CHARGE_IS_REQUIRED'));
                }

                if (!data.status) {
                    return res.status(400).json(helper.showValidationErrorResponse('STATUS_IS_REQUIRED'));
                }

                var file = req.files;

                if (!file || file.length == 0) {
                    //data.carImage = data.carImage;
                } else {
                    data.carImage = req.files[0].location;
                }

                CarTypes.updateCarType(data.carTypeId, data, (err, resdata) => {
                    if (err) {
                        return res.status(500).json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                    } else {
                        res.json(helper.showSuccessResponse('DATA_UPDATED_SUCCESS', resdata));
                    }
                });

            });
        } catch (error) {
            res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    },

    removeCarTypeData: async (req, res) => {
        try {
            var data = req.body;

            if (!data._id) {
                return res.status(400).json(helper.showValidationErrorResponse('ID_IS_REQUIRED'));
            }

            CarTypes.removeCartype(data._id, async (err, resdata) => {
                if (err) {
                    return res.status(500).json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                } else {
                    res.json(helper.showSuccessResponse('DELETE_SUCCESS', resdata));
                }
            });
        }
        catch (err) {
            res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    }
}