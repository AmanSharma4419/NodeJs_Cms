const Country = require('../models/countryTable')

module.exports = {

    getCountryList: async (req, res) => {
        try {
            Country.getAllCountries((err, resdata) => {
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

    getEnabledCountryList: async (req, res) => {
        try {
            Country.getEnabledCountries((err, resdata) => {
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

    getCountriesDropdownList: async (req, res) => {
        try {

            var lookup = require('country-data').lookup;
            var resdata = lookup.countries();

            res.json(helper.showSuccessResponse('DATA_SUCCESS', resdata));

        } catch (error) {
            res.status(500).json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }

    },

    addCountryData: async (req, res) => {
        try {
            var data = req.body;

            if (!data.countryName) {
                return res.status(400).json(helper.showValidationErrorResponse('COUNTRY_NAME_IS_REQUIRED'));
            };

            var lookup = require('country-data').lookup;
            var ct = require('countries-and-timezones');
            var getSymbolFromCurrency = require('currency-symbol-map');
            var country = lookup.countries({ name: data.countryName })[0];

            //console.log("cc",country);
            var currency = country.currencies;
            data.currencyCode = currency[0];

            data.countryName = country.name;
            data.countryCode = country.alpha3;
            data.alpha2 = country.alpha2;
            data.alpha3 = country.alpha3;
            data.countryPhoneCode = country.countryCallingCodes[0];
            data.currencySign = getSymbolFromCurrency(data.currencyCode);
            data.status = "yes";
            var timezones = ct.getTimezonesForCountry(data.alpha2);
            //console.log("timezones",timezones);
            data.countryTimezones = timezones;
            data.flagUrl = "https://countryflag.s3.us-east-2.amazonaws.com/" + data.alpha2.toLowerCase() + ".png";

            //console.log("data",data);

            Country.addCountry(data, (err, resdata) => {
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

    getCountryDetailsById: async (req, res) => {
        try {
            var country_id = req.params._id;

            if (!country_id) {
                return res.status(400).json(helper.showValidationErrorResponse('COUNTRY_ID_IS_REQUIRED'));
            }

            Country.getCountryById(country_id, (err, resdata) => {
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

    updateCountryData: async (req, res) => {
        try {
            var data = req.body;

            if (!data.countryId) {
                return res.status(400).json(helper.showValidationErrorResponse('COUNTRY_ID_IS_REQUIRED'));
            }

            if (!data.countryName) {
                return res.status(400).json(helper.showValidationErrorResponse('COUNTRY_NAME_IS_REQUIRED'));
            };

            Country.updateCountry(data, (err, resdata) => {
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

    removeCountryData: async (req, res) => {
        try {
            var data = req.body;

            if (!data.countryId) {
                return res.status(400).json(helper.showValidationErrorResponse('COUNTRY_ID_IS_REQUIRED'));
            }

            Country.removeCountry(data.countryId, (err, resdata) => {
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