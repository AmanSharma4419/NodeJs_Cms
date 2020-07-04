const Trips = require("../models/triptable");
const CarTypes = require("../models/ServicesCars");
const POs = require("../models/paymentoptions");
const stats = require("../models/reports");
let agenda = require("../jobs/agenda");
const Country = require("../models/countryTable");
const City = require("../models/cityTable");
const CityType = require("../models/citytypeTable");
const paymentMiddleware = require("../middleware/payments");
const socketDriver = require("../models/socketDriver");
const Driver = require("../models/drivertable");
const User = require("../models/userTable");
const Auth = require("../middleware/auth.js");
const basicSetting = require("../config/basicsetting.json");
const promoused = require("../models/promocodeUsedtable");
const otpVerification = require("../lib/otpverification.js");

const googleMapsClient = require("@google/maps").createClient({
  key: "AIzaSyCS6VfhaV6MNwtOHaXfBJY0ntUs34YUhaA",
  //language: 'en',
  Promise: Promise,
});

module.exports = {
  getAllTrips: async (req, res) => {
    try {
      Trips.getTrips((err, resdata) => {
        if (err) {
          return res.json(
            helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err)
          );
        } else {
          if (resdata.length === 0) {
            res.json(helper.showSuccessResponse("NO_DATA_FOUND", []));
          } else {
            res.json(helper.showSuccessResponse("DATA_SUCCESS", resdata));
          }
        }
      });
    } catch (err) {
      return res.json(helper.showInternalServerErrorResponse());
    }
  },

  getTripByID: async (req, res) => {
    try {
      var id = req.params._id;

      if (!id) {
        return res.json(helper.showValidationErrorResponse("ID_IS_REQUIRED"));
      }

      Trips.getTripsByIdCallback(id, (err, resdata) => {
        if (err) {
          return res.json(
            helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err)
          );
        } else {
          if (resdata === null) {
            res.json(helper.showSuccessResponse("NO_DATA_FOUND", []));
          } else {
            res.json(helper.showSuccessResponse("DATA_SUCCESS", resdata));
          }
        }
      });
    } catch (err) {
      return res.json(helper.showInternalServerErrorResponse());
    }
  },

  estimatedCalculateCost: async (req, res) => {
    try {
      var verifydata = await Auth.validateCustomer(req);

      if (verifydata == null) {
        res.json(helper.showUnathorizedErrorResponse("NOT_AUTHORIZED"));
      }

      var data = req.body;

      console.log("Data", data);

      data.startLocationAddr = "";
      data.startLocation = {};
      data.endLocationAddr = "";
      data.endLocation = {};
      data.distance = 0;
      data.estimatedTime = 0;

      if (!data.source) {
        return res.json(
          helper.showValidationErrorResponse("SOURCE_LOCATION_IS_REQUIRED")
        );
      }

      if (!data.destination) {
        return res.json(
          helper.showValidationErrorResponse("DESTINATION_LOCATION_IS_REQUIRED")
        );
      }

      if (!data.source.addressComponents) {
        return res.json(
          helper.showValidationErrorResponse("SOURCE_LOCATION_IS_REQUIRED")
        );
      }

      data.startLocationAddr = data.source.startLocationAddr;
      data.startLocation = {
        lat: data.source.startLocation.lat,
        lng: data.source.startLocation.lng,
      };

      data.endLocationAddr = data.destination.endLocationAddr;
      data.endLocation = {
        lat: data.destination.endLocation.lat,
        lng: data.destination.endLocation.lng,
      };

      data.source.addressComponents.forEach((addresses) => {
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

      var isBusinessInCountry = await Country.isBusinessInCountry(
        data.countryCode
      );

      if (isBusinessInCountry == null) {
        return res.json(
          helper.showValidationErrorResponse("SERVICE_NOT_AVAIABLE")
        );
      }

      var params = {
        origins: data.startLocation, //"Washington, DC, USA"
        destinations: data.endLocation, //"New York, NY, USA"
        mode: "driving",
      };

      var distanceMatrixDetails = googleMapsClient
        .distanceMatrix(params)
        .asPromise()
        .then((response) => {
          return response.json;
        })
        .catch((err) => {
          return err.json;
        });
      let [distanceMatrix] = await Promise.all([distanceMatrixDetails]);

      if (distanceMatrix.status != "OK") {
        return res.json(
          helper.showGoogleMapsErrorResponse(distanceMatrix.error_message)
        );
      }

      var distance = distanceMatrix.rows[0].elements[0].distance.value;
      //convert distance meters to km
      data.distance = Math.round((distance / 1000) * 100) / 100;
      var estimatedTime = distanceMatrix.rows[0].elements[0].duration.value;
      data.estimatedTime = Math.round((estimatedTime / 60) * 100) / 100; //time in seconds convert to min

      City.getCityByCountryCodeAndCityGoogleCode(data, (err, cityResponse) => {
        if (err) {
          return res.json(
            helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err)
          );
        }

        if (cityResponse === null) {
          CarTypes.getEnabledCarsTypes((err, carTypeResponse) => {
            if (err) {
              return res.json(
                helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err)
              );
            } else {
              if (carTypeResponse.length === 0) {
                return res.json(
                  helper.showValidationErrorResponse("CARTYPES_NOT_ADDED")
                );
              } else {
                carTypeResponse.forEach((element) => {
                  var CalculateEstimatedCost = helper.caculateTripEstimatedCost(
                    data.distance,
                    data.estimatedTime,
                    element
                  );
                  var estimatedCost = CalculateEstimatedCost.estimatedCost;
                  var isSurgeTime = CalculateEstimatedCost.isSurgeTime;
                  var surgeMultiplier = CalculateEstimatedCost.surgeMultiplier;
                  var unit = CalculateEstimatedCost.unit;
                  var actualDistance = CalculateEstimatedCost.distance;

                  //console.log("actualDistance", actualDistance);

                  element.set("unit", unit, { strict: false });
                  element.set("estimatedCost", estimatedCost, {
                    strict: false,
                  });
                  element.set("distance", actualDistance, { strict: false });
                  element.set("estimatedTime", data.estimatedTime, {
                    strict: false,
                  });
                  element.set("startLocationAddr", data.startLocationAddr, {
                    strict: false,
                  });
                  element.set("startLocation", data.startLocation, {
                    strict: false,
                  });
                  element.set("endLocationAddr", data.endLocationAddr, {
                    strict: false,
                  });
                  element.set("endLocation", data.endLocation, {
                    strict: false,
                  });
                  element.set("country", data.country, { strict: false });
                  element.set("countryCode", data.countryCode, {
                    strict: false,
                  });
                  element.set("state", data.state, { strict: false });
                  element.set("stateCode", data.stateCode, { strict: false });
                  element.set("city", data.city, { strict: false });
                  element.set("cityCode", data.cityCode, { strict: false });
                  element.set("pricingType", "global", { strict: false });
                  element.set("isSurgeTime", isSurgeTime, { strict: false });
                  element.set("surgeMultiplier", surgeMultiplier, {
                    strict: false,
                  });
                });

                res.json(
                  helper.showSuccessResponse("DATA_SUCCESS", carTypeResponse)
                );
              }
            }
          });
        } else {
          CityType.getCityTypeByCityId(
            cityResponse._id,
            (err, CityTypeResponse) => {
              if (err) {
                return res.json(
                  helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err)
                );
              } else {
                if (CityTypeResponse.length === 0) {
                  return res.json(
                    helper.showValidationErrorResponse("CARTYPES_NOT_ADDED")
                  );
                } else {
                  CityTypeResponse.forEach((element) => {
                    var CalculateEstimatedCost = helper.caculateTripEstimatedCost(
                      data.distance,
                      data.estimatedTime,
                      element
                    );
                    var estimatedCost = CalculateEstimatedCost.estimatedCost;
                    var isSurgeTime = CalculateEstimatedCost.isSurgeTime;
                    var surgeMultiplier =
                      CalculateEstimatedCost.surgeMultiplier;
                    var unit = CalculateEstimatedCost.unit;
                    var actualDistance = CalculateEstimatedCost.distance;

                    element.set("carType", element.carTypeDetails.carType, {
                      strict: false,
                    });
                    element.set("carImage", element.carTypeDetails.carImage, {
                      strict: false,
                    });
                    element.set("unit", unit, { strict: false });
                    element.set("estimatedCost", estimatedCost, {
                      strict: false,
                    });
                    element.set("distance", actualDistance, { strict: false });
                    element.set("estimatedTime", data.estimatedTime, {
                      strict: false,
                    });
                    element.set("startLocationAddr", data.startLocationAddr, {
                      strict: false,
                    });
                    element.set("startLocation", data.startLocation, {
                      strict: false,
                    });
                    element.set("endLocationAddr", data.endLocationAddr, {
                      strict: false,
                    });
                    element.set("endLocation", data.endLocation, {
                      strict: false,
                    });
                    element.set("country", data.country, { strict: false });
                    element.set("countryCode", data.countryCode, {
                      strict: false,
                    });
                    element.set("state", data.state, { strict: false });
                    element.set("stateCode", data.stateCode, { strict: false });
                    element.set("city", data.city, { strict: false });
                    element.set("cityCode", data.cityCode, { strict: false });
                    element.set("pricingType", "city", { strict: false });
                    element.set("isSurgeTime", isSurgeTime, { strict: false });
                    element.set("surgeMultiplier", surgeMultiplier, {
                      strict: false,
                    });
                  });

                  res.json(
                    helper.showSuccessResponse("DATA_SUCCESS", CityTypeResponse)
                  );
                }
              }
            }
          );
        }
      });
    } catch (err) {
      //console.log("err", err);
      return res.json(helper.showInternalServerErrorResponse());
    }
  },

  addUserTrip: async (req, res) => {
    try {
      var data = req.body;

      if (!data.trip_type) {
        return res.json(
          helper.showValidationErrorResponse("TRIP_TYPE_IS_REQUIRED")
        );
      }

      if (!data.rideType) {
        return res.json(
          helper.showValidationErrorResponse("RIDE_TYPE_IS_REQUIRED")
        );
      }

      if (!data.prefDriver) {
        return res.json(
          helper.showValidationErrorResponse("PREF_DRIVER_IS_REQUIRED")
        );
      }

      if (!data.bookFor) {
        return res.json(
          helper.showValidationErrorResponse("BOOK_FOR_IS_REQUIRED")
        );
      }

      if (data.rideType === "child") {
        if (data.description) {
          data.description = data.description;
        } else {
          data.description = null;
        }
      } else {
        data.description = null;
      }

      if (data.trip_type === "instant" && data.prefDriver === "none") {
        //console.log("Instant trip type");
        module.exports.addUserTripInstant(data, req, (response) => {
          res.json(response);
        });
      } else if (data.trip_type === "schedule") {
        //console.log("Schedule trip type");
        module.exports.addUserScheduleTrip(data, req, (response) => {
          res.json(response);
        });
      } else if (data.trip_type === "ridehailing") {
        //console.log("Ride Hailing");
        module.exports.addTripByDriver(data, req, (response) => {
          res.json(response);
        });
      } else if (
        data.trip_type === "instant" &&
        data.prefDriver != undefined &&
        data.prefDriver != "" &&
        data.prefDriver != "none"
      ) {
        //console.log("pref driver type");
        module.exports.addUserPrefTrip(data, req, (response) => {
          res.json(response);
        });
      } else if (data.trip_type === "pool") {
        console.log("pool trip type");
        module.exports.addUserPoolTrip(data, req, (response) => {
          res.json(response);
        });
      } else {
        return res.json(
          helper.showValidationErrorResponse("INVALID_TRIP_TYPE")
        );
      }
    } catch (error) {
      //console.log("err", error);
      return res.json(helper.showInternalServerErrorResponse());
    }
  },

  addUserTripInstant: async (data, headerData, responseCallback) => {
    //console.log("Data",data);
    try {
      var paramsList = [
        { name: "country", type: "string" },
        { name: "countryCode", type: "string" },
        { name: "state", type: "string" },
        { name: "stateCode", type: "string" },
        { name: "city", type: "string" },
        { name: "cityCode", type: "string" },
        { name: "pricingType", type: "string" },
        { name: "isSurgeTime", type: "string" },
        { name: "surgeMultiplier", type: "number" },
        { name: "unit", type: "string" },
        { name: "estimatedCost", type: "number" },
        { name: "carTypeRequired", type: "string" },
        { name: "distance", type: "number" },
        { name: "estimatedTime", type: "number" },
        { name: "source", type: "object" },
        { name: "destination", type: "object" },
        { name: "paymentMethod", type: "string" },
        { name: "paymentSourceRefNo", type: "string" },
      ];

      helper.checkRequestParams(data, paramsList, async (response) => {
        if (response.status) {
          var verifydata = await Auth.validateCustomer(headerData);

          if (verifydata == null) {
            responseCallback(
              helper.showUnathorizedErrorResponse("NOT_AUTHORIZED")
            );
          }

          if (!data.source) {
            responseCallback(
              helper.showValidationErrorResponse("SOURCE_LOCATION_IS_REQUIRED")
            );
          }

          if (!data.destination) {
            responseCallback(
              helper.showValidationErrorResponse(
                "DESTINATION_LOCATION_IS_REQUIRED"
              )
            );
          }

          if (!data.distance) {
            responseCallback(
              helper.showValidationErrorResponse("DISTANCE_IS_REQUIRED")
            );
          }

          if (!data.estimatedTime) {
            responseCallback(
              helper.showValidationErrorResponse("ESTIMATED_TIME_IS_REQUIRED")
            );
          }

          if (!data.paymentMethod) {
            responseCallback(
              helper.showValidationErrorResponse("PAYMENT_METHOD_IS_REQUIRED")
            );
          }

          if (!data.estimatedCost) {
            responseCallback(
              helper.showValidationErrorResponse("ESTIMATED_COST_IS_REQUIRED")
            );
          }

          if (!data.scheduleTimezone) {
            responseCallback(
              helper.showValidationErrorResponse("TIMEZONE_IS_REQUIRED")
            );
          }

          var a = helper.getCurrentDateAndTimeInCityTimezoneFromUTC(
            data.scheduleTimezone
          );
          data.readableDate = a.format("LLLL");
          data.scheduleTime = a.format("LT"); //08:30 PM
          data.scheduleDate = a.format("L"); //04/09/1986

          if (!data.carTypeRequired) {
            responseCallback(
              helper.showValidationErrorResponse("CARTYPE_IS_REQUIRED")
            );
          }

          if (!data.paymentSourceRefNo) {
            responseCallback(
              helper.showValidationErrorResponse("PAYMENT_IS_REQUIRED")
            );
          }

          if (data.paymentMethod === "stripe") {
            var getCard = await POs.getPObyId(data.paymentSourceRefNo);

            if (getCard == null) {
              responseCallback(
                helper.showValidationErrorResponse("INVALID_PAYMENT_OPTIONS")
              );
            }
          }

          data.startLocationAddr = data.source.startLocationAddr;
          data.endLocationAddr = data.destination.endLocationAddr;

          var endLocation = {
            type: "Point",
            coordinates: [
              data.destination.endLocation.lng,
              data.destination.endLocation.lat,
            ],
          };
          var startLocation = {
            type: "Point",
            coordinates: [
              data.source.startLocation.lng,
              data.source.startLocation.lat,
            ],
          };
          data.endLocation = endLocation;
          data.startLocation = startLocation;
          data.customerId = verifydata._id;
          data.customerNumber = verifydata.mobileNumber;
          data.countryCode = verifydata.countryCode;
          data.customerName = verifydata.name;
          data.userPendingBalance = verifydata.userPendingBalance;
          data.customerAvgRating = verifydata.customerAvgRating; // pick it from verify customer

          if (data.pricingType === "global") {
            var getCartype = await CarTypes.getCarsTypesByIdAsync(
              data.carTypeRequired
            );

            data.carTypeRequired = getCartype;
            data.carTypeId = getCartype._id.toString();
          } else if (data.pricingType === "city") {
            var getCartype = await CityType.getCityTypeByIdAsync(
              data.carTypeRequired
            );
            getCartype.carType = getCartype.carTypeDetails.carType;
            getCartype.carImage = getCartype.carTypeDetails.carImage;

            data.carTypeRequired = getCartype;
            data.carTypeId = getCartype.carTypeId.toString();
          }

          if (
            data.promoCode != undefined &&
            data.promoCode != "" &&
            data.promoCode != "none"
          ) {
            data.promoCode = data.promoCode;
          } else {
            data.promoCode = "none";
          }

          var nearByData = {
            startPoint: data.startLocation,
            radius: Number(basicSetting.App_Settings.Default_Search_Radius), // in meters
            query: {
              driverStatus: constant.DRIVER_FINDING_TRIPS.toString(),
              selectedCarTypeId: data.carTypeId.toString(),
              status: "approved",
              isRequestSend: "no",
            },
          };

          var results = await Driver.getNearByDrivers(nearByData);

          var nearByTempDrivers = [];

          if (results.length > 0) {
            results.forEach((element) => {
              nearByTempDrivers.push(element._id);
            });

            data.nearByTempDrivers = nearByTempDrivers;
            data.isDriverFound = "yes";
          } else {
            data.nearByTempDrivers = [];
            data.isDriverFound = "no";
          }

          Trips.addTripInstant(data, async (err, datad) => {
            if (err) {
              responseCallback(
                helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err)
              );
            } else {
              responseCallback(
                helper.showSuccessResponse("RESPONSE_SUCCESS", {
                  isDriverFound: datad.isDriverFound,
                  tripId: datad._id,
                  trip_type: datad.trip_type,
                })
              );

              //console.log("Trip Request Created : " + datad._id + " By Customer: " + datad.customerId + " isDriverFound:" + datad.isDriverFound);

              //add trip to customer table as ref with currentTripId
              var Cdata = {
                customerId: datad.customerId,
                ref: datad._id,
              };
              User.AddRefToTrip(Cdata);

              //send request to all nearby drivers
              if (datad.isDriverFound === "yes") {
                module.exports.sendRequestToNearByDrivers(
                  datad.nearByTempDrivers,
                  datad.customerName,
                  datad._id,
                  data.startLocation,
                  data.endLocation
                );
              }
            }
          });
        } else {
          responseCallback(helper.showParamsErrorResponse(response.message));
        }
      });
    } catch (err) {
      responseCallback(
        helper.showInternalServerErrorResponse("INTERNAL_SERVER_ERROR")
      );
    }
  },

  sendRequestToNearByDrivers: async (
    nearByTempDrivers,
    customerName,
    tripId,
    startLocation,
    endLocation
  ) => {
    //update driver tripRequestTime and isRequestSend status and isTripAccepted status
    await Driver.updateMany(
      { _id: { $in: nearByTempDrivers } },
      {
        $set: {
          isRequestSend: "yes",
          isTripAccepted: "no",
          currentTripId: tripId,
          tripRequestTime: new Date(),
        },
      }
    );

    //get drivers firebaseToken and socketId to send push notification and emit socket
    Driver.getDriversByIds(nearByTempDrivers, (err, driversList) => {
      driversList.forEach((dresponse) => {
        firstPoint = startLocation;
        endPoint = endLocation;
        var point = {
          lat: startLocation.coordinates[1],
          lng: startLocation.coordinates[0],
        };
        var lineStart = {
          lat: firstPoint.coordinates[1],
          lng: firstPoint.coordinates[0],
        };
        var lineEnd = {
          lat: endPoint.coordinates[1],
          lng: endPoint.coordinates[0],
        };
        var centerPoint = {
          lat: dresponse.driverLocation.coordinates[1],
          lng: dresponse.driverLocation.coordinates[0],
        };

        var checkLocation = helper.checkLocationExitsBetweenSourceDestination(
          point,
          lineStart,
          lineEnd
        );
        console.log("checkLocation", checkLocation);
        var checkPoint = helper.checkLocationBetweenRadius(point, centerPoint);
        console.log("checkPoint", checkPoint);

        if (dresponse.isEndOfDayTrip && dresponse.isEndOfDayTrip === "yes") {
          if (checkLocation || checkPoint) {
            if (
              dresponse.firebaseToken != undefined &&
              dresponse.firebaseToken != "" &&
              dresponse.firebaseToken != null &&
              dresponse.firebaseToken != "none"
            ) {
              var title = __("TRIP_REQUEST_SUCCESS");
              var body = "Trip Request From :" + customerName;
              var registrationToken = dresponse.firebaseToken;
              helper.sendPushNotificationDriver(title, body, registrationToken);
              var sdata = {
                receivedRequest: 1,
                driverId: dresponse._id,
                tripId: tripId,
              };

              stats.addRequestRec(sdata);
            }

            //emit socket if driver is connected to socket

            if (dresponse.socketStatus === "no") {
              var tripRequestSocketData = {
                success: true,
                tripId: tripId,
                tripStatus: constant.DRIVER_FINDING_TRIPS,
                driverStatus: dresponse.driverStatus,
                driverLocation: dresponse.driverLocation,
                angle: 0,
                isNewRequest: "yes",
                isTripAccepted: "no",
              };

              helper.emitDriverSocket(
                dresponse.socketId,
                tripRequestSocketData
              );
            }
          }
        } else {
          if (
            dresponse.firebaseToken != undefined &&
            dresponse.firebaseToken != "" &&
            dresponse.firebaseToken != null &&
            dresponse.firebaseToken != "none"
          ) {
            var title = __("TRIP_REQUEST_SUCCESS");
            var body = "Trip Request From :" + customerName;
            var registrationToken = dresponse.firebaseToken;
            helper.sendPushNotificationDriver(title, body, registrationToken);
            var sdata = {
              receivedRequest: 1,
              driverId: dresponse._id,
              tripId: tripId,
            };

            stats.addRequestRec(sdata);
          }

          //emit socket if driver is connected to socket

          if (dresponse.socketStatus === "no") {
            var tripRequestSocketData = {
              success: true,
              tripId: tripId,
              tripStatus: constant.DRIVER_FINDING_TRIPS,
              driverStatus: dresponse.driverStatus,
              driverLocation: dresponse.driverLocation,
              angle: 0,
              isNewRequest: "yes",
              isTripAccepted: "no",
            };

            helper.emitDriverSocket(dresponse.socketId, tripRequestSocketData);
          }
        }
      });
    });

    setTimeout(async function () {
      await Driver.updateMany(
        { _id: { $in: nearByTempDrivers } },
        { $set: { isRequestSend: "no" } }
      );
    }, 32000);
  },

  assignedAutoPoolTripRequest: async (
    nearByTempDrivers,
    startLocation,
    noOfSeats,
    maxPersons,
    customerName,
    tripId
  ) => {
    console.log("in assigned!!1", nearByTempDrivers);
    //get drivers firebaseToken and socketId to send push notification and emit socket
    Driver.getDriversByIdsPool(nearByTempDrivers, async (err, dresponse) => {
      if (dresponse.length > 0) {
        // console.log("in d length");
        var verifydata = dresponse[0];
        //isPointInLine(point, lineStart, lineEnd);
        var getDriverTrips = await Trips.getDriverCurrentPoolTrips(
          verifydata._id
        );

        if (getDriverTrips.length > 0) {
          var bookedSeat = 0;
          var firstPoint = "";
          var endPoint = "";

          getDriverTrips.forEach((element) => {
            //calculate noOfSeats booked!!!
            bookedSeat = bookedSeat + element.noOfSeats;

            //if driver first pool trip get points.
            if (element.isFirstPoolTrip === "yes") {
              firstPoint = element.startLocation;
              endPoint = element.endLocation;
            }
          });

          //check  current point lies between first pool trip or not
          var point = {
            lat: startLocation.coordinates[1],
            lng: startLocation.coordinates[0],
          };
          var lineStart = {
            lat: firstPoint.coordinates[1],
            lng: firstPoint.coordinates[0],
          };
          var lineEnd = {
            lat: endPoint.coordinates[1],
            lng: endPoint.coordinates[0],
          };
          var centerPoint = {
            lat: verifydata.driverLocation.coordinates[1],
            lng: verifydata.driverLocation.coordinates[0],
          };

          var checkLocation = helper.checkLocationExitsBetweenSourceDestination(
            point,
            lineStart,
            lineEnd
          );
          console.log("checkLocation", checkLocation);
          var checkPoint = helper.checkLocationBetweenRadius(
            point,
            centerPoint
          );
          console.log("checkPoint", checkPoint);

          //get available seats
          var availableSeats = maxPersons - bookedSeat;
          console.log("availableSeats", availableSeats);
          console.log("noOfSeats", noOfSeats);

          if ((checkLocation || checkPoint) && noOfSeats <= availableSeats) {
            //assigned auto request to driver
            console.log("Auto assigned driversuccess!");

            var data = {};
            data.tripId = tripId;
            data.driverLocation = verifydata.driverLocation;
            data.driverImage = verifydata.profileImage;
            data.driverId = verifydata._id;
            data.driveremail = verifydata.email;
            data.driverNumber = verifydata.mobileNumber;
            data.driverName = verifydata.name;
            data.driverAvgRtaing = verifydata.avgRating;
            data.tripsCompleted = verifydata.tripsCompleted;
            data.overallPendingBalance = verifydata.overallPendingBalance;
            data.overallCashBalance = verifydata.overallCashBalance;
            data.driverSelectedCar = verifydata.selectedCar;
            data.tripOTP = Math.floor(Math.random() * (10000 - 1000)) + 1000;

            Trips.ConfirmTripDriver(data, async (err, dresponse) => {
              if (err) {
                console.log("error in confirm pool trip by driver", err);
                //res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
              } else {
                if (verifydata.socketStatus === "no") {
                  var finalTripId = await helper.sortDriverPoolTrips(
                    data.driverId,
                    data.driverLocation
                  );
                  //console.log("Sending notification");
                  let tripdata = {
                    tripId: finalTripId,
                    //tripStatus: constant.TRIP_CANCELLED,
                    driverLocation: verifydata.driverLocation,
                    driverStatus: verifydata.driverStatus,
                    success: true,
                  };

                  helper.emitDriverSocket(verifydata.socketId, tripdata);
                }

                //send push notification to driver
                if (
                  verifydata.firebaseToken != undefined &&
                  verifydata.firebaseToken != "" &&
                  verifydata.firebaseToken != null &&
                  verifydata.firebaseToken != "none"
                ) {
                  var title = __("POOTRIP_ASSIGNED_SUCCESS");
                  var body = "You have assigned another trip!";
                  var registrationToken = verifydata.firebaseToken;
                  helper.sendPushNotificationDriver(
                    title,
                    body,
                    registrationToken
                  );
                }

                //update driver stats
                var stat = {
                  accepted: 1,
                  driverId: dresponse.driverId,
                };

                stats.addAccepted(stat);

                //send notification to customer and update customer status
                User.waitingForCab(
                  { customerId: dresponse.customerId },
                  (err, cresponse) => {
                    if (cresponse.socketStatus === "no") {
                      let tripRequestSocketDataC = {
                        tripId: dresponse._id,
                        //tripStatus: constant.TRIP_CANCELLED,
                        driverLocation: verifydata.driverLocation,
                        driverStatus: verifydata.driverStatus,
                        success: true,
                      };

                      helper.emitCustomerSocket(
                        cresponse.socketId,
                        tripRequestSocketDataC
                      );
                    }

                    if (
                      cresponse.firebaseToken != undefined &&
                      cresponse.firebaseToken != "" &&
                      cresponse.firebaseToken != null &&
                      cresponse.firebaseToken != "none"
                    ) {
                      var title = __("TRIP_CONFIRMED_SUCCESS");
                      var body = dresponse.driverName + " is on his way!";
                      var registrationToken = cresponse.firebaseToken;
                      helper.sendPushNotificationCustomer(
                        title,
                        body,
                        registrationToken
                      );
                    }
                  }
                );
              }
            });
          }
        }
      }
    });
  },

  addUserScheduleTrip: async (data, headerData, responseCallback) => {
    console.log("App Schedule trip", data);

    try {
      var paramsList = [
        { name: "country", type: "string" },
        { name: "countryCode", type: "string" },
        { name: "state", type: "string" },
        { name: "stateCode", type: "string" },
        { name: "city", type: "string" },
        { name: "cityCode", type: "string" },
        { name: "pricingType", type: "string" },
        { name: "isSurgeTime", type: "string" },
        { name: "surgeMultiplier", type: "number" },
        { name: "unit", type: "string" },
        { name: "estimatedCost", type: "number" },
        { name: "carTypeRequired", type: "string" },
        { name: "distance", type: "number" },
        { name: "estimatedTime", type: "number" },
        { name: "source", type: "object" },
        { name: "destination", type: "object" },
        { name: "paymentMethod", type: "string" },
        { name: "paymentSourceRefNo", type: "string" },
        { name: "scheduleTimezone", type: "string" },
        { name: "scheduleDate", type: "string" },
        { name: "scheduleTime", type: "string" },
      ];

      //console.log("data schedule", data);

      helper.checkRequestParams(data, paramsList, async (response) => {
        if (response.status) {
          var verifydata = await Auth.validateCustomer(headerData);

          if (verifydata == null) {
            responseCallback(
              helper.showUnathorizedErrorResponse("NOT_AUTHORIZED")
            );
          }

          if (!data.source) {
            responseCallback(
              helper.showValidationErrorResponse("SOURCE_LOCATION_IS_REQUIRED")
            );
          }

          if (!data.destination) {
            responseCallback(
              helper.showValidationErrorResponse(
                "DESTINATION_LOCATION_IS_REQUIRED"
              )
            );
          }

          if (!data.distance) {
            responseCallback(
              helper.showValidationErrorResponse("DISTANCE_IS_REQUIRED")
            );
          }

          if (!data.estimatedTime) {
            responseCallback(
              helper.showValidationErrorResponse("ESTIMATED_TIME_IS_REQUIRED")
            );
          }

          if (!data.paymentMethod) {
            responseCallback(
              helper.showValidationErrorResponse("PAYMENT_METHOD_IS_REQUIRED")
            );
          }

          if (!data.estimatedCost) {
            responseCallback(
              helper.showValidationErrorResponse("ESTIMATED_COST_IS_REQUIRED")
            );
          }

          if (!data.scheduleTimezone) {
            responseCallback(
              helper.showValidationErrorResponse("TIMEZONE_IS_REQUIRED")
            );
          }

          if (!data.carTypeRequired) {
            responseCallback(
              helper.showValidationErrorResponse("CARTYPE_IS_REQUIRED")
            );
          }

          if (!data.paymentSourceRefNo) {
            responseCallback(
              helper.showValidationErrorResponse("PAYMENT_IS_REQUIRED")
            );
          }

          if (data.paymentMethod === "stripe") {
            var getCard = await POs.getPObyId(data.paymentSourceRefNo);

            if (getCard == null) {
              responseCallback(
                helper.showValidationErrorResponse("INVALID_PAYMENT_OPTIONS")
              );
            }
          }

          if (!data.scheduleDate) {
            responseCallback(
              helper.showValidationErrorResponse("SCHEDULE_DATE_IS_REQUIRED")
            );
          }

          if (!data.scheduleTime) {
            responseCallback(
              helper.showValidationErrorResponse("SCHEDULE_TIME_IS_REQUIRED")
            );
          }

          if (!helper.isValidDate(data.scheduleDate, "DD-MM-YYYY")) {
            responseCallback(
              helper.showValidationErrorResponse("CORRECT_DATE_FORMAT")
            );
          }

          data.startLocationAddr = data.source.startLocationAddr;
          data.endLocationAddr = data.destination.endLocationAddr;

          var endLocation = {
            type: "Point",
            coordinates: [
              data.destination.endLocation.lng,
              data.destination.endLocation.lat,
            ],
          };
          var startLocation = {
            type: "Point",
            coordinates: [
              data.source.startLocation.lng,
              data.source.startLocation.lat,
            ],
          };
          data.endLocation = endLocation;
          data.startLocation = startLocation;
          data.customerId = verifydata._id.toString();
          data.customerNumber = verifydata.mobileNumber;
          data.countryCode = verifydata.countryCode;
          data.customerName = verifydata.name;
          data.userPendingBalance = verifydata.userPendingBalance;
          data.cost = data.estimatedCost;
          data.customerAvgRating = verifydata.customerAvgRating; // pick it from verify customer

          if (data.pricingType === "global") {
            var getCartype = await CarTypes.getCarsTypesByIdAsync(
              data.carTypeRequired
            );
            //getCartype.carTypeId = getCartype._id.toString();
            getCartype.set("carTypeId", getCartype._id.toString(), {
              strict: false,
            });

            data.carTypeRequired = getCartype;
          } else if (data.pricingType === "city") {
            var getCartype = await CityType.getCityTypeByIdAsync(
              data.carTypeRequired
            );
            getCartype.carType = getCartype.carTypeDetails.carType;
            getCartype.carImage = getCartype.carTypeDetails.carImage;

            data.carTypeRequired = getCartype;
          }

          var split = data.scheduleDate.split("-");
          var split2 = data.scheduleTime.split(":");
          var ds =
            split[2] +
            "-" +
            split[1] +
            "-" +
            split[0] +
            " " +
            split2[0] +
            ":" +
            split2[1];

          var a = helper.getDateAndTimeInCityTimezone(
            ds,
            data.scheduleTimezone
          );
          data.readableDate = a.format("LLLL");
          data.scheduleTime = a.format("LT"); //08:30 PM
          data.scheduleDate = a.format("L"); //04/09/1986

          var b = new Date(a.utc().format());
          var mdate = helper.getCurrentDateAndTimeInCityTimezoneFromUTC(
            data.scheduleTimezone
          );

          var c = new Date(mdate.utc().format());
          var resultInMinutes = helper.getTimeDifferenceInMinute(b, c);

          data.scheduleCompare = b;
          data.scheduledAt = b;
          var thdate = b.setMinutes(b.getMinutes() - 15);
          var cd = new Date(thdate);

          if (
            data.promoCode != undefined &&
            data.promoCode != "" &&
            data.promoCode != "none"
          ) {
            data.promoCode = data.promoCode;
          } else {
            data.promoCode = "none";
          }

          //console.log("sc  data", data);

          if (resultInMinutes < 31) {
            responseCallback(
              helper.showValidationErrorResponse("BOOKING_NOT_ALLOWED")
            );
          } else {
            Trips.addScheduleTrip(data, async (err, datad) => {
              if (err) {
                //console.log("db error0", err);
                responseCallback(
                  helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err)
                );
              } else {
                responseCallback(
                  helper.showSuccessResponse("RIDE_SCHEDULED_SUCCESS", datad)
                );
                //console.log("add trip ye trip wala data hai3", datad);
                var Cdata = {
                  customerId: datad.customerId,
                  ref: datad._id,
                };
                // purify data
                User.AddRefToTrip(Cdata);

                agenda
                  .schedule(
                    cd, // accepts Date or string
                    "archive ride", // the name of the task as defined in archive-ride.js
                    { rideId: datad._id } // passing in additional data accessible with: job.attrs.data.rideId
                  )
                  .then(() => {
                    // console.log("ho gaya add main")
                  });

                User.findCSocketCallback(datad.customerId, (err, cresponse) => {
                  if (err || cresponse == null) {
                    //console.log("socket customer error", err);
                  } else {
                    // if (cresponse.offline === "no") {
                    //     helper.emitCustomerSocket(cresponse.socketId, datad);
                    // }

                    if (
                      cresponse.firebaseToken != undefined &&
                      cresponse.firebaseToken != "" &&
                      cresponse.firebaseToken != null &&
                      cresponse.firebaseToken != "none"
                    ) {
                      var title = __("TRIP_SCHEDULE_SUCCESS");
                      var body =
                        "Your Trip Has Been Scheduled At: " +
                        datad.readableDate;
                      var registrationToken = cresponse.firebaseToken;
                      helper.sendPushNotificationCustomer(
                        title,
                        body,
                        registrationToken
                      );
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
    } catch (err) {
      responseCallback(
        helper.showInternalServerErrorResponse("INTERNAL_SERVER_ERROR")
      );
    }
  },

  addUserPoolTrip: async (data, headerData, responseCallback) => {
    try {
      var paramsList = [
        { name: "country", type: "string" },
        { name: "countryCode", type: "string" },
        { name: "state", type: "string" },
        { name: "stateCode", type: "string" },
        { name: "city", type: "string" },
        { name: "cityCode", type: "string" },
        { name: "pricingType", type: "string" },
        { name: "isSurgeTime", type: "string" },
        { name: "surgeMultiplier", type: "number" },
        { name: "unit", type: "string" },
        { name: "estimatedCost", type: "number" },
        { name: "noOfSeats", type: "number" },
        { name: "carTypeRequired", type: "string" },
        { name: "distance", type: "number" },
        { name: "estimatedTime", type: "number" },
        { name: "source", type: "object" },
        { name: "destination", type: "object" },
        { name: "paymentMethod", type: "string" },
        { name: "paymentSourceRefNo", type: "string" },
      ];

      helper.checkRequestParams(data, paramsList, async (response) => {
        if (response.status) {
          var verifydata = await Auth.validateCustomer(headerData);

          if (verifydata == null) {
            responseCallback(
              helper.showUnathorizedErrorResponse("NOT_AUTHORIZED")
            );
          }

          if (!data.source) {
            responseCallback(
              helper.showValidationErrorResponse("SOURCE_LOCATION_IS_REQUIRED")
            );
          }

          if (!data.destination) {
            responseCallback(
              helper.showValidationErrorResponse(
                "DESTINATION_LOCATION_IS_REQUIRED"
              )
            );
          }

          if (!data.distance) {
            responseCallback(
              helper.showValidationErrorResponse("DISTANCE_IS_REQUIRED")
            );
          }

          if (!data.estimatedTime) {
            responseCallback(
              helper.showValidationErrorResponse("ESTIMATED_TIME_IS_REQUIRED")
            );
          }

          if (!data.estimatedCost) {
            responseCallback(
              helper.showValidationErrorResponse("ESTIMATED_COST_IS_REQUIRED")
            );
          }

          if (!data.paymentMethod) {
            responseCallback(
              helper.showValidationErrorResponse("PAYMENT_METHOD_IS_REQUIRED")
            );
          }

          if (!data.noOfSeats) {
            responseCallback(
              helper.showValidationErrorResponse("NO_OF_SEATS_IS_REQUIRED")
            );
          }

          if (!data.scheduleTimezone) {
            responseCallback(
              helper.showValidationErrorResponse("TIMEZONE_IS_REQUIRED")
            );
          }

          if (!data.carTypeRequired) {
            responseCallback(
              helper.showValidationErrorResponse("CARTYPE_IS_REQUIRED")
            );
          }

          if (!data.paymentSourceRefNo) {
            responseCallback(
              helper.showValidationErrorResponse("PAYMENT_IS_REQUIRED")
            );
          }

          if (data.paymentMethod === "stripe") {
            var getCard = await POs.getPObyId(data.paymentSourceRefNo);

            if (getCard == null) {
              responseCallback(
                helper.showValidationErrorResponse("INVALID_PAYMENT_OPTIONS")
              );
            }
          }

          data.startLocationAddr = data.source.startLocationAddr;
          data.endLocationAddr = data.destination.endLocationAddr;

          var endLocation = {
            type: "Point",
            coordinates: [
              data.destination.endLocation.lng,
              data.destination.endLocation.lat,
            ],
          };
          var startLocation = {
            type: "Point",
            coordinates: [
              data.source.startLocation.lng,
              data.source.startLocation.lat,
            ],
          };
          data.endLocation = endLocation;
          data.startLocation = startLocation;
          data.customerId = verifydata._id;
          data.customerNumber = verifydata.mobileNumber;
          data.countryCode = verifydata.countryCode;
          data.customerName = verifydata.name;
          data.userPendingBalance = verifydata.userPendingBalance;
          data.customerAvgRating = verifydata.customerAvgRating; // pick it from verify customer

          if (data.pricingType === "global") {
            var getCartype = await CarTypes.getCarsTypesByIdAsync(
              data.carTypeRequired
            );
            data.carTypeId = getCartype._id.toString();

            data.carTypeRequired = getCartype;
          } else if (data.pricingType === "city") {
            var getCartype = await CityType.getCityTypeByIdAsync(
              data.carTypeRequired
            );
            getCartype.carType = getCartype.carTypeDetails.carType;
            getCartype.carImage = getCartype.carTypeDetails.carImage;

            data.carTypeRequired = getCartype;
            data.carTypeId = getCartype.carTypeId.toString();
          }

          if (
            data.promoCode != undefined &&
            data.promoCode != "" &&
            data.promoCode != "none"
          ) {
            data.promoCode = data.promoCode;
          } else {
            data.promoCode = "none";
          }

          var nearByData = {
            startPoint: data.startLocation,
            radius: Number(basicSetting.App_Settings.Default_Search_Radius), // in meters
            query: {
              driverStatus: { $in: [constant.DRIVER_POOL_TRIPS] },
              selectedCarTypeId: data.carTypeId.toString(),
              status: "approved",
              isRequestSend: "no",
              isNoMoreAcceptPoolTrip: "no",
            },
          };

          var results = await Driver.getNearByPoolDrivers(nearByData);

          var nearByTempDrivers = [];

          if (results.length > 0) {
            results.forEach((element) => {
              nearByTempDrivers.push(element._id);
            });

            data.nearByTempDrivers = nearByTempDrivers;
            data.isDriverFound = "yes";
          } else {
            data.nearByTempDrivers = [];
            data.isDriverFound = "no";
          }

          Trips.addTripInstantPOOL(data, async (err, datad) => {
            if (err) {
              responseCallback(
                helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err)
              );
            } else {
              console.log(
                "Trip Request Created pool : " +
                  datad._id +
                  " By Customer: " +
                  datad.customerId +
                  " isDriverFound:" +
                  datad.isDriverFound
              );

              //add trip to customer table as ref with currentTripId
              var Cdata = {
                customerId: datad.customerId,
                ref: datad._id,
              };

              User.AddRefToTrip(Cdata);

              //send request to all nearby drivers
              if (datad.isDriverFound === "yes") {
                responseCallback(
                  helper.showSuccessResponse("RESPONSE_SUCCESS", {
                    isDriverFound: datad.isDriverFound,
                    tripId: datad._id,
                    trip_type: "pool",
                  })
                );
                module.exports.assignedAutoPoolTripRequest(
                  datad.nearByTempDrivers,
                  datad.startLocation,
                  datad.noOfSeats,
                  datad.carTypeRequired.maxPersons,
                  datad.customerName,
                  datad._id
                );
              } else {
                //console.log("Pool trip in all request!!!");

                var nearByData2 = {
                  startPoint: data.startLocation,
                  radius: Number(
                    basicSetting.App_Settings.Default_Search_Radius
                  ), // in meters
                  query: {
                    driverStatus: constant.DRIVER_FINDING_TRIPS.toString(),
                    selectedCarTypeId: data.carTypeId.toString(),
                    status: "approved",
                    isRequestSend: "no",
                  },
                };

                //console.log("nearByData2", nearByData2);

                var results2 = await Driver.getNearByDrivers(nearByData2);

                //console.log("results2", results2);

                var nearByTempDrivers2 = [];
                var pdata = {};

                if (results2.length > 0) {
                  results2.forEach((element) => {
                    nearByTempDrivers2.push(element._id);
                  });

                  pdata.nearByTempDrivers2 = nearByTempDrivers2;
                  pdata.isDriverFound = "yes";
                } else {
                  pdata.nearByTempDrivers2 = [];
                  pdata.isDriverFound = "no";
                }

                responseCallback(
                  helper.showSuccessResponse("RESPONSE_SUCCESS", {
                    isDriverFound: pdata.isDriverFound,
                    tripId: datad._id,
                    trip_type: "pool",
                  })
                );

                //send request to all nearby drivers
                if (pdata.isDriverFound === "yes") {
                  module.exports.sendRequestToNearByDrivers(
                    pdata.nearByTempDrivers2,
                    datad.customerName,
                    datad._id
                  );
                }
              }
            }
          });
        } else {
          responseCallback(helper.showParamsErrorResponse(response.message));
        }
      });
    } catch (err) {
      console.log("err", err);
      responseCallback(
        helper.showInternalServerErrorResponse("INTERNAL_SERVER_ERROR")
      );
    }
  },

  getCustomerAllTrips: async (req, res) => {
    try {
      var verifydata = await Auth.validateCustomer(req);

      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse("NOT_AUTHORIZED"));
      }

      let [getUpcomigBooking, getPastBooking] = await Promise.all([
        Trips.getCustomerUpcomingTripsAsync({ customerId: verifydata._id }),
        Trips.getCustomerPastTripsASync({ customerId: verifydata._id }),
      ]);

      var resdata = {
        upcomingBooking: getUpcomigBooking,
        pastBooking: getPastBooking,
      };

      res.json(helper.showSuccessResponse("DATA_SUCCESS", resdata));
    } catch (error) {
      res.json(helper.showInternalServerErrorResponse("INTERNAL_SERVER_ERROR"));
    }
  },

  getCustomerPastTrips: async (req, res) => {
    try {
      var verifydata = await Auth.validateCustomer(req);

      if (verifydata == null) {
        res.json(helper.showUnathorizedErrorResponse("NOT_AUTHORIZED"));
      }

      Trips.getCustomerPastTrips(verifydata, async (err, resdata) => {
        if (err) {
          res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
        } else {
          if (resdata.length === 0) {
            res.json(helper.showSuccessResponse("NO_DATA_FOUND", []));
          } else {
            res.json(helper.showSuccessResponse("DATA_SUCCESS", resdata));
          }
        }
      });
    } catch (err) {
      res.json(helper.showInternalServerErrorResponse("INTERNAL_SERVER_ERROR"));
    }
  },

  getCustomerUpcomingTrips: async (req, res) => {
    try {
      var verifydata = await Auth.validateCustomer(headerData);

      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse("NOT_AUTHORIZED"));
      }

      Trips.getCustomerUpcomingTrips(verifydata, async (err, resdata) => {
        if (err) {
          res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
        } else {
          if (resdata.length === 0) {
            res.json(helper.showSuccessResponse("NO_DATA_FOUND", []));
          } else {
            res.json(helper.showSuccessResponse("DATA_SUCCESS", resdata));
          }
        }
      });
    } catch (err) {
      res.json(helper.showInternalServerErrorResponse("INTERNAL_SERVER_ERROR"));
    }
  },

  aacceptTripByDriver: async (req, res) => {
    try {
      var data = req.body;
      var verifydata = await Auth.validateDriver(req);
      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse("NOT_AUTHORIZED"));
      }
      if (!data.tripId) {
        return res.json(
          helper.showValidationErrorResponse("TRIP_ID_IS_REQUIRED")
        );
      }
      var mytrip = await Trips.getTripDetailsById(data.tripId);
      if (mytrip == null) {
        return res.json(helper.showValidationErrorResponse("INVALID_TRIP_ID"));
      }

      if (
        mytrip.tripStatus === constant.TRIP_ON_TRIP ||
        mytrip.tripStatus === constant.TRIP_PICKUP_INROUTE ||
        mytrip.tripStatus === constant.TRIP_COMPLETED
      ) {
        return res.json(
          helper.showValidationErrorResponse("TRIP_ALREADY_ALLOTED")
        );
      }

      data.driverLocation = verifydata.driverLocation;
      data.driverImage = verifydata.profileImage;
      data.driverId = verifydata._id;
      data.driveremail = verifydata.email;
      data.driverNumber = verifydata.mobileNumber;
      data.driverName = verifydata.name;
      data.driverAvgRtaing = verifydata.avgRating;
      data.tripsCompleted = verifydata.tripsCompleted;
      data.overallPendingBalance = verifydata.overallPendingBalance;
      data.overallCashBalance = verifydata.overallCashBalance;
      data.driverSelectedCar = verifydata.selectedCar;
      data.tripOTP = Math.floor(Math.random() * (10000 - 1000)) + 1000;

      if (mytrip.bookFor !== "personal") {
        let message = `Your OTP for the ride is ${data.tripOTP}`;
        otpVerification.sendOtpSMS(
          mytrip.bookForNumber,
          mytrip.bookForCountryCode,
          message
        );
      }

      if (mytrip.trip_type === "ridenow" || mytrip.trip_type === "ridelater") {
        let message = `Your OTP for the ride is ${data.tripOTP}`;
        otpVerification.sendOtpSMS(
          mytrip.customerNumber,
          verifydata.countryCode,
          message
        );
      }

      if (mytrip.trip_type === "pool") {
        data.isFirstPoolTrip = "yes";
      } else {
        data.isFirstPoolTrip = "no";
      }

      Trips.ConfirmTripDriver(data, async (err, dresponse) => {
        if (err) {
          //console.log("error in confirm trip by driver", err);
          res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
        } else {
          var tripRequestSocketDataC = {
            success: true,
            tripId: dresponse._id,
            tripStatus: constant.TRIP_PICKUP_INROUTE,
            driverLocation: data.driverLocation,
          };

          //update all driver status
          await Driver.updateMany(
            { _id: { $in: dresponse.nearByTempDrivers } },
            { $set: { isRequestSend: "no", isTripAccepted: "yes" } }
          );

          if (dresponse.trip_type === "pool") {
            //console.log("in pooll accept");
            //update driver status
            Driver.updateDriverStatusOnPoolTrip(
              verifydata._id,
              (err, fdresponse) => {
                if (err || fdresponse == null) {
                  console.log("fcm get driver error", err);
                }
              }
            );
          } else {
            //update driver status
            Driver.updateDriverStatusOnPickupInrouteTrip(
              verifydata._id,
              (err, fdresponse) => {
                if (err || fdresponse == null) {
                  //console.log("fcm get driver error", err);
                }
              }
            );
          }

          //send notification to customer and update customer status
          User.waitingForCab(
            { customerId: dresponse.customerId },
            (err, cresponse) => {
              if (cresponse.socketStatus === "no") {
                helper.emitCustomerSocket(
                  cresponse.socketId,
                  tripRequestSocketDataC
                );
              }

              if (
                cresponse.firebaseToken != undefined &&
                cresponse.firebaseToken != "" &&
                cresponse.firebaseToken != null &&
                cresponse.firebaseToken != "none"
              ) {
                var title = __("TRIP_CONFIRMED_SUCCESS");
                var body = dresponse.driverName + " is on his way!";
                var registrationToken = cresponse.firebaseToken;
                helper.sendPushNotificationCustomer(
                  title,
                  body,
                  registrationToken
                );
              }
            }
          );

          res.json(
            helper.showSuccessResponse(
              "TRIP_CONFIRMED_SUCCESS",
              tripRequestSocketDataC
            )
          );

          //var newFilterDrivers = dresponse.nearByTempDrivers.filter(e => e != dresponse.driverId);

          //send push notification to driver
          if (
            verifydata.firebaseToken != undefined &&
            verifydata.firebaseToken != "" &&
            verifydata.firebaseToken != null &&
            verifydata.firebaseToken != "none"
          ) {
            var title = __("TRIP_CONFIRMED_SUCCESS");
            var body = "You are on way to pickup customer!";
            var registrationToken = verifydata.firebaseToken;
            helper.sendPushNotificationDriver(title, body, registrationToken);
          }

          //update driver stats
          var stat = {
            accepted: 1,
            driverId: dresponse.driverId,
          };

          stats.addAccepted(stat);

          //console.log("Trip Id:" + dresponse._id + ", Trip Accepted By Driver" + dresponse.driverId);
        }
      });
    } catch (err) {
      console.log("err", err);
      res.json(helper.showInternalServerErrorResponse("INTERNAL_SERVER_ERROR"));
    }
  },

  driverArrivedAtCustomerLocation: async (req, res) => {
    try {
      var data = req.body; // need tripId
      var verifydata = await Auth.validateDriver(req);

      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse("NOT_AUTHORIZED"));
      }

      if (!data.tripId) {
        return res.json(
          helper.showValidationErrorResponse("TRIP_ID_IS_REQUIRED")
        );
      }

      Trips.driverArrivedAt(data.tripId, (err, dresponse) => {
        if (err) {
          res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
        } else {
          var tripRequestSocketDataC = {
            success: true,
            tripId: dresponse._id,
            driverLocation: verifydata.driverLocation,
            tripStatus: constant.TRIP_ARRIVED,
          };

          res.json(
            helper.showSuccessResponse(
              "TRIP_ARRIVED_SUCCESS",
              tripRequestSocketDataC
            )
          );

          //send push notification to driver
          if (
            verifydata.firebaseToken != undefined &&
            verifydata.firebaseToken != "" &&
            verifydata.firebaseToken != null &&
            verifydata.firebaseToken != "none"
          ) {
            var title = __("TRIP_ARRIVED_SUCCESS");
            var body = "You " + __("TRIP_ARRIVED_SUCCESS");
            var registrationToken = verifydata.firebaseToken;
            helper.sendPushNotificationDriver(title, body, registrationToken);
          }

          //send notificaton to customer
          User.getCustomerFirebaseToken(
            dresponse.customerId,
            (err, cresponse) => {
              if (err || cresponse == null) {
                //console.log("fcm get customer error", err);
              } else {
                if (cresponse.socketStatus === "no") {
                  helper.emitCustomerSocket(
                    cresponse.socketId,
                    tripRequestSocketDataC
                  );
                }

                if (
                  cresponse.firebaseToken != undefined &&
                  cresponse.firebaseToken != "" &&
                  cresponse.firebaseToken != null &&
                  cresponse.firebaseToken != "none"
                ) {
                  var title = __("TRIP_ARRIVED_SUCCESS");
                  var body =
                    dresponse.driverName + " " + __("TRIP_ARRIVED_SUCCESS");
                  var registrationToken = cresponse.firebaseToken;
                  helper.sendPushNotificationCustomer(
                    title,
                    body,
                    registrationToken
                  );
                }
              }
            }
          );

          //console.log("Trip Id:" + dresponse._id + ", Driver Arrived At customer location!");
        }
      });
    } catch (err) {
      //console.log("err", err);
      res.json(helper.showInternalServerErrorResponse("INTERNAL_SERVER_ERROR"));
    }
  },

  tripStartedByDriver: async (req, res) => {
    try {
      var data = req.body;
      var verifydata = await Auth.validateDriver(req);

      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse("NOT_AUTHORIZED"));
      }

      if (!data.tripId) {
        return res.json(
          helper.showValidationErrorResponse("TRIP_ID_IS_REQUIRED")
        );
      }

      if (!data.tripOTP) {
        return res.json(
          helper.showValidationErrorResponse("TRIP_OTP_IS_REQUIRED")
        );
      }

      var OTPconfirm = await Trips.otpConfirm(data.tripId);
      if (OTPconfirm == null) {
        return res.json(helper.showValidationErrorResponse("INVALID_TRIP_ID"));
      }

      if (data.tripOTP != OTPconfirm.tripOTP) {
        return res.json(
          helper.showValidationErrorResponse("ENTER_CORRECT_OTP")
        );
      }

      //check for pref driver
      var prefDat = {
        customerId: OTPconfirm.customerId,
        driverId: verifydata._id,
      };
      var prefD = await User.validatePrefferedDrivers(prefDat);
      //console.log("prefD[0]", prefD);
      var pref = false;
      if (prefD[0].prefferedDriver.length == 0) {
        pref = false;
      } else {
        pref = true;
      }

      data.prefDriver = pref;

      Trips.tripStarted(data, async (err, dresponse) => {
        if (err) {
          //console.log("Trip Start Error", err);
          res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
        } else {
          var tripRequestSocketDataC = {
            success: true,
            tripId: dresponse._id,
            tripStatus: constant.TRIP_DESTINATION_INROUTE,
            prefDriver: dresponse.prefDriver,
            driverLocation: verifydata.driverLocation,
            tripType: dresponse.trip_type,
          };

          //send notificaton to customer
          User.updateCustomerStatusOnTrip(
            dresponse.customerId,
            (err, cresponse) => {
              if (err || cresponse == null) {
                //console.log("fcm get customer error", err);
              } else {
                if (cresponse.socketStatus === "no") {
                  helper.emitCustomerSocket(
                    cresponse.socketId,
                    tripRequestSocketDataC
                  );
                }

                if (
                  cresponse.firebaseToken != undefined &&
                  cresponse.firebaseToken != "" &&
                  cresponse.firebaseToken != null &&
                  cresponse.firebaseToken != "none"
                ) {
                  var title = __("TRIP_STARTED_SUCCESS");
                  var body =
                    "You are on your way. ETA:" +
                    dresponse.estimatedTime +
                    " min.";
                  var registrationToken = cresponse.firebaseToken;
                  helper.sendPushNotificationCustomer(
                    title,
                    body,
                    registrationToken
                  );
                }
              }
            }
          );

          if (dresponse.trip_type === "pool") {
            var finalTripId = await helper.sortDriverPoolTrips(
              verifydata._id,
              verifydata.driverLocation
            );
            var tripRequestSocketDataC = {
              success: true,
              tripId: finalTripId,
              tripStatus: constant.TRIP_DESTINATION_INROUTE,
              prefDriver: dresponse.prefDriver,
              driverLocation: verifydata.driverLocation,
              tripType: dresponse.trip_type,
            };

            res.json(
              helper.showSuccessResponse(
                "TRIP_STARTED_SUCCESS",
                tripRequestSocketDataC
              )
            );
          } else {
            //update driver status
            Driver.updateDriverStatusOnTrip(
              verifydata._id,
              (err, cresponse) => {
                if (err || cresponse == null) {
                  //console.log("fcm get driver error", err);
                }
              }
            );

            res.json(
              helper.showSuccessResponse(
                "TRIP_STARTED_SUCCESS",
                tripRequestSocketDataC
              )
            );
          }

          //send push notification to driver
          if (
            verifydata.firebaseToken != undefined &&
            verifydata.firebaseToken != "" &&
            verifydata.firebaseToken != null &&
            verifydata.firebaseToken != "none"
          ) {
            var title = __("TRIP_STARTED_SUCCESS");
            var body =
              "You are on your way. ETA:" + dresponse.estimatedTime + " min.";
            var registrationToken = verifydata.firebaseToken;
            helper.sendPushNotificationDriver(title, body, registrationToken);
          }

          //console.log("Trip Id:" + dresponse._id + ", Driver Started Trip!");
        }
      });
    } catch (err) {
      //console.log("err", err);
      res.json(helper.showInternalServerErrorResponse("INTERNAL_SERVER_ERROR"));
    }
  },

  tripCompletedAtDestination: async (req, res) => {
    try {
      var data = req.body; // need tripId
      var verifydata = await Auth.validateDriver(req);
      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse("NOT_AUTHORIZED"));
      }

      if (!data.tripId) {
        return res.json(
          helper.showValidationErrorResponse("TRIP_ID_IS_REQUIRED")
        );
      }

      var mytrip = await Trips.getCompleteTripDetailsById(data.tripId);

      if (mytrip == null) {
        return res.json(helper.showValidationErrorResponse("INVALID_TRIP_ID"));
      }

      //total time in minutes
      var startDate = mytrip.tripStartedAt;
      var endDate = new Date();
      var totalMinutes = helper.getTimeDifferenceInMinute(endDate, startDate);
      if (totalMinutes < mytrip.estimatedTime) {
        data.estimatedTime = mytrip.estimatedTime;
      } else {
        data.estimatedTime = totalMinutes;
      }
      var tripFare = await helper.calculateTripFare(
        mytrip.distance,
        data.estimatedTime,
        mytrip.estimatedCost,
        mytrip.isSurgeTime,
        mytrip.surgeMultiplier,
        mytrip.promoCode,
        mytrip.carTypeRequired
      );
      //console.log("calculateTripFare", tripFare);
      data.cost = tripFare.cost;
      data.promoCodeCost = tripFare.promoCodeCost;
      data.driverEarning = tripFare.driverEarning;
      data.adminEarning = tripFare.adminEarning;
      data.costBeforePromo = tripFare.costBeforePromo;
      data.overallPendingBalance = verifydata.overallPendingBalance;
      data.overallCashBalance = verifydata.overallCashBalance;
      data.tripsCompleted = verifydata.tripsCompleted;
      data.firebaseToken = verifydata.firebaseToken;
      data.isNoMoreAcceptPoolTrip = verifydata.isNoMoreAcceptPoolTrip;
      data.driverLocation = verifydata.driverLocation;

      //console.log("trip complete data", data);

      if (
        mytrip.paymentMethod === "stripe" ||
        mytrip.paymentMethod === "Stripe"
      ) {
        data.overallPendingBalance = helper.roundNumber(
          data.overallPendingBalance + data.driverEarning
        );
        //console.log("Reference NUmber", mytrip.paymentSourceRefNo);
        var chargeData = {
          cost: data.cost,
          paymentSourceRefNo: mytrip.paymentSourceRefNo,
          isHotelTrip: mytrip.tripByHotel,
          hotelId: mytrip.hotelId,
          isDispatcherTrip: mytrip.tripByDispatcher,
          dispatcherId: mytrip.dispatcherId,
        };

        paymentMiddleware.paymentByStripe(chargeData, (response) => {
          if (response.status) {
            data.paymentRefNo = response.chargeId;
            data.paymentStatus = "completed";

            module.exports.tripComplete(data, (complete) => {
              res.json(complete);
            });
          } else {
            //console.log(response.message);
            res.json(
              helper.showStripeErrorResponse(response.message, response.code)
            );
          }
        });
      } else if (mytrip.paymentMethod === "square") {
        data.overallPendingBalance = helper.roundNumber(
          data.overallPendingBalance + data.driverEarning
        );

        var chargeData = {
          cost: data.cost,
          paymentSourceRefNo: mytrip.paymentSourceRefNo,
        };

        paymentMiddleware.paymentBySquare(chargeData, (response) => {
          if (response.status) {
            data.paymentRefNo = response.chargeId;
            data.paymentStatus = "completed";

            module.exports.tripComplete(data, (complete) => {
              res.json(complete);
            });
          } else {
            res.json(helper.showSquareErrorResponse(response.message));
          }
        });
      } else if (mytrip.paymentMethod === "wallet") {
        data.paymentRefNo = "Wallet";
        data.paymentStatus = "completed";
        data.overallPendingBalance = helper.roundNumber(
          data.overallPendingBalance + data.driverEarning
        );

        var getUserWallet = await User.getUserWalletAmount(mytrip.customerId);

        if (getUserWallet.walletCredit >= data.cost) {
          var leftWalletCredit =
            Math.round((getUserWallet.walletCredit - data.cost) * 100) / 100;
          var updateUserWallet = await User.updateUserWalletCredit({
            customerId: mytrip.customerId,
            walletCredit: leftWalletCredit,
          });

          module.exports.tripComplete(data, (complete) => {
            res.json(complete);
          });
        } else {
          return res.json(
            helper.showValidationErrorResponse("WALLET_AMOUNT_IS_INSUFFICIENT")
          );
        }
      } else if (mytrip.paymentMethod === "cash") {
        data.paymentRefNo = "Cash";
        data.paymentStatus = "completed";
        data.overallCashBalance = helper.roundNumber(
          data.overallCashBalance + data.adminEarning
        );

        module.exports.tripComplete(data, (complete) => {
          res.json(complete);
        });
      } else {
        return res.json(
          helper.showValidationErrorResponse("INVALID_PAYMENT_METHOD")
        );
      }
    } catch (err) {
      //console.log(err);
      res.json(helper.showInternalServerErrorResponse("INTERNAL_SERVER_ERROR"));
    }
  },

  tripComplete: async (data, responseCallback) => {
    Trips.tripEnd(data, async (err, dresponse) => {
      if (err) {
        responseCallback(
          helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err)
        );
      } else {
        var tripRequestSocketDataC = {
          success: true,
          tripId: dresponse._id,
          tripStatus: constant.TRIP_COMPLETED,
          isNoMoreAcceptPoolTrip: "yes",
          cost: dresponse.cost,
        };

        //send push notification to driver
        if (
          data.firebaseToken != undefined &&
          data.firebaseToken != "" &&
          data.firebaseToken != null &&
          data.firebaseToken != "none"
        ) {
          var title = __("TRIP_COMPLETED_SUCCESS");
          var body = __("TRIP_COMPLETED_MSG");
          var registrationToken = data.firebaseToken;
          helper.sendPushNotificationDriver(title, body, registrationToken);
        }

        data.tripsCompleted = data.tripsCompleted + 1;
        data.userPendingBalance = dresponse.userPendingBalance;

        //send notification to customer and update status
        User.findingTrip(
          {
            customerId: dresponse.customerId,
            userPendingBalance: data.userPendingBalance,
          },
          (err, cresponse) => {
            if (err || cresponse == null) {
              console.log("fcm get customer error", err);
            } else {
              if (cresponse.socketStatus === "no") {
                helper.emitCustomerSocket(
                  cresponse.socketId,
                  tripRequestSocketDataC
                );
              }

              if (
                cresponse.firebaseToken != undefined &&
                cresponse.firebaseToken != "" &&
                cresponse.firebaseToken != null &&
                cresponse.firebaseToken != "none"
              ) {
                var title = __("TRIP_COMPLETED_SUCCESS");
                var body = __("TRIP_COMPLETED_MSG");
                var registrationToken = cresponse.firebaseToken;
                helper.sendPushNotificationCustomer(
                  title,
                  body,
                  registrationToken
                );
              }
            }
          }
        );

        var sdata = {
          completed: 1,
          earned: dresponse.driverEarning,
          driverId: dresponse.driverId,
        };

        stats.addCompletedEarned(sdata);

        if (dresponse.trip_type === "pool") {
          var finalTripId = await helper.sortDriverPoolTrips(
            dresponse.driverId,
            data.driverLocation
          );

          console.log("finalTripId", finalTripId);

          if (finalTripId === 0) {
            console.log("isNoMoreAcceptPoolTrip", data.isNoMoreAcceptPoolTrip);
            Driver.findingTripsOn(
              {
                tripsCompleted: data.tripsCompleted,
                driverId: dresponse.driverId,
                overallPendingBalance: data.overallPendingBalance,
                overallCashBalance: data.overallCashBalance,
              },
              () => {}
            );
          } else {
            tripRequestSocketDataC = {
              success: true,
              tripId: finalTripId,
              tripStatus: constant.TRIP_COMPLETED,
              isNoMoreAcceptPoolTrip: "no",
              cost: dresponse.cost,
            };
          }
        } else {
          Driver.findingTripsOn(
            {
              tripsCompleted: data.tripsCompleted,
              driverId: dresponse.driverId,
              overallPendingBalance: data.overallPendingBalance,
              overallCashBalance: data.overallCashBalance,
            },
            () => {}
          );
        }

        responseCallback(
          helper.showSuccessResponse(
            "TRIP_COMPLETED_SUCCESS",
            tripRequestSocketDataC
          )
        );

        //email to customer and driver
        helper.sendCompleteTripEmailToDriverAndCustomer(
          data.costBeforePromo,
          dresponse
        );

        if (dresponse.promoCodeCost != 0 && dresponse.promoCode != "none") {
          //console.log("In promocode!");
          promoused.addusedcode(
            {
              promocode: dresponse.promoCode,
              customerId: dresponse.customerId,
            },
            (err, pudata) => {
              if (err) {
                console.log("err", err);
              }
            }
          );
        }

        //console.log("Trip Id:" + dresponse._id + ", Trip Completed!");
      }
    });
  },

  waitCancelByDriver: async (req, res) => {
    try {
      var data = req.body;
      var verifydata = await Auth.validateDriver(req);

      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse("NOT_AUTHORIZED"));
      }

      if (!data.tripId) {
        return res.json(
          helper.showValidationErrorResponse("TRIP_ID_IS_REQUIRED")
        );
      }

      Trips.driverWaitedCancel(data.tripId, async (err, dresponse) => {
        if (err) {
          //console.log("Trip Driver Cancel Error", err);
          res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
        } else {
          var tripRequestSocketDataC = {
            success: true,
            tripId: dresponse._id,
            tripStatus: constant.TRIP_CANCELLED,
          };

          res.json(
            helper.showSuccessResponse(
              "TRIP_CANCELLED_SUCCESS",
              tripRequestSocketDataC
            )
          );

          var waitingTimeInMin = helper.getTimeDifferenceInMinute(
            new Date(),
            dresponse.driverArrivedAt
          );
          var message = __("TRIP_CUSTOMER_WAIT_CANCELLED_MSG_DEFAULT");
          data.userPendingBalance = dresponse.customerRefId.userPendingBalance;
          data.overallPendingBalance = verifydata.overallPendingBalance;
          data.overallCashBalance = verifydata.overallCashBalance;
          data.tripsCompleted = verifydata.tripsCompleted;

          if (
            waitingTimeInMin >
            dresponse.carTypeRequired.waitingTimeStartAfterMin
          ) {
            data.driverEarning = dresponse.carTypeRequired.waitingTimePrice;

            if (dresponse.paymentMethod === "stripe") {
              data.overallPendingBalance = helper.roundNumber(
                verifydata.overallPendingBalance + data.driverEarning
              );
              message = __("TRIP_CUSTOMER_WAIT_CANCELLED_MSG");

              var chargeData = {
                cost: data.driverEarning,
                paymentSourceRefNo: dresponse.paymentSourceRefNo,
              };

              paymentMiddleware.paymentByStripe(chargeData, (response) => {
                if (response.status) {
                  //console.log("wait cancel payment success");
                } else {
                  message = __("TRIP_CUSTOMER_WAIT_CANCELLED_MSG_CASH");
                  data.userPendingBalance = helper.roundNumber(
                    data.userPendingBalance + data.driverEarning
                  );
                }
              });
            } else if (dresponse.paymentMethod === "square") {
              data.overallPendingBalance = helper.roundNumber(
                verifydata.overallPendingBalance + data.driverEarning
              );
              message = __("TRIP_CUSTOMER_WAIT_CANCELLED_MSG");

              var chargeData = {
                cost: data.driverEarning,
                paymentSourceRefNo: dresponse.paymentSourceRefNo,
              };

              paymentMiddleware.paymentBySquare(chargeData, (response) => {
                if (response.status) {
                  //console.log("wait cancel payment success");
                } else {
                  message = __("TRIP_CUSTOMER_WAIT_CANCELLED_MSG_CASH");
                  data.userPendingBalance = helper.roundNumber(
                    data.userPendingBalance + data.driverEarning
                  );
                }
              });
            } else if (dresponse.paymentMethod === "wallet") {
              var getUserWallet = await User.getUserWalletAmount(
                dresponse.customerId
              );

              if (getUserWallet.walletCredit >= data.driverEarning) {
                var leftWalletCredit =
                  Math.round(
                    (getUserWallet.walletCredit - data.driverEarning) * 100
                  ) / 100;
                var updateUserWallet = await User.updateUserWalletCredit({
                  customerId: dresponse.customerId,
                  walletCredit: leftWalletCredit,
                });
              } else {
                message = __("TRIP_CUSTOMER_WAIT_CANCELLED_MSG_CASH");
                data.userPendingBalance = helper.roundNumber(
                  data.userPendingBalance + data.driverEarning
                );
              }
            } else if (dresponse.paymentMethod === "cash") {
              data.driverEarning = data.driverEarning;
            }

            var sdatae = {
              completed: 1,
              earned: data.driverEarning,
              driverId: dresponse.driverId,
            };

            stats.addCompletedEarned(sdatae);
          }

          //send push notification to driver
          if (
            verifydata.firebaseToken != undefined &&
            verifydata.firebaseToken != "" &&
            verifydata.firebaseToken != null &&
            verifydata.firebaseToken != "none"
          ) {
            var title = __("TRIP_DRIVER_WAIT_CANCELLED_SUCCESS");
            var body = __("TRIP_DRIVER_WAIT_CANCELLED_MSG");
            var registrationToken = verifydata.firebaseToken;
            helper.sendPushNotificationDriver(title, body, registrationToken);
          }

          //send notification to customer and update status
          User.findingTrip(
            {
              customerId: dresponse.customerId,
              userPendingBalance: data.userPendingBalance,
            },
            (err, cresponse) => {
              if (err || cresponse == null) {
                //console.log("fcm get customer error", err);
              } else {
                //console.log("Emit socket", cresponse)
                if (cresponse.socketStatus === "no") {
                  //console.log("Socket emit", cresponse)
                  helper.emitCustomerSocket(
                    cresponse.socketId,
                    tripRequestSocketDataC
                  );
                }

                if (
                  cresponse.firebaseToken != undefined &&
                  cresponse.firebaseToken != "" &&
                  cresponse.firebaseToken != null &&
                  cresponse.firebaseToken != "none"
                ) {
                  var title = __("TRIP_CUSTOMER_WAIT_CANCELLED_SUCCESS");
                  var body = message;
                  var registrationToken = cresponse.firebaseToken;
                  helper.sendPushNotificationCustomer(
                    title,
                    body,
                    registrationToken
                  );
                }
              }
            }
          );

          var sdata = {
            driverId: dresponse.driverId,
            canceled: 1,
          };

          stats.addCanceled(sdata);
          Driver.findingTripsOn(
            {
              tripsCompleted: data.tripsCompleted,
              driverId: dresponse.driverId,
              overallPendingBalance: data.overallPendingBalance,
              overallCashBalance: data.overallCashBalance,
            },
            () => {}
          );
        }
      });
    } catch (err) {
      //console.log("err", err);
      res.json(helper.showInternalServerErrorResponse("INTERNAL_SERVER_ERROR"));
    }
  },

  tripCancelledByCustomer: async (req, res) => {
    try {
      var data = req.body; // need tripId
      var verifydata = await Auth.validateCustomer(req);

      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse("NOT_AUTHORIZED"));
      }

      if (!data.tripId) {
        return res.json(
          helper.showValidationErrorResponse("TRIP_ID_IS_REQUIRED")
        );
      }

      Trips.customerCancel(data.tripId, async (err, datad) => {
        if (err) {
          //console.log("Trip Customer Cancel Error", err);
          res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
        } else {
          var tripRequestSocketDataC = {
            success: true,
            tripId: datad._id,
            tripStatus: constant.TRIP_CANCELLED,
          };

          res.json(
            helper.showSuccessResponse(
              "TRIP_CANCELLED_SUCCESS",
              tripRequestSocketDataC
            )
          );

          var camcellationTimeInMin = helper.getTimeDifferenceInMinute(
            new Date(),
            datad.tripConfirmedAt
          );
          var message = __("TRIP_CUSTOMER_CANCELLED_MSG_DEFAULT");
          data.userPendingBalance = verifydata.userPendingBalance;
          data.overallPendingBalance = datad.overallPendingBalance;
          data.overallCashBalance = datad.overallCashBalance;
          data.tripsCompleted = datad.tripsCompleted;

          if (
            camcellationTimeInMin > datad.carTypeRequired.cancellationTimeMin
          ) {
            data.driverEarning = datad.carTypeRequired.cancellationFee;

            if (datad.paymentMethod === "stripe") {
              data.overallPendingBalance = helper.roundNumber(
                verifydata.overallPendingBalance + data.driverEarning
              );
              message = __("TRIP_CUSTOMER_CANCELLED_MSG");

              var chargeData = {
                cost: data.driverEarning,
                paymentSourceRefNo: datad.paymentSourceRefNo,
              };

              paymentMiddleware.paymentByStripe(chargeData, (response) => {
                if (response.status) {
                  //console.log("wait cancel payment success");
                } else {
                  message = __("TRIP_CUSTOMER_WAIT_CANCELLED_MSG_CASH");
                  data.userPendingBalance = helper.roundNumber(
                    datad.userPendingBalance + data.driverEarning
                  );
                }
              });
            } else if (datad.paymentMethod === "square") {
              data.overallPendingBalance = helper.roundNumber(
                verifydata.overallPendingBalance + data.driverEarning
              );
              message = __("TRIP_CUSTOMER_CANCELLED_MSG");

              var chargeData = {
                cost: data.driverEarning,
                paymentSourceRefNo: datad.paymentSourceRefNo,
              };

              paymentMiddleware.paymentBySquare(chargeData, (response) => {
                if (response.status) {
                  //console.log("wait cancel payment success");
                } else {
                  message = __("TRIP_CUSTOMER_WAIT_CANCELLED_MSG_CASH");
                  data.userPendingBalance = helper.roundNumber(
                    datad.userPendingBalance + data.driverEarning
                  );
                }
              });
            } else if (datad.paymentMethod === "cash") {
              data.driverEarning = data.driverEarning;
            }

            var sdatae = {
              completed: 1,
              earned: data.driverEarning,
              driverId: datad.driverId,
            };

            stats.addCompletedEarned(sdatae);
          }

          //send notification to customer
          if (
            verifydata.firebaseToken != undefined &&
            verifydata.firebaseToken != "" &&
            verifydata.firebaseToken != null &&
            verifydata.firebaseToken != "none"
          ) {
            var title = __("TRIP_CUSTOMER_CANCELLED_SUCCESS");
            var body = __("TRIP_CUSTOMER_CANCELLED_MSG");
            var registrationToken = verifydata.firebaseToken;
            helper.sendPushNotificationCustomer(title, body, registrationToken);
          }

          //send notification to driver and update status
          Driver.findingTripsOn(
            {
              tripsCompleted: data.tripsCompleted,
              driverId: datad.driverId,
              overallPendingBalance: data.overallPendingBalance,
              overallCashBalance: data.overallCashBalance,
            },
            (err, dresponse) => {
              if (err || dresponse == null) {
                //console.log("fcm get driver error", err);
              } else {
                console.log("Sending push notification to customer");
                if (dresponse.socketStatus === "no") {
                  helper.emitDriverSocket(
                    dresponse.socketId,
                    tripRequestSocketDataC
                  );
                }

                if (
                  dresponse.firebaseToken != undefined &&
                  dresponse.firebaseToken != "" &&
                  dresponse.firebaseToken != null &&
                  dresponse.firebaseToken != "none"
                ) {
                  var title = __("TRIP_CUSTOMER_CANCELLED_SUCCESS");
                  var body = __("TRIP_CUSTOMER_CANCELLED_MSG");
                  var registrationToken = dresponse.firebaseToken;
                  helper.sendPushNotificationDriver(
                    title,
                    body,
                    registrationToken
                  );
                }
              }
            }
          );
        }
      });
    } catch (err) {
      //console.log("err", err);
      res.json(helper.showInternalServerErrorResponse("INTERNAL_SERVER_ERROR"));
    }
  },

  rejectTripByDriver: async (req, res) => {
    try {
      var data = {}; // need tripId
      var verifydata = await Auth.validateDriver(req);
      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse("NOT_AUTHORIZED"));
      }
      data.email = verifydata.email;
      data.driverId = verifydata._id;
      data.rejected = 1;
      stats.addRejected(data, (err, mdata) => {
        res.json(helper.showSuccessResponse("TRIP_REJECT_SUCCESS", {}));
      });
    } catch (err) {
      //console.log("err", err);
      res.json(helper.showInternalServerErrorResponse("INTERNAL_SERVER_ERROR"));
    }
  },

  scheduleTripCancelledByCustomer: async (req, res) => {
    try {
      var data = req.body; // need tripId
      var verifydata = await Auth.validateCustomer(req);
      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse("NOT_AUTHORIZED"));
      }

      if (!data.tripId) {
        return res.json(
          helper.showValidationErrorResponse("TRIP_ID_IS_REQUIRED")
        );
      }

      Trips.customerCancel(data.tripId, async (err, datad) => {
        if (err) {
          //console.log("Trip Customer Cancel Error", err);
          res.json(helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err));
        } else {
          res.json(helper.showSuccessResponse("TRIP_CANCELLED_SUCCESS", {}));

          agenda.cancel(
            { name: "archive ride", "data.rideId": data.tripId },
            (err, numRemoved) => {
              if (err || numRemoved == null) {
                //console.log("Cancle Schedule", err);
              }
            }
          );

          User.findCSocketCallback(datad.customerId, (err, cresponse) => {
            if (err || cresponse == null) {
              //console.log("socket customer error", err);
            } else {
              if (cresponse.offline === "no") {
                helper.emitCustomerSocket(cresponse.socketId, datad);
              }

              if (
                cresponse.firebaseToken != undefined &&
                cresponse.firebaseToken != "" &&
                cresponse.firebaseToken != null &&
                cresponse.firebaseToken != "none"
              ) {
                var title = __("TRIP_CUSTOMER_SCHEDULE_CANCELLED_SUCCESS");
                var body = __("TRIP_CUSTOMER_SCHEDULE_CANCELLED_MSG");
                var registrationToken = cresponse.firebaseToken;
                helper.sendPushNotificationCustomer(
                  title,
                  body,
                  registrationToken
                );
              }
            }
          });
        }
      });
    } catch (err) {
      //console.log("err", err);
      res.json(helper.showInternalServerErrorResponse("INTERNAL_SERVER_ERROR"));
    }
  },

  //Feedback by customer to driver
  feedbackByCustomerToDriver: async (req, res) => {
    try {
      var data = req.body;

      var paramsList = [
        { name: "tripId", type: "string" },
        { name: "driverRating", type: "number" },
      ];

      helper.checkRequestParams(data, paramsList, async (response) => {
        if (response.status) {
          var verifydata = await Auth.validateCustomer(req);
          if (verifydata == null) {
            return res.json(
              helper.showUnathorizedErrorResponse("NOT_AUTHORIZED")
            );
          }

          if (!data.tripId) {
            return res.json(
              helper.showValidationErrorResponse("TRIP_ID_IS_REQUIRED")
            );
          }

          var mytrip = await Trips.getTripsById(data.tripId);

          if (mytrip == null) {
            return res.json(
              helper.showValidationErrorResponse("INVALID_TRIP_ID")
            );
          }

          if (!data.driverRating) {
            return res.json(
              helper.showValidationErrorResponse("RATING_IS_REQUIRED")
            );
          }

          if (
            data.tipAmount != undefined &&
            data.tipAmount != "" &&
            data.tipAmount != 0
          ) {
            data.driverEarning = Number(data.tipAmount);
            data.userPendingBalance = verifydata.userPendingBalance;
            data.overallPendingBalance = mytrip.overallPendingBalance;
            data.overallCashBalance = mytrip.overallCashBalance;

            if (mytrip.paymentMethod === "stripe") {
              var chargeData = {
                cost: data.driverEarning,
                paymentSourceRefNo: mytrip.paymentSourceRefNo,
              };

              paymentMiddleware.paymentByStripe(chargeData, (response) => {
                if (response.status) {
                  data.overallPendingBalance = helper.roundNumber(
                    data.overallPendingBalance + data.driverEarning
                  );
                  var overall = {
                    did: mytrip.driverId,
                    overallCashBalance: data.overallCashBalance,
                    overallPendingBalance: data.overallPendingBalance,
                  };
                  Driver.updateOverall(overall, () => {});

                  var sdata = {
                    completed: 1,
                    earned: data.driverEarning,
                    driverId: mytrip.driverId,
                  };

                  stats.addCompletedEarned(sdata);
                }
              });
            }
          } else {
            data.tipAmount = 0;
          }

          Trips.feedbackByCustomer(data.tripId, data, (err, datad) => {
            if (err) {
              res.json(
                helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err)
              );
            } else {
              Trips.aggregate(
                [
                  {
                    $match: {
                      $and: [
                        { "review.driverRating": { $exists: true, $gt: 0 } },
                        { driverId: datad.driverId },
                      ],
                    },
                  },
                  {
                    $group: {
                      _id: "$driverId",
                      driveravg: { $avg: "$review.driverRating" },
                    },
                  },
                ],
                async function (err, result) {
                  var roundRating = Math.round(result[0].driveravg * 100) / 100;
                  var driverData = {
                    driverId: datad.driverId,
                    avgRating: roundRating,
                  };

                  Driver.updateDriverAvgRating(driverData, function (
                    err,
                    resdata
                  ) {});

                  res.json(
                    helper.showSuccessResponse("FEEDBACK_POSTED_SUCCESS", {
                      driveravgrating: roundRating,
                    })
                  );
                }
              );
            }
          });
        } else {
          res.json(helper.showParamsErrorResponse(response.message));
        }
      });
    } catch (err) {
      //console.log("err", err);
      res.json(helper.showInternalServerErrorResponse("INTERNAL_SERVER_ERROR"));
    }
  },

  //Feedback by driver to customer
  feedbackByDriverToCustomer: async (req, res) => {
    try {
      var data = req.body; // need tripId

      var paramsList = [
        { name: "tripId", type: "string" },
        { name: "customerRating", type: "number" },
      ];

      helper.checkRequestParams(data, paramsList, async (response) => {
        if (response.status) {
          var verifydata = await Auth.validateDriver(req);
          if (verifydata == null) {
            return res.json(
              helper.showUnathorizedErrorResponse("NOT_AUTHORIZED")
            );
          }

          if (!data.tripId) {
            return res.json(
              helper.showValidationErrorResponse("TRIP_ID_IS_REQUIRED")
            );
          }

          if (!data.customerRating) {
            return res.json(
              helper.showValidationErrorResponse("RATING_IS_REQUIRED")
            );
          }

          Trips.feedbackByDriver(data.tripId, data, (err, datad) => {
            if (err || datad == null) {
              res.json({
                message: "Not able to post feedback",
                data: {},
                error: err,
              });
            } else {
              Trips.aggregate(
                [
                  {
                    $match: {
                      $and: [
                        { "review.customerRating": { $exists: true, $gt: 0 } },
                        { customerId: datad.customerId },
                      ],
                    },
                  },
                  {
                    $group: {
                      _id: "$customerId",
                      customeravg: { $avg: "$review.customerRating" },
                    },
                  },
                ],
                async function (err, result) {
                  var roundRating =
                    Math.round(result[0].customeravg * 100) / 100;
                  var customerData = {
                    customerId: datad.customerId,
                    customerAvgRating: roundRating,
                  };

                  User.updateCustomerAvgRating(customerData, function (
                    err,
                    resdata
                  ) {});

                  res.json(
                    helper.showSuccessResponse("FEEDBACK_POSTED_SUCCESS", {
                      customeravgrating: roundRating,
                    })
                  );
                }
              );
            }
          });
        } else {
          res.json(helper.showParamsErrorResponse(response.message));
        }
      });
    } catch (err) {
      //console.log("err", err);
      res.json(helper.showInternalServerErrorResponse("INTERNAL_SERVER_ERROR"));
    }
  },

  reportDriver: async (req, res) => {
    try {
      var data = req.body; // need tripId
      var verifydata = await Auth.validateCustomer(req);
      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse("NOT_AUTHORIZED"));
      }

      if (!data.tripId) {
        return res.json(
          helper.showValidationErrorResponse("TRIP_ID_IS_REQUIRED")
        );
      }
      // need to add alot of formulas for calculated fare
      Trips.feedbackReport(data.tripId, data, (err, datad) => {
        if (err || datad == null) {
          res.json({
            message: "Not able to post report",
            data: {},
            error: err,
          });
        } else {
          res
            .status(200)
            .json({ message: "Reported Driver", data: {}, error: err });
        }
      });
    } catch (err) {
      //console.log("err", err);
      res.json(helper.showInternalServerErrorResponse("INTERNAL_SERVER_ERROR"));
    }
  },

  //add user pref driver
  addUserPrefDriver: async (req, res) => {
    try {
      var data = req.body;
      var verifydata = await Auth.validateCustomer(req);

      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse("NOT_AUTHORIZED"));
      }

      if (!data.driverId) {
        return res.json(
          helper.showValidationErrorResponse("DRIVER_ID_IS_REQUIRED")
        );
      }

      data.customerId = verifydata._id;
      data.driverId = data.driverId;

      User.AddRefToPrefferedDriver(data, (err, resdata) => {
        if (err) {
          return res.json(
            helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err)
          );
        } else {
          res.json(helper.showSuccessResponse("DATA_ADDED_SUCCESS", resdata));
        }
      });
    } catch (err) {
      res.json(helper.showInternalServerErrorResponse("INTERNAL_SERVER_ERROR"));
    }
  },

  //user pref drivers list
  getUserPrefferedList: async (req, res) => {
    try {
      var data = req.body;
      var verifydata = await Auth.validateCustomer(req);

      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse("NOT_AUTHORIZED"));
      }

      data.customerId = verifydata._id;

      User.getListOFPrefferedDrivers(data, (err, resdata) => {
        if (err) {
          return res.json(
            helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err)
          );
        } else {
          if (resdata.length === 0) {
            res.json(helper.showSuccessResponse("NO_DATA_FOUND", []));
          } else {
            res.json(helper.showSuccessResponse("DATA_SUCCESS", resdata));
          }
        }
      });
    } catch (err) {
      res.json(helper.showInternalServerErrorResponse("INTERNAL_SERVER_ERROR"));
    }
  },

  //remove pref driver from pref list
  removeUserPreferDriver: async (req, res) => {
    try {
      var data = req.body;
      var verifydata = await Auth.validateCustomer(req);

      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse("NOT_AUTHORIZED"));
      }

      if (!data.driverId) {
        return res.json(
          helper.showValidationErrorResponse("DRIVER_ID_IS_REQUIRED")
        );
      }

      data.customerId = verifydata._id;
      data.driverId = data.driverId;

      User.removeRefToPrefferedDriver(data, (err, resdata) => {
        if (err) {
          return res.json(
            helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err)
          );
        } else {
          res.json(helper.showSuccessResponse("DELETE_SUCCESS", resdata));
        }
      });
    } catch (error) {
      res.json(helper.showInternalServerErrorResponse("INTERNAL_SERVER_ERROR"));
    }
  },

  //pref driver trip by user
  addUserPrefTrip: async (data, headerData, responseCallback) => {
    try {
      var paramsList = [
        { name: "country", type: "string" },
        { name: "countryCode", type: "string" },
        { name: "state", type: "string" },
        { name: "stateCode", type: "string" },
        { name: "city", type: "string" },
        { name: "cityCode", type: "string" },
        { name: "pricingType", type: "string" },
        { name: "isSurgeTime", type: "string" },
        { name: "surgeMultiplier", type: "number" },
        { name: "unit", type: "string" },
        { name: "estimatedCost", type: "number" },
        { name: "carTypeRequired", type: "string" },
        { name: "distance", type: "number" },
        { name: "estimatedTime", type: "number" },
        { name: "source", type: "object" },
        { name: "destination", type: "object" },
        { name: "paymentMethod", type: "string" },
        { name: "paymentSourceRefNo", type: "string" },
      ];

      helper.checkRequestParams(data, paramsList, async (response) => {
        if (response.status) {
          var verifydata = await Auth.validateCustomer(headerData);

          if (verifydata == null) {
            responseCallback(
              helper.showUnathorizedErrorResponse("NOT_AUTHORIZED")
            );
          }

          if (!data.prefDriver) {
            responseCallback(
              helper.showValidationErrorResponse("DRIVER_ID_IS_REQUIRED")
            );
          }

          if (!data.source) {
            responseCallback(
              helper.showValidationErrorResponse("SOURCE_LOCATION_IS_REQUIRED")
            );
          }

          if (!data.destination) {
            responseCallback(
              helper.showValidationErrorResponse(
                "DESTINATION_LOCATION_IS_REQUIRED"
              )
            );
          }

          if (!data.distance) {
            responseCallback(
              helper.showValidationErrorResponse("DISTANCE_IS_REQUIRED")
            );
          }

          if (!data.estimatedTime) {
            responseCallback(
              helper.showValidationErrorResponse("ESTIMATED_TIME_IS_REQUIRED")
            );
          }

          if (!data.paymentMethod) {
            responseCallback(
              helper.showValidationErrorResponse("PAYMENT_METHOD_IS_REQUIRED")
            );
          }

          if (!data.estimatedCost) {
            responseCallback(
              helper.showValidationErrorResponse("ESTIMATED_COST_IS_REQUIRED")
            );
          }

          if (!data.scheduleTimezone) {
            responseCallback(
              helper.showValidationErrorResponse("TIMEZONE_IS_REQUIRED")
            );
          }

          if (!data.carTypeRequired) {
            responseCallback(
              helper.showValidationErrorResponse("CARTYPE_IS_REQUIRED")
            );
          }

          if (!data.paymentSourceRefNo) {
            responseCallback(
              helper.showValidationErrorResponse("PAYMENT_IS_REQUIRED")
            );
          }

          if (data.paymentMethod === "stripe") {
            var getCard = await POs.getPObyId(data.paymentSourceRefNo);

            if (getCard == null) {
              responseCallback(
                helper.showValidationErrorResponse("INVALID_PAYMENT_OPTIONS")
              );
            }
          }

          data.startLocationAddr = data.source.startLocationAddr;
          data.endLocationAddr = data.destination.endLocationAddr;

          var endLocation = {
            type: "Point",
            coordinates: [
              data.destination.endLocation.lng,
              data.destination.endLocation.lat,
            ],
          };
          var startLocation = {
            type: "Point",
            coordinates: [
              data.source.startLocation.lng,
              data.source.startLocation.lat,
            ],
          };
          data.endLocation = endLocation;
          data.startLocation = startLocation;
          data.customerId = verifydata._id;
          data.customerNumber = verifydata.mobileNumber;
          data.customerName = verifydata.name;
          data.customerAvgRating = verifydata.customerAvgRating; // pick it from verify customer

          if (data.pricingType === "global") {
            var getCartype = await CarTypes.getCarsTypesByIdAsync(
              data.carTypeRequired
            );

            data.carTypeRequired = getCartype;
          } else if (data.pricingType === "city") {
            var getCartype = await CityType.getCityTypeByIdAsync(
              data.carTypeRequired
            );
            getCartype.carType = getCartype.carTypeDetails.carType;
            getCartype.carImage = getCartype.carTypeDetails.carImage;

            data.carTypeRequired = getCartype;
          }

          if (
            data.promoCode != undefined &&
            data.promoCode != "" &&
            data.promoCode != "none"
          ) {
            data.promoCode = data.promoCode;
          } else {
            data.promoCode = "none";
          }

          // console.log("data.prefDriver", data.prefDriver);

          Trips.addTripInstant(data, async (err, datad) => {
            if (err) {
              responseCallback(
                helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err)
              );
            } else {
              var Cdata = {
                customerId: datad.customerId,
                ref: datad._id,
              };

              //_id: data.prefDriver
              User.AddRefToTrip(Cdata);

              socketDriver.findDSocketByIdCallback(
                data.prefDriver,
                (err, dresponse) => {
                  if (err || dresponse == null) {
                    //console.log("socket driver error", err);
                  } else {
                    if (dresponse.offline === "no") {
                      helper.emitDriverSocket(dresponse.socketId, datad);
                    }

                    if (
                      dresponse.firebase_token != undefined &&
                      dresponse.firebase_token != "" &&
                      dresponse.firebase_token != null &&
                      dresponse.firebase_token != "none"
                    ) {
                      var title = __("TRIP_REQUEST_SUCCESS");
                      var body = "Trip Request From :" + datad.customerName;
                      var registrationToken = dresponse.firebase_token;
                      helper.sendPushNotificationDriver(
                        title,
                        body,
                        registrationToken
                      );
                    }
                  }
                }
              );

              var sdata = {
                receivedRequest: 1,
                driverId: data.prefDriver,
                tripId: datad._id,
              };

              stats.addRequestRec(sdata);
            }
          });
        } else {
          responseCallback(helper.showParamsErrorResponse(response.message));
        }
      });
    } catch (err) {
      responseCallback(
        helper.showInternalServerErrorResponse("INTERNAL_SERVER_ERROR")
      );
    }
  },

  //this is for ride hailing trip by driver
  estimatedCalculateCostByDriver: async (req, res) => {
    try {
      var data = req.body;

      var paramsList = [{ name: "destination", type: "object" }];

      // console.log("data", data);

      helper.checkRequestParams(data, paramsList, async (response) => {
        if (response.status) {
          var verifydata = await Auth.validateDriver(req);

          if (verifydata == null) {
            return res.json(
              helper.showUnathorizedErrorResponse("NOT_AUTHORIZED")
            );
          }

          // console.log(">>>verifydata.selectedCar", verifydata.selectedCar);

          data.carTypeId = verifydata.selectedCarTypeId;
          data.startLocation = {
            lat: verifydata.driverLocation.coordinates[1],
            lng: verifydata.driverLocation.coordinates[0],
          };

          data.endLocationAddr = data.destination.endLocationAddr;
          data.endLocation = {
            lat: data.destination.endLocation.lat,
            lng: data.destination.endLocation.lng,
          };

          data.destination.addressComponents.forEach((addresses) => {
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

          var isBusinessInCountry = await Country.isBusinessInCountry(
            data.countryCode
          );

          if (isBusinessInCountry == null) {
            return res.json(
              helper.showValidationErrorResponse("SERVICE_NOT_AVAIABLE")
            );
          }

          var params = {
            origins: data.startLocation, //"Washington, DC, USA"
            destinations: data.endLocation, //"New York, NY, USA"
            mode: "driving",
          };

          var distanceMatrixDetails = googleMapsClient
            .distanceMatrix(params)
            .asPromise()
            .then((response) => {
              return response.json;
            })
            .catch((err) => {
              return err.json;
            });

          let [distanceMatrix] = await Promise.all([distanceMatrixDetails]);

          if (distanceMatrix.status != "OK") {
            return res.json(
              helper.showGoogleMapsErrorResponse(distanceMatrix.error_message)
            );
          }

          var distance = distanceMatrix.rows[0].elements[0].distance.value;
          //convert distance meters to km
          data.distance = Math.round((distance / 1000) * 100) / 100;
          var estimatedTime = distanceMatrix.rows[0].elements[0].duration.value;
          data.estimatedTime = Math.round((estimatedTime / 60) * 100) / 100; //time in seconds convert to min

          City.getCityByCountryCodeAndCityGoogleCode(
            data,
            (err, cityResponse) => {
              if (err) {
                return res.json(
                  helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err)
                );
              }

              if (cityResponse === null) {
                CarTypes.getEnabledCarsTypesByCarTypeId(
                  data.carTypeId,
                  (err, element) => {
                    if (err) {
                      return res.json(
                        helper.showDatabaseErrorResponse(
                          "INTERNAL_DB_ERROR",
                          err
                        )
                      );
                    } else {
                      if (element === null) {
                        return res.json(
                          helper.showValidationErrorResponse(
                            "CARTYPES_NOT_ADDED"
                          )
                        );
                      }

                      var CalculateEstimatedCost = helper.caculateTripEstimatedCost(
                        data.distance,
                        data.estimatedTime,
                        element
                      );
                      var estimatedCost = CalculateEstimatedCost.estimatedCost;
                      var isSurgeTime = CalculateEstimatedCost.isSurgeTime;
                      var surgeMultiplier =
                        CalculateEstimatedCost.surgeMultiplier;
                      var unit = CalculateEstimatedCost.unit;
                      var actualDistance = CalculateEstimatedCost.distance;

                      element.set("unit", unit, { strict: false });
                      element.set("estimatedCost", estimatedCost, {
                        strict: false,
                      });
                      element.set("distance", actualDistance, {
                        strict: false,
                      });
                      element.set("estimatedTime", data.estimatedTime, {
                        strict: false,
                      });
                      //element.set('startLocationAddr', data.startLocationAddr, { strict: false });
                      element.set("carTypeRequired", element._id, {
                        strict: false,
                      });
                      element.set("startLocation", data.startLocation, {
                        strict: false,
                      });
                      element.set("endLocationAddr", data.endLocationAddr, {
                        strict: false,
                      });
                      element.set("endLocation", data.endLocation, {
                        strict: false,
                      });
                      element.set("country", data.country, { strict: false });
                      element.set("countryCode", data.countryCode, {
                        strict: false,
                      });
                      element.set("state", data.state, { strict: false });
                      element.set("stateCode", data.stateCode, {
                        strict: false,
                      });
                      element.set("city", data.city, { strict: false });
                      element.set("cityCode", data.cityCode, { strict: false });
                      element.set("pricingType", "global", { strict: false });
                      element.set("isSurgeTime", isSurgeTime, {
                        strict: false,
                      });
                      element.set("surgeMultiplier", surgeMultiplier, {
                        strict: false,
                      });

                      res.json(
                        helper.showSuccessResponse("DATA_SUCCESS", element)
                      );
                    }
                  }
                );
              } else {
                CityType.getCityTypeByCityIdAndCarTypeId(
                  { cityId: cityResponse._id, carTypeId: data.carTypeId },
                  (err, element) => {
                    if (err) {
                      return res.json(
                        helper.showDatabaseErrorResponse(
                          "INTERNAL_DB_ERROR",
                          err
                        )
                      );
                    } else {
                      if (CityTypeResponse === null) {
                        return res.json(
                          helper.showValidationErrorResponse(
                            "CARTYPES_NOT_ADDED"
                          )
                        );
                      }

                      var CalculateEstimatedCost = helper.caculateTripEstimatedCost(
                        data.distance,
                        data.estimatedTime,
                        element
                      );
                      var estimatedCost = CalculateEstimatedCost.estimatedCost;
                      var isSurgeTime = CalculateEstimatedCost.isSurgeTime;
                      var surgeMultiplier =
                        CalculateEstimatedCost.surgeMultiplier;
                      var unit = CalculateEstimatedCost.unit;
                      var actualDistance = CalculateEstimatedCost.distance;

                      element.set("carType", element.carTypeDetails.carType, {
                        strict: false,
                      });
                      element.set("carImage", element.carTypeDetails.carImage, {
                        strict: false,
                      });
                      element.set("unit", unit, { strict: false });
                      element.set("estimatedCost", estimatedCost, {
                        strict: false,
                      });
                      element.set("distance", actualDistance, {
                        strict: false,
                      });
                      element.set("estimatedTime", data.estimatedTime, {
                        strict: false,
                      });
                      element.set("carTypeRequired", element._id, {
                        strict: false,
                      });
                      //element.set('startLocationAddr', data.startLocationAddr, { strict: false });
                      element.set("startLocation", data.startLocation, {
                        strict: false,
                      });
                      element.set("endLocationAddr", data.endLocationAddr, {
                        strict: false,
                      });
                      element.set("endLocation", data.endLocation, {
                        strict: false,
                      });
                      element.set("country", data.country, { strict: false });
                      element.set("countryCode", data.countryCode, {
                        strict: false,
                      });
                      element.set("state", data.state, { strict: false });
                      element.set("stateCode", data.stateCode, {
                        strict: false,
                      });
                      element.set("city", data.city, { strict: false });
                      element.set("cityCode", data.cityCode, { strict: false });
                      element.set("pricingType", "city", { strict: false });
                      element.set("isSurgeTime", isSurgeTime, {
                        strict: false,
                      });
                      element.set("surgeMultiplier", surgeMultiplier, {
                        strict: false,
                      });

                      res.json(
                        helper.showSuccessResponse("DATA_SUCCESS", element)
                      );
                    }
                  }
                );
              }
            }
          );
        } else {
          res.json(helper.showParamsErrorResponse(response.message));
        }
      });
    } catch (err) {
      //console.log(">>>>>>>", err);
      res.json(helper.showInternalServerErrorResponse("INTERNAL_SERVER_ERROR"));
    }
  },

  //ride hailing trip
  addTripByDriver: (data, headerData, responseCallback) => {
    try {
      var paramsList = [
        { name: "country", type: "string" },
        { name: "countryCode", type: "string" },
        { name: "state", type: "string" },
        { name: "stateCode", type: "string" },
        { name: "city", type: "string" },
        { name: "cityCode", type: "string" },
        { name: "pricingType", type: "string" },
        { name: "isSurgeTime", type: "string" },
        { name: "surgeMultiplier", type: "number" },
        { name: "unit", type: "string" },
        { name: "estimatedCost", type: "number" },
        { name: "distance", type: "number" },
        { name: "estimatedTime", type: "number" },
        //{ name: 'source', type: 'object' },
        { name: "destination", type: "object" },
        { name: "carTypeRequired", type: "string" },
        //{ name: 'paymentSourceRefNo', type: 'string' }
      ];

      helper.checkRequestParams(data, paramsList, async (response) => {
        if (response.status) {
          var verifydata = await Auth.validateDriver(headerData);

          console.log("Verify data", verifydata);

          if (verifydata == null) {
            responseCallback(
              helper.showUnathorizedErrorResponse("NOT_AUTHORIZED")
            );
          }

          if (!data.destination) {
            responseCallback(
              helper.showValidationErrorResponse(
                "DESTINATION_LOCATION_IS_REQUIRED"
              )
            );
          }

          if (!data.distance) {
            responseCallback(
              helper.showValidationErrorResponse("DISTANCE_IS_REQUIRED")
            );
          }

          if (!data.estimatedTime) {
            responseCallback(
              helper.showValidationErrorResponse("ESTIMATED_TIME_IS_REQUIRED")
            );
          }

          if (!data.estimatedCost) {
            responseCallback(
              helper.showValidationErrorResponse("ESTIMATED_COST_IS_REQUIRED")
            );
          }

          if (!data.scheduleTimezone) {
            responseCallback(
              helper.showValidationErrorResponse("TIMEZONE_IS_REQUIRED")
            );
          }

          var a = helper.getCurrentDateAndTimeInCityTimezoneFromUTC(
            data.scheduleTimezone
          );
          data.readableDate = a.format("LLLL");
          data.scheduleTime = a.format("LT"); //08:30 PM
          data.scheduleDate = a.format("L"); //04/09/1986

          if (!data.carTypeRequired) {
            responseCallback(
              helper.showValidationErrorResponse("CARTYPE_IS_REQUIRED")
            );
          }

          data.startLocation = verifydata.driverLocation;

          var params = {
            latlng: {
              lat: data.startLocation.coordinates[1],
              lng: data.startLocation.coordinates[0],
            },
          };

          var reverseGeocodeDetails = googleMapsClient
            .reverseGeocode(params)
            .asPromise()
            .then((response) => {
              return response.json;
            })
            .catch((err) => {
              return err.json;
            });

          let [revGeo] = await Promise.all([reverseGeocodeDetails]);

          // console.log("distanceMatrix,,,", revGeo.results[0].formatted_address);

          data.startLocationAddr = revGeo.results[0].formatted_address;
          data.endLocationAddr = data.destination.endLocationAddr;

          var endLocation = {
            type: "Point",
            coordinates: [
              data.destination.endLocation.lng,
              data.destination.endLocation.lat,
            ],
          };
          data.endLocation = endLocation;
          data.paymentMethod = "cash";
          data.paymentSourceRefNo = "Cash";

          if (data.pricingType === "global") {
            var getCartype = await CarTypes.getCarsTypesByIdAsync(
              data.carTypeRequired
            );

            data.carTypeRequired = getCartype;
          } else if (data.pricingType === "city") {
            var getCartype = await CityType.getCityTypeByIdAsync(
              data.carTypeRequired
            );
            getCartype.carType = getCartype.carTypeDetails.carType;
            getCartype.carImage = getCartype.carTypeDetails.carImage;

            data.carTypeRequired = getCartype;
          }

          data.driverLocation = verifydata.driverLocation;
          data.driverImage = verifydata.profileImage;
          data.driverId = verifydata._id;
          data.driveremail = verifydata.email;
          data.driverNumber = verifydata.mobileNumber;
          data.driverName = verifydata.name;
          data.driverAvgRtaing = verifydata.avgRating;
          data.tripsCompleted = verifydata.tripsCompleted;
          data.driverSelectedCar = verifydata.selectedCar;
          data.tripOTP = Math.floor(Math.random() * (10000 - 1000)) + 1000;

          Trips.addTripByDriver(data, async (err, dresponse) => {
            if (err) {
              //console.log("Trip Start Error", err);
              responseCallback(
                helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err)
              );
            } else {
              var tripRequestSocketDataC = {
                success: true,
                tripId: dresponse._id,
                tripStatus: constant.TRIP_DESTINATION_INROUTE,
              };

              responseCallback(
                helper.showSuccessResponse(
                  "TRIP_STARTED_SUCCESS",
                  tripRequestSocketDataC
                )
              );

              //send push notification to driver
              if (
                verifydata.firebaseToken != undefined &&
                verifydata.firebaseToken != "" &&
                verifydata.firebaseToken != null &&
                verifydata.firebaseToken != "none"
              ) {
                var title = __("TRIP_STARTED_SUCCESS");
                var body =
                  "You are on your way. ETA:" +
                  dresponse.estimatedTime +
                  " min.";
                var registrationToken = verifydata.firebaseToken;
                helper.sendPushNotificationDriver(
                  title,
                  body,
                  registrationToken
                );
              }

              //update driver status
              var dUData = {
                driverId: verifydata._id,
                currentTripId: dresponse._id,
              };
              Driver.updateDriverStatusOnTripRidehailing(
                dUData,
                (err, cresponse) => {
                  if (err || cresponse == null) {
                    //console.log("fcm get driver error", err);
                  } else {
                    cresponse.accepted = 1;
                    cresponse.driverId = cresponse._id;
                    stats.addAccepted(cresponse);
                  }
                }
              );
            }
          });
        } else {
          responseCallback(helper.showParamsErrorResponse(response.message));
        }
      });
    } catch (err) {
      responseCallback(
        helper.showInternalServerErrorResponse("INTERNAL_SERVER_ERROR")
      );
    }
  },

  getCustomerTripDetails: async (req, res) => {
    try {
      var id = req.params._id;

      Trips.getCustomerTripDetails(id, (err, resdata) => {
        if (err) {
          return res.json(
            helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err)
          );
        } else {
          if (resdata == null) {
            res.json(helper.showSuccessResponse("NO_DATA_FOUND", {}));
          } else {
            res.json(helper.showSuccessResponse("DATA_SUCCESS", resdata));
          }
        }
      });
    } catch (error) {
      res.json(helper.showInternalServerErrorResponse("INTERNAL_SERVER_ERROR"));
    }
  },

  getDriverTripDetails: async (req, res) => {
    try {
      var id = req.params._id;

      Trips.getDriverTripDetails(id, (err, resdata) => {
        if (err) {
          return res.json(
            helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err)
          );
        } else {
          if (resdata == null) {
            res.json(helper.showSuccessResponse("NO_DATA_FOUND", {}));
          } else {
            res.json(helper.showSuccessResponse("DATA_SUCCESS", resdata));
          }
        }
      });
    } catch (error) {
      res.json(helper.showInternalServerErrorResponse("INTERNAL_SERVER_ERROR"));
    }
  },

  allScheduleTripsList: async (req, res) => {
    try {
      var verifydata = await Auth.validateDriver(req);
      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse("NOT_AUTHORIZED"));
      }

      Trips.getDriverUpcomingTripsCallback((err, resdata) => {
        if (err) {
          return res.json(
            helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err)
          );
        } else {
          if (resdata.length === 0) {
            res.json(helper.showSuccessResponse("NO_DATA_FOUND", []));
          } else {
            res.json(helper.showSuccessResponse("DATA_SUCCESS", resdata));
          }
        }
      });
    } catch (error) {
      res.json(helper.showInternalServerErrorResponse("INTERNAL_SERVER_ERROR"));
    }
  },

  allDriverTripsHistory: async (req, res) => {
    try {
      var verifydata = await Auth.validateDriver(req);
      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse("NOT_AUTHORIZED"));
      }

      Trips.getDriverTripsHistory(
        { driverId: verifydata._id },
        (err, resdata) => {
          if (err) {
            return res.json(
              helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err)
            );
          } else {
            if (resdata.length === 0) {
              res.json(helper.showSuccessResponse("NO_DATA_FOUND", []));
            } else {
              res.json(helper.showSuccessResponse("DATA_SUCCESS", resdata));
            }
          }
        }
      );
    } catch (error) {
      res.json(helper.showInternalServerErrorResponse("INTERNAL_SERVER_ERROR"));
    }
  },

  getDriverPoolTrips: async (req, res) => {
    try {
      var verifydata = await Auth.validateDriver(req);
      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse("NOT_AUTHORIZED"));
      }

      Trips.getDriverAllPoolTripsCallbackData(
        verifydata._id,
        (err, resdata) => {
          if (err) {
            return res.json(
              helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err)
            );
          } else {
            if (resdata.length === 0) {
              res.json(helper.showSuccessResponse("NO_DATA_FOUND", []));
            } else {
              res.json(helper.showSuccessResponse("DATA_SUCCESS", resdata));
            }
          }
        }
      );
    } catch (error) {
      res.json(helper.showInternalServerErrorResponse("INTERNAL_SERVER_ERROR"));
    }
  },

  noMoreAcceptPoolTrips: async (req, res) => {
    try {
      var verifydata = await Auth.validateDriver(req);
      if (verifydata == null) {
        return res.json(helper.showUnathorizedErrorResponse("NOT_AUTHORIZED"));
      }

      Driver.updateNoMorePoolTripStatus(verifydata._id, (err, resdata) => {
        if (err) {
          return res.json(
            helper.showDatabaseErrorResponse("INTERNAL_DB_ERROR", err)
          );
        } else {
          res.json(helper.showSuccessResponse("DATA_SUCCESS", resdata));
        }
      });
    } catch (error) {
      res.json(helper.showInternalServerErrorResponse("INTERNAL_SERVER_ERROR"));
    }
  },
};
