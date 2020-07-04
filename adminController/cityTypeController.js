var CityType = require('../models/citytypeTable');
var City = require('../models/cityTable');

module.exports = {

    getCityTypeList: async (req, res) => {
        try {
            CityType.getAllCityTypes((err, resdata) => {
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

    getEnabledCityTypeList: async (req, res) => {
        try {
            CityType.getEnabledCityTypes((err, resdata) => {
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

    getCityTypeByCountryId: async (req, res) => {
        try {
            var data = req.body;
            if (!data.countryId) {
                return res.status(400).json(helper.showValidationErrorResponse('COUNTRY_ID_IS_REQUIRED'));
            };
            CityType.getCityTypeByCountryId(data, (err, resdata) => {
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

    addCityTypeData: async (req, res) => {
        try {
            var data = req.body;
            if (!data.countryId) {
                return res.status(400).json(helper.showValidationErrorResponse('COUNTRY_ID_IS_REQUIRED'));
            };
            data.countryDetails = data.countryId;
            if (!data.cityId) {
                return res.status(400).json(helper.showValidationErrorResponse('CITY_ID_IS_REQUIRED'));
            };
            data.cityDetails = data.cityId;
            if (!data.carTypeId) {
                return res.status(400).json(helper.showValidationErrorResponse('CAR_TYPE_ID_IS_REQUIRED'));
            };
            data.carTypeDetails = data.carTypeId;
            var checkAlreadyAdded = await CityType.checkAlreadyAdded(data);
            if (checkAlreadyAdded != null) {
                return res.status(400).json(helper.showValidationErrorResponse('ALREADY_ADDED'));
            }
            if (!data.maxPersons) {
                return res.status(400).json(helper.showValidationErrorResponse('MAX_PERSONS_IS_REQUIRED'));
            }

            if (!data.unit) {
                return res.status(400).json(helper.showValidationErrorResponse('CITY_UNIT_IS_REQUIRED'));
            };

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

            if (!data.isSurgeTime) {
                return res.status(400).json(helper.showValidationErrorResponse('SURGE_STATUS_IS_REQUIRED'));
            }

            if (data.isSurgeTime === "yes") {

                if (data.surgeTimeList.length === 0) {
                    return res.status(400).json(helper.showValidationErrorResponse('SURGE_LIST_IS_REQUIRED'));
                }

                data.surgeTimeList = data.surgeTimeList;

            }

            //console.log("data",data);

            CityType.addCityType(data, (err, resdata) => {
                if (err) {
                    return res.status(500).json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                } else {
                    res.json(helper.showSuccessResponse('DATA_ADDED_SUCCESS', resdata));
                }
            });

        } catch (error) {
            //console.log("err", error);
            res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    },

    getCityTypeDetailsById: async (req, res) => {
        try {
            var id = req.params._id;

            if (!id) {
                return res.status(400).json(helper.showValidationErrorResponse('ID_IS_REQUIRED'));
            }

            CityType.getCityTypeById(id, (err, resdata) => {
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

        } catch (error) {
            res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    },

    updateCityTypeData: async (req, res) => {
        try {
            var data = req.body;

            if (!data.cityTypeId) {
                return res.status(400).json(helper.showValidationErrorResponse('CITY_TYPE_ID_IS_REQUIRED'));
            };

            if (!data.countryId) {
                return res.status(400).json(helper.showValidationErrorResponse('COUNTRY_ID_IS_REQUIRED'));
            };

            data.countryDetails = data.countryId;

            if (!data.cityId) {
                return res.status(400).json(helper.showValidationErrorResponse('CITY_ID_IS_REQUIRED'));
            };

            data.cityDetails = data.cityId;

            if (!data.carTypeId) {
                return res.status(400).json(helper.showValidationErrorResponse('CAR_TYPE_ID_IS_REQUIRED'));
            };

            data.carTypeDetails = data.carTypeId;

            if (!data.maxPersons) {
                return res.status(400).json(helper.showValidationErrorResponse('MAX_PERSONS_IS_REQUIRED'));
            }

            if (!data.unit) {
                return res.status(400).json(helper.showValidationErrorResponse('CITY_UNIT_IS_REQUIRED'));
            };

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

            if (!data.isSurgeTime) {
                return res.status(400).json(helper.showValidationErrorResponse('SURGE_STATUS_IS_REQUIRED'));
            }

            if (data.isSurgeTime === "yes") {

                if (data.surgeTimeList.length === 0) {
                    return res.status(400).json(helper.showValidationErrorResponse('SURGE_LIST_IS_REQUIRED'));
                }

                data.surgeTimeList = data.surgeTimeList;

            }

            CityType.updateCityType(data, (err, resdata) => {
                if (err) {
                    return res.status(500).json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                } else {
                    res.json(helper.showSuccessResponse('DATA_UPDATED_SUCCESS', resdata));
                }
            });

        } catch (error) {
            res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }

    },

    removeCityTypeData: async (req, res) => {
        try {
            var data = req.body;
            if (!data.cityTypeId) {
                return res.status(400).json(helper.showValidationErrorResponse('ID_IS_REQUIRED'));
            }
            CityType.removeCityType(data.cityTypeId, (err, resdata) => {
                if (err) {
                    return res.status(500).json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                } else {
                    res.json(helper.showSuccessResponse('DELETE_SUCCESS', resdata));
                }
            });
        } catch (error) {
            res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    }
}