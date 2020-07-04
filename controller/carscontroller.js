const Driver = require('../models/drivertable.js');
const upload = require('../lib/awsimageupload.js');
const deleteaws = require('../lib/awsdelete.js');
const Car = require('../models/cartable');
const Auth = require('../middleware/auth');
const profileImageUpload = upload.any();

module.exports = {

    getAllCarsList: async (req, res) => {
        try {
            Car.getCars((err, resdata) => {
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

    addCarData: async (req, res) => {
        try {
            profileImageUpload(req, res, async function (err, some) {
                var file = req.files;
                var data = req.body;

                console.log("data", data);

                if (req.headers.token == 'undefined') {
                    data.driverId = req.headers.driverid;
                } else {
                    var verifydata = await Auth.validateDriver(req);

                    if (verifydata == null) {
                        return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
                    }

                    data.driverId = verifydata._id;

                }

                if (!data.carName) {
                    return res.json(helper.showValidationErrorResponse('CAR_NAME_IS_REQUIRED'));
                }

                if (!data.carTypeId) {
                    return res.json(helper.showValidationErrorResponse('CAR_TYPE_ID_IS_REQUIRED'));
                };

                if (!data.carType) {
                    return res.json(helper.showValidationErrorResponse('CAR_TYPE_IS_REQUIRED'));
                }

                if (!data.plateNumber) {
                    return res.json(helper.showValidationErrorResponse('CAR_PLATENUMBER_IS_REQUIRED'));
                }

                if (!data.carColor) {
                    return res.json(helper.showValidationErrorResponse('CAR_COLOR_IS_REQUIRED'));
                }

                // checking if there are any files or null
                if (!file) {
                    return res.json(helper.showValidationErrorResponse('IMAGE_IS_REQUIRED'));
                }
                // if any error on AWS 
                if (err) {
                    return res.status(422).json(helper.showAWSImageUploadErrorResponse('IMAGE_UPLOAD_ERROR', err.message));
                }
                data.carImage  = req.files[0].location
                data.carImage2 = req.files[1].location
                data.carImage3 = req.files[2].location
                data.carImage4 = req.files[3].location
                
                Car.addCars(data, async (err, resdata) => {
                    if (err) {
                        return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                    } else {
                        try {
                            // var Cdata = {
                            //     driverId: resdata.driverId,
                            //     ref: resdata._id
                            // }
                            // //console.log(Cdata);
                            // var reftocars = await Driver.AddRefToCars(Cdata);
                            var updateselectedcar = await Driver.updateSelectedCars({ driverId: data.driverId, carTypeId: data.carTypeId, carId: resdata._id });
                            //console.log(reftocars);
                            res.json(helper.showSuccessResponse('DATA_ADDED_SUCCESS', resdata));
                        }
                        catch (err) {
                            res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                        }
                    }
                });
            })
        }
        catch (err) {
            console.log("err", err);
            res.json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    },

    removeCarById: async (req, res) => {
        try {
            var data = req.body;
            var verifydata = await Auth.validateDriver(req);

            if (verifydata == null) {
                return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
            }

            if (!data.carId) {
                return res.json(helper.showValidationErrorResponse('CAR_ID_IS_REQUIRED'));
            }

            Car.getCarsById(data.carId, async (err, datadd) => {
                if (err) {
                    return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                }
                else {
                    var keyimage = datadd.carImage;
                    deleteaws(keyimage);
                }
            });

            Car.removeCars(data.carId, async (err, resdata) => {
                if (err) {
                    return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                } else {
                    try {
                        Cdata = {
                            driverId: verifydata._id,
                            ref: data.carId
                        }
                        var reftocars = await Driver.removeRefToCars(Cdata);

                        res.json(helper.showSuccessResponse('DATA_ADDED_SUCCESS', resdata));
                    }
                    catch (err) {
                        return res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
                    }
                }
            });
        }
        catch (err) {
            res.json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    },

    getDriverActiveSelectedCar: async (req, res) => {
        try {
            var data = req.body;
            var verifydata = await Auth.validateDriver(req);

            if (verifydata == null) {
                return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
            }

            if (!data.carId) {
                return res.json(helper.showValidationErrorResponse('CAR_ID_IS_REQUIRED'));
            }

            var getCarDetails = await Car.getCarsByIdAsync(data.carId);

            var updateselectedcar = await Driver.updateSelectedCars({ driverId: verifydata._id, carTypeId: getCarDetails.carTypeId, carId: data.carId });

            res.json(helper.showSuccessResponse('DATA_SUCCESS', updateselectedcar));

        }
        catch (err) {
            res.json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    },

    getDriverAddedCarsList: async (req, res) => {
        try {
            var verifydata = await Auth.validateDriver(req);
            if (verifydata == null) {
                return res.json(helper.showUnathorizedErrorResponse('NOT_AUTHORIZED'));
            }
            Car.getCarsByDriverList(verifydata._id, (err, resdata) => {
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
    }
}