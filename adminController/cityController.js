var City = require('../models/cityTable');
var Country = require('../models/countryTable');

module.exports = {

    getCityList: async (req, res) => {
        try {
            City.getAllCities((err, resdata) => {
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

    getEnabledCityList: async (req, res) => {
        try {
            City.getEnabledCities((err, resdata) => {
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

    getCityByCountryId: async (req, res) => {
        try {
            var data = req.body;
            if (!data.countryId) {
                return res.status(400).json(helper.showValidationErrorResponse('COUNTRY_ID_IS_REQUIRED'));
            };
            City.getCityByCountryId(data, (err, resdata) => {
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

    addCityData: async (req, res) => {
        try {
            var data = req.body;

            if (!data.countryId) {
                return res.status(400).json(helper.showValidationErrorResponse('COUNTRY_ID_IS_REQUIRED'));
            };

            data.countryDetails = data.countryId;

            var getCountry = await Country.getCountryByIdAsync(data.countryId);
            data.countryCode = getCountry.alpha2;

            if (!data.cityName) {
                return res.status(400).json(helper.showValidationErrorResponse('CITY_NAME_IS_REQUIRED'));
            };

            if (!data.cityCode) {
                return res.status(400).json(helper.showValidationErrorResponse('CITY_CODE_IS_REQUIRED'));
            };

            if (!data.cityLocation) {
                return res.status(400).json(helper.showValidationErrorResponse('CITY_LOCATION_IS_REQUIRED'));
            };

            data.cityLocation = { type: "Point", coordinates: [data.cityLocation.lng, data.cityLocation.lat] };

            if (!data.cityBoundaryRadius) {
                return res.status(400).json(helper.showValidationErrorResponse('CITY_RADIUS_IS_REQUIRED'));
            };

            if (!data.cityGoogleCode) {
                return res.status(400).json(helper.showValidationErrorResponse('CITY_SHORT_CODE_IS_REQUIRED'));
            };

            if (!data.cityTimezone) {
                return res.status(400).json(helper.showValidationErrorResponse('CITY_TIMEZONE_IS_REQUIRED'));
            };

            if (!data.status) {
                return res.status(400).json(helper.showValidationErrorResponse('CITY_BUSINESS_STATUS_IS_REQUIRED'));
            };

            //console.log("data",data);

            City.addCity(data, (err, resdata) => {
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

    getCityDetailsById: async (req, res) => {
        try {
            var id = req.params._id;
            if(!id){
                return res.status(400).json(helper.showValidationErrorResponse('ID_IS_REQUIRED'));
            }
            City.getCityById(id, (err, resdata) => {
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

    updateCityData: async (req, res) => {
        try {
            var data = req.body;

            if (!data.cityId) {
                return res.status(400).json(helper.showValidationErrorResponse('ID_IS_REQUIRED'));
            }

            if (!data.countryId) {
                return res.status(400).json(helper.showValidationErrorResponse('COUNTRY_ID_IS_REQUIRED'));
            };

            if (!data.cityName) {
                return res.status(400).json(helper.showValidationErrorResponse('CITY_NAME_IS_REQUIRED'));
            };

            if (!data.cityCode) {
                return res.status(400).json(helper.showValidationErrorResponse('CITY_CODE_IS_REQUIRED'));
            };

            if (!data.cityLocation) {
                return res.status(400).json(helper.showValidationErrorResponse('CITY_LOCATION_IS_REQUIRED'));
            };

            data.cityLocation = { type: "Point", coordinates: [data.cityLocation.lng, data.cityLocation.lat] };

            if (!data.cityBoundaryRadius) {
                return res.status(400).json(helper.showValidationErrorResponse('CITY_RADIUS_IS_REQUIRED'));
            };

            if (!data.cityGoogleCode) {
                return res.status(400).json(helper.showValidationErrorResponse('CITY_SHORT_CODE_IS_REQUIRED'));
            };

            if (!data.cityTimezone) {
                return res.status(400).json(helper.showValidationErrorResponse('CITY_TIMEZONE_IS_REQUIRED'));
            };

            if (!data.status) {
                return res.status(400).json(helper.showValidationErrorResponse('CITY_BUSINESS_STATUS_IS_REQUIRED'));
            };

            City.updateCity(data, (err, resdata) => {
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

    removeCityData: async (req, res) => {
        try {
            var data = req.body;
            if (!data.cityId) {
                return res.status(400).json(helper.showValidationErrorResponse('ID_IS_REQUIRED'));
            }
            City.removeCity(data.cityId, (err, resdata) => {
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