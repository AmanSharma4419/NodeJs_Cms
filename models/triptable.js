var mongoose = require("mongoose");
var CarTypes = require("./ServicesCars");

var tripSchema = mongoose.Schema({
  driverRefId: { type: mongoose.Schema.Types.ObjectId, ref: "driver" },
  customerRefId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  hotelId: { type: String },
  hotelIdRef: { type: mongoose.Schema.Types.ObjectId, ref: "dispatcher" },
  dispatcherId: { type: String },
  dispatcherIdRef: { type: mongoose.Schema.Types.ObjectId, ref: "dispatcher" },
  country: { type: String },
  countryCode: { type: String },
  state: { type: String },
  stateCode: { type: String },
  city: { type: String },
  cityCode: { type: String },
  pricingType: { type: String },
  isSurgeTime: { type: String },
  surgeMultiplier: { type: Number },
  tipAmount: { type: Number, default: 0 },
  unit: { type: String },
  tripImageURL: { type: String, default: null },
  cost: { type: Number },
  estimatedCost: { type: Number },
  carTypeRequired: { type: Object },
  tripOTP: { type: String },
  bookFor: { type: String, default: null },
  bookForNumber: { type: String, default: null },
  bookForCountryCode: { type: String, default: null },
  distance: { type: Number },
  distanceToPickup: { type: Number, default: 0 },
  startLocation: {
    type: { type: String, enum: ["Point"], required: true },
    coordinates: { type: [Number], required: true },
  },
  endLocation: {
    type: { type: String, enum: ["Point"] },
    coordinates: { type: [Number], required: true },
  },
  driverLocation: {
    type: { type: String, enum: ["Point"] },
    coordinates: { type: [Number], index: "2dsphere" },
  },
  startLocationAddr: { type: String },
  endLocationAddr: { type: String },
  estimatedTime: { type: Number },
  estimatedTimeToPickup: { type: Number },
  tripConfirmedAt: { type: Date },
  tripStartedAt: { type: Date },
  tripEndedAt: { type: Date },
  driverArrivedAt: { type: Date },
  driverWaitedUpto: { type: Date },
  scheduledAt: { type: Date },
  scheduleCompare: { type: Date },
  scheduleTimezone: { type: String, default: null },
  readableDate: { type: String, default: null },
  scheduleDate: { type: String, default: null },
  scheduleTime: { type: String, default: null },
  canceled: { type: Date },
  customerNumber: { type: Number },
  customerName: { type: String },
  customerId: { type: String },
  driverNumber: { type: Number },
  driveremail: { type: String },
  driverId: { type: String },
  driverName: { type: String },
  driverImage: { type: String },
  driverSelectedCar: { type: Object },
  tripCreatedAt: { type: Date },
  review: {
    customerRating: { type: Number, default: 0 },
    driverRating: { type: Number, default: 0 },
    customerReview: { type: String, default: null },
    driverReview: { type: String, default: null },
    DSubAt: { type: Date, default: null },
    CSubAt: { type: Date, default: null },
  },
  report: {
    section: {
      type: String,
      enum: ["Driver Realted", "Car Hygiene", "Timing Related", "Others"],
      default: "Others",
    },
    subSection: {
      type: String,
      enum: [
        "Rash Driving",
        "Slow Driving",
        "Smelling Bad",
        "Arrived Late",
        "Others",
      ],
      default: "Others",
    },
    customerReport: { type: String, default: null },
    suggestions: { type: String, default: null },
    createdAt: { type: Date, default: null },
  },
  driverAvgRtaing: { type: Number, default: 0 },
  customerAvgRating: { type: Number, default: 0 },
  tripsCompleted: { type: Number, default: 0 },
  tripStatus: { type: String, trim: true },
  pickedStatus: { type: String, enum: ["yes", "no"] },
  pendingBalance: { type: Number, default: 0 },
  paymentMethod: { type: String },
  paymentStatus: {
    type: String,
    enum: ["pending", "completed"],
    default: "pending",
  },
  paymentRefNo: { type: String },
  paymentSourceRefNo: { type: String },
  driverEarning: { type: Number, default: 0 },
  promoCode: { type: String, default: "none" },
  promoCodeCost: { type: Number, default: 0 },
  percentCharge: { type: Number, default: 0 },
  userPendingBalance: { type: Number, default: 0 },
  overallCashBalance: { type: Number, default: 0 },
  trip_type: {
    type: String,
    enum: [
      "instant",
      "schedule",
      "ridehailing",
      "pool",
      "ridenow",
      "ridelater",
    ],
    default: "instant",
    trim: true,
  },
  rideType: {
    type: String,
    enum: ["standard", "child"],
    default: "standard",
    trim: true,
  },
  description: { type: String, default: null },
  prefDriver: { type: Boolean, default: false },
  nearByTempDrivers: { type: Array, default: [] },
  noOfSeats: { type: Number, default: 0 },
  isDriverFound: { type: String, enum: ["yes", "no"], default: "no" },
  isTripAccepted: { type: String, enum: ["yes", "no"], default: "no" },
  isFirstPoolTrip: { type: String, enum: ["yes", "no"], default: "no" },
  tripByHotel: { type: String, enum: ["yes", "no"], default: "no" },
  tripByDispatcher: { type: String, enum: ["yes", "no"], default: "no" },
});
tripSchema.index({ startLocation: "2dsphere" });
tripSchema.index({ endLocation: "2dsphere" });

const Tripsch = (module.exports = mongoose.model("Trips", tripSchema));

module.exports.getTrips = (callback) => {
  Tripsch.find({}, callback);
};

module.exports.getTripsByCustomer = (data, callback) => {
  Tripsch.find({ customerNumber: data.customerNumber }, callback);
};

module.exports.getTripsByDriver = (data, callback) => {
  Tripsch.find({ driverNumber: data.driverNumber }, callback);
};

module.exports.getTripsById = (data) => {
  return Tripsch.findById(
    { _id: data },
    "overallPendingBalance overallCashBalance endLocation unit customerId trip_type tripStatus estimatedCost distance estimatedTime distanceToPickup driverId carTypeRequired promoCode isSurgeTime surgeMultiplier city country tripStartedAt paymentSourceRefNo paymentMethod scheduleTimezone"
  );
};

module.exports.getTripsByIdFindTrip = (data) => {
  return Tripsch.findById({ _id: data });
};

module.exports.getTripDetailsById = (data) => {
  return Tripsch.findById(
    { _id: data },
    "tripStatus trip_type bookFor bookForNumber bookForCountryCode customerNumber"
  );
};

module.exports.getCompleteTripDetailsById = (data) => {
  return Tripsch.findById(
    { _id: data },
    "customerId tripStartedAt estimatedTime distance estimatedCost isSurgeTime surgeMultiplier promoCode carTypeRequired paymentMethod paymentSourceRefNo tripStatus hotelId tripByHotel hotelIdRef dispatcherId tripByDispatcher dispatcherIdRef"
  );
};

module.exports.getUserTripForResume = function (data, callback) {
  return Tripsch.find({ customerId: data.customerId }, callback)
    .sort({ tripCreatedAt: -1 })
    .limit(1);
};

module.exports.getDriverTripForResume = function (data, callback) {
  return Tripsch.find({ driverId: data.driverId }, callback)
    .sort({ tripConfirmedAt: -1 })
    .limit(1);
};

module.exports.getTripsByIdCallback = (data, callback) => {
  Tripsch.findById({ _id: data })
    .populate("customerRefId")
    .populate("driverRefId")
    .exec(callback);
};

module.exports.getTripsByIdpref = (data) => {
  return Tripsch.findOne(
    { _id: data },
    {
      percentCharge: 0,
      customerId: 0,
      promoCode: 0,
      paymentSourceRefNo: 0,
      paymentRefNo: 0,
      paymentMethod: 0,
    }
  );
};

module.exports.getTripsByIddloc = (data) => {
  return Tripsch.findById(
    { _id: data },
    "tripStatus estimatedCost distance driverId carTypeRequired startLocation"
  );
};

module.exports.getTripsByIdPanic = (data) => {
  return Tripsch.findById(
    { _id: data },
    "customerName driverName driverNumber driveremail driverSelectedCar driverId"
  );
};

module.exports.addScheduleTrip = function (data, callback) {
  var datad = {
    customerId: data.customerId,
    customerRefId: data.customerId,
    customerNumber: data.customerNumber,
    customerName: data.customerName,
    country: data.country,
    countryCode: data.countryCode,
    state: data.state,
    stateCode: data.stateCode,
    city: data.city,
    cityCode: data.cityCode,
    pricingType: data.pricingType,
    isSurgeTime: data.isSurgeTime,
    surgeMultiplier: data.surgeMultiplier,
    unit: data.unit,
    estimatedCost: data.estimatedCost,
    carTypeRequired: data.carTypeRequired,
    distance: data.distance,
    startLocation: data.startLocation,
    endLocation: data.endLocation,
    estimatedTime: data.estimatedTime,
    endLocationAddr: data.endLocationAddr,
    startLocationAddr: data.startLocationAddr,
    paymentMethod: data.paymentMethod,
    paymentSourceRefNo: data.paymentSourceRefNo,
    paymentRefNo: data.paymentRefNo,
    tripStatus: constant.TRIP_SCHEDULED,
    trip_type: data.trip_type,
    rideType: data.rideType,
    scheduledAt: data.scheduledAt,
    scheduleCompare: data.scheduleCompare,
    scheduleTimezone: data.scheduleTimezone,
    readableDate: data.readableDate,
    paymentStatus: data.paymentStatus,
    scheduleDate: data.scheduleDate,
    scheduleTime: data.scheduleTime,
    description: data.description,
    promoCode: data.promoCode,
    userPendingBalance: data.userPendingBalance,
    tripCreatedAt: new Date(),
  };

  Tripsch.create(datad, callback);
};

module.exports.addScheduleHotelTrip = function (data, callback) {
  var datad = {
    customerId: data.customerId,
    customerRefId: data.customerId,
    customerNumber: data.customerNumber,
    customerName: data.customerName,
    country: data.country,
    countryCode: data.countryCode,
    state: data.state,
    stateCode: data.stateCode,
    city: data.city,
    cityCode: data.cityCode,
    pricingType: data.pricingType,
    isSurgeTime: data.isSurgeTime,
    surgeMultiplier: data.surgeMultiplier,
    unit: data.unit,
    estimatedCost: data.estimatedCost,
    carTypeRequired: data.carTypeRequired,
    distance: data.distance,
    startLocation: data.startLocation,
    endLocation: data.endLocation,
    estimatedTime: data.estimatedTime,
    endLocationAddr: data.endLocationAddr,
    startLocationAddr: data.startLocationAddr,
    paymentMethod: data.paymentMethod,
    paymentSourceRefNo: data.paymentSourceRefNo,
    paymentRefNo: data.paymentRefNo,
    tripStatus: constant.TRIP_SCHEDULED,
    trip_type: "ridelater",
    tripByHotel: data.tripByHotel,
    hotelId: data.hotelId,
    hotelIdRef: data.hotelIdRef,
    rideType: data.rideType,
    scheduledAt: data.scheduledAt,
    scheduleCompare: data.scheduleCompare,
    scheduleTimezone: data.scheduleTimezone,
    readableDate: data.readableDate,
    paymentStatus: data.paymentStatus,
    scheduleDate: data.scheduleDate,
    scheduleTime: data.scheduleTime,
    description: data.description,
    promoCode: data.promoCode,
    userPendingBalance: data.userPendingBalance,
    tripCreatedAt: new Date(),
  };

  Tripsch.create(datad, callback);
};

module.exports.addScheduleDispatcherTrip = function (data, callback) {
  var datad = {
    customerId: data.customerId,
    customerRefId: data.customerId,
    customerNumber: data.customerNumber,
    customerName: data.customerName,
    country: data.country,
    countryCode: data.countryCode,
    state: data.state,
    stateCode: data.stateCode,
    city: data.city,
    cityCode: data.cityCode,
    pricingType: data.pricingType,
    isSurgeTime: data.isSurgeTime,
    surgeMultiplier: data.surgeMultiplier,
    unit: data.unit,
    estimatedCost: data.estimatedCost,
    carTypeRequired: data.carTypeRequired,
    distance: data.distance,
    startLocation: data.startLocation,
    endLocation: data.endLocation,
    estimatedTime: data.estimatedTime,
    endLocationAddr: data.endLocationAddr,
    startLocationAddr: data.startLocationAddr,
    paymentMethod: data.paymentMethod,
    paymentSourceRefNo: data.paymentSourceRefNo,
    paymentRefNo: data.paymentRefNo,
    tripStatus: constant.TRIP_SCHEDULED,
    trip_type: "ridelater",
    tripByDispatcher: data.tripByDispatcher,
    dispatcherId: data.hotelId,
    dispatcherIdRef: data.hotelIdRef,
    rideType: data.rideType,
    scheduledAt: data.scheduledAt,
    scheduleCompare: data.scheduleCompare,
    scheduleTimezone: data.scheduleTimezone,
    readableDate: data.readableDate,
    paymentStatus: data.paymentStatus,
    scheduleDate: data.scheduleDate,
    scheduleTime: data.scheduleTime,
    description: data.description,
    promoCode: data.promoCode,
    userPendingBalance: data.userPendingBalance,
    tripCreatedAt: new Date(),
  };

  Tripsch.create(datad, callback);
};

module.exports.addTripInstant = function (data, callback) {
  var datad = {
    customerId: data.customerId,
    customerRefId: data.customerId,
    customerNumber: data.customerNumber,
    customerName: data.customerName,
    customerAvgRating: data.customerAvgRating,
    country: data.country,
    countryCode: data.countryCode,
    state: data.state,
    stateCode: data.stateCode,
    city: data.city,
    cityCode: data.cityCode,
    pricingType: data.pricingType,
    isSurgeTime: data.isSurgeTime,
    surgeMultiplier: data.surgeMultiplier,
    unit: data.unit,
    estimatedCost: data.estimatedCost,
    carTypeRequired: data.carTypeRequired,
    nearByTempDrivers: data.nearByTempDrivers,
    isDriverFound: data.isDriverFound,
    distance: data.distance,
    startLocation: data.startLocation,
    endLocation: data.endLocation,
    estimatedTime: data.estimatedTime,
    endLocationAddr: data.endLocationAddr,
    startLocationAddr: data.startLocationAddr,
    paymentMethod: data.paymentMethod,
    paymentSourceRefNo: data.paymentSourceRefNo,
    tripStatus: constant.TRIP_FINDING,
    readableDate: data.readableDate,
    scheduleDate: data.scheduleDate,
    scheduleTime: data.scheduleTime,
    trip_type: "instant",
    bookFor: data.bookFor,
    bookForNumber: data.bookForNumber,
    bookForCountryCode: data.bookForCountryCode,
    rideType: data.rideType,
    description: data.description,
    promoCode: data.promoCode,
    tripCreatedAt: new Date(),
  };

  Tripsch.create(datad, callback);
};

module.exports.addTripInstantHotel = function (data, callback) {
  console.log("Data to save", data);
  var datad = {
    customerId: data.customerId,
    customerRefId: data.customerId,
    customerNumber: data.customerNumber,
    customerName: data.customerName,
    customerAvgRating: data.customerAvgRating,
    country: data.country,
    countryCode: data.countryCode,
    state: data.state,
    stateCode: data.stateCode,
    city: data.city,
    cityCode: data.cityCode,
    pricingType: data.pricingType,
    isSurgeTime: data.isSurgeTime,
    surgeMultiplier: data.surgeMultiplier,
    unit: data.unit,
    estimatedCost: data.estimatedCost,
    carTypeRequired: data.carTypeRequired,
    nearByTempDrivers: data.nearByTempDrivers,
    isDriverFound: data.isDriverFound,
    distance: data.distance,
    startLocation: data.startLocation,
    endLocation: data.endLocation,
    estimatedTime: data.estimatedTime,
    endLocationAddr: data.endLocationAddr,
    startLocationAddr: data.startLocationAddr,
    paymentMethod: data.paymentMethod,
    paymentSourceRefNo: data.paymentSourceRefNo,
    tripStatus: constant.TRIP_FINDING,
    readableDate: data.readableDate,
    scheduleDate: data.scheduleDate,
    scheduleTime: data.scheduleTime,
    trip_type: "ridenow",
    tripByHotel: data.tripByHotel,
    hotelId: data.hotelId,
    hotelIdRef: data.hotelIdRef,
    bookFor: data.bookFor,
    bookForNumber: data.bookForNumber,
    bookForCountryCode: data.bookForCountryCode,
    rideType: data.rideType,
    description: data.description,
    promoCode: data.promoCode,
    tripCreatedAt: new Date(),
  };

  Tripsch.create(datad, callback);
};

module.exports.addTripInstantDispatcher = function (data, callback) {
  console.log("Data to save", data);
  var datad = {
    customerId: data.customerId,
    customerRefId: data.customerId,
    customerNumber: data.customerNumber,
    customerName: data.customerName,
    customerAvgRating: data.customerAvgRating,
    country: data.country,
    countryCode: data.countryCode,
    state: data.state,
    stateCode: data.stateCode,
    city: data.city,
    cityCode: data.cityCode,
    pricingType: data.pricingType,
    isSurgeTime: data.isSurgeTime,
    surgeMultiplier: data.surgeMultiplier,
    unit: data.unit,
    estimatedCost: data.estimatedCost,
    carTypeRequired: data.carTypeRequired,
    nearByTempDrivers: data.nearByTempDrivers,
    isDriverFound: data.isDriverFound,
    distance: data.distance,
    startLocation: data.startLocation,
    endLocation: data.endLocation,
    estimatedTime: data.estimatedTime,
    endLocationAddr: data.endLocationAddr,
    startLocationAddr: data.startLocationAddr,
    paymentMethod: data.paymentMethod,
    paymentSourceRefNo: data.paymentSourceRefNo,
    tripStatus: constant.TRIP_FINDING,
    readableDate: data.readableDate,
    scheduleDate: data.scheduleDate,
    scheduleTime: data.scheduleTime,
    trip_type: "ridenow",
    tripByDispatcher: data.tripByDispatcher,
    dispatcherId: data.dispatcherId,
    dispatcherIdRef: data.dispatcherIdRef,
    bookFor: data.bookFor,
    bookForNumber: data.bookForNumber,
    bookForCountryCode: data.bookForCountryCode,
    rideType: data.rideType,
    description: data.description,
    promoCode: data.promoCode,
    tripCreatedAt: new Date(),
  };

  Tripsch.create(datad, callback);
};

module.exports.addTripInstantPOOL = function (data, callback) {
  var datad = {
    customerId: data.customerId,
    customerRefId: data.customerId,
    customerNumber: data.customerNumber,
    customerName: data.customerName,
    customerAvgRating: data.customerAvgRating,
    country: data.country,
    countryCode: data.countryCode,
    state: data.state,
    stateCode: data.stateCode,
    city: data.city,
    cityCode: data.cityCode,
    pricingType: data.pricingType,
    isSurgeTime: data.isSurgeTime,
    surgeMultiplier: data.surgeMultiplier,
    unit: data.unit,
    estimatedCost: data.estimatedCost,
    noOfSeats: data.noOfSeats,
    carTypeRequired: data.carTypeRequired,
    nearByTempDrivers: data.nearByTempDrivers,
    isDriverFound: data.isDriverFound,
    distance: data.distance,
    startLocation: data.startLocation,
    endLocation: data.endLocation,
    estimatedTime: data.estimatedTime,
    endLocationAddr: data.endLocationAddr,
    startLocationAddr: data.startLocationAddr,
    paymentMethod: data.paymentMethod,
    paymentSourceRefNo: data.paymentSourceRefNo,
    tripStatus: constant.TRIP_FINDING,
    pickedStatus: "no",
    readableDate: data.readableDate,
    scheduleDate: data.scheduleDate,
    scheduleTime: data.scheduleTime,
    trip_type: "pool",
    bookFor: data.bookFor,
    bookForNumber: data.bookForNumber,
    bookForCountryCode: data.bookForCountryCode,
    rideType: data.rideType,
    description: data.description,
    promoCode: data.promoCode,
    tripCreatedAt: new Date(),
  };

  Tripsch.create(datad, callback);
};

module.exports.addTripByDriver = function (data, callback) {
  var datad = {
    estimatedCost: data.estimatedCost,
    carTypeRequired: data.carTypeRequired,
    distance: data.distance,
    startLocation: data.startLocation,
    endLocation: data.endLocation,
    estimatedTime: data.estimatedTime,
    endLocationAddr: data.endLocationAddr,
    startLocationAddr: data.startLocationAddr,
    paymentMethod: data.paymentMethod,
    tripStatus: constant.TRIP_DESTINATION_INROUTE,
    trip_type: "ridehailing",
    bookFor: data.bookFor,
    bookForNumber: data.bookForNumber,
    bookForCountryCode: data.bookForCountryCode,
    tripCreatedAt: new Date(),
    driverRefId: data.driverId,
    driveremail: data.driveremail,
    driverId: data.driverId,
    driverNumber: data.driverNumber,
    driverName: data.driverName,
    driverImage: data.driverImage,
    distanceToPickup: 0,
    driverLocation: data.driverLocation,
    tripConfirmedAt: new Date(),
    driverAvgRtaing: data.driverAvgRtaing,
    tripOTP: data.tripOTP,
    tripsCompleted: data.tripsCompleted,
    driverSelectedCar: data.driverSelectedCar,
    description: data.description,
    promoCode: "none",
    driverArrivedAt: new Date(),
    tripStartedAt: new Date(),
  };
  Tripsch.create(datad, callback);
};

module.exports.addHotelRideNowTrip = (data, callback) => {
  data.tripStatus = "searching";
  data.paymentStatus = "pending";
  data.tripCreatedAt = new Date();
  Tripsch.create(data, callback);
};

module.exports.addHotelRideLaterTrip = (data, callback) => {
  data.tripStatus = "schedule";
  data.paymentStatus = "pending";
  data.tripCreatedAt = new Date();
  Tripsch.create(data, callback);
};

module.exports.addMapImage = (data, callback) => {
  var query = { _id: data._id };
  var update = {
    tripImageURL: data.URL,
  };
  Tripsch.findOneAndUpdate(query, update, { new: true }, callback);
};

module.exports.updateScheduleCronTrips = (data, callback) => {
  var query = { _id: data.tripId };
  var update = {
    nearByTempDrivers: data.nearByTempDrivers,
    isDriverFound: data.isDriverFound,
  };
  Tripsch.findOneAndUpdate(query, update, { new: true }, callback);
};

///////////////////////  driver part ///////////////////////////////
module.exports.ConfirmTripDriver = (data, callback) => {
  console.log("Confirm trip data", data);
  var query = { _id: data.tripId };
  var update = {
    driverRefId: data.driverId,
    driveremail: data.driveremail,
    driverId: data.driverId,
    driverNumber: data.driverNumber,
    driverName: data.driverName,
    driverImage: data.driverImage,
    //estimatedTimeToPickup: data.estimatedTimeToPickup,
    //distanceToPickup: data.distanceToPickup,
    driverLocation: data.driverLocation,
    tripConfirmedAt: new Date(),
    driverAvgRtaing: data.driverAvgRtaing,
    tripOTP: data.tripOTP,
    tripsCompleted: data.tripsCompleted,
    overallPendingBalance: data.overallPendingBalance,
    overallCashBalance: data.overallCashBalance,
    driverSelectedCar: data.driverSelectedCar,
    tripStatus: constant.TRIP_PICKUP_INROUTE,
    isFirstPoolTrip: data.isFirstPoolTrip,
  };
  Tripsch.findOneAndUpdate(
    query,
    update,
    {
      fields: {
        trip_type: 1,
        nearByTempDrivers: 1,
        customerId: 1,
        driverId: 1,
        driverName: 1,
      },
      new: true,
    },
    callback
  );
};

module.exports.driverArrivedAt = (id, callback) => {
  var query = { _id: id };
  var update = {
    tripStatus: constant.TRIP_ARRIVED,
    driverArrivedAt: new Date(),
  };
  Tripsch.findOneAndUpdate(
    query,
    update,
    { fields: { customerId: 1, driverName: 1 }, new: true },
    callback
  );
};

module.exports.driverWaitedCancel = (id, callback) => {
  var query = { _id: id };
  var update = {
    driverWaitedUpto: new Date(),
    tripStatus: constant.TRIP_CANCELLED,
  };

  Tripsch.findOneAndUpdate(query, update, {
    fields: {
      driverId: 1,
      customerId: 1,
      driverArrivedAt: 1,
      customerRefId: 1,
      carTypeRequired: 1,
      paymentMethod: 1,
      paymentSourceRefNo: 1,
    },
    new: true,
  })
    .populate({ path: "customerRefId", select: "userPendingBalance" })
    .exec(callback);
};

module.exports.customerCancel = (id, callback) => {
  var query = { _id: id };
  var update = {
    canceled: new Date(),
    tripStatus: constant.TRIP_CANCELLED,
  };

  Tripsch.findOneAndUpdate(query, update, { new: true }, callback);

  //     .populate({path:"driverRefId",select:"overallPendingBalance tripsCompleted"})
  //     .exec(callback);
};

module.exports.tripStarted = (data, callback) => {
  var query = { _id: data.tripId };
  var update = {
    tripStartedAt: new Date(),
    tripStatus: constant.TRIP_DESTINATION_INROUTE,
    prefDriver: data.prefDriver,
  };

  Tripsch.findOneAndUpdate(
    query,
    update,
    {
      fields: { prefDriver: 1, customerId: 1, estimatedTime: 1, trip_type: 1 },
      new: true,
    },
    callback
  );
};

module.exports.tripEnd = (data, callback) => {
  var query = { _id: data.tripId };
  var update = {
    tripEndedAt: new Date(),
    tripStatus: constant.TRIP_COMPLETED,
    cost: data.cost,
    promoCodeCost: data.promoCodeCost,
    estimatedTime: data.estimatedTime,
    driverEarning: data.driverEarning,
  };

  Tripsch.findOneAndUpdate(
    query,
    update,
    {
      fields: {
        trip_type: 1,
        customerName: 1,
        driverName: 1,
        carTypeRequired: 1,
        driverSelectedCar: 1,
        startLocationAddr: 1,
        endLocationAddr: 1,
        driveremail: 1,
        cost: 1,
        promoCode: 1,
        promoCodeCost: 1,
        estimatedTime: 1,
        driverEarning: 1,
        driverId: 1,
        userPendingBalance: 1,
        customerId: 1,
      },
      new: true,
    },
    callback
  );
};

module.exports.feedbackByCustomer = (id, data, callback) => {
  var query = { _id: id };
  var update = {
    "review.driverRating": data.driverRating,
    //"review.driverReview":              data.driverReview,
    "review.CSubAt": new Date(),
    tipAmount: data.tipAmount,
  };

  return Tripsch.findOneAndUpdate(
    query,
    update,
    { upsert: true, new: true },
    callback
  );
};

module.exports.feedbackByDriver = (id, data, callback) => {
  var query = { _id: id };
  var update = {
    "review.customerRating": data.customerRating,
    "review.DSubAt": new Date(),
  };

  return Tripsch.findOneAndUpdate(
    query,
    update,
    { upsert: true, new: true },
    callback
  );
};

module.exports.feedbackReport = (id, data, callback) => {
  var query = { _id: id };
  var update = {
    report: {
      section: data.section,
      subSection: data.subSection,
      customerReport: data.customerReport,
      suggestions: data.suggestions,
      createdAt: new Date(),
    },
  };

  return Tripsch.findOneAndUpdate(
    query,
    update,
    { fields: { customerNumber: 0 }, new: true },
    callback
  );
};

module.exports.payment = (data, callback) => {
  var query = { _id: data.tripId };
  var update = {
    paymentRefNo: data.paymentRefNo,
    paymentSourceRefNo: data.paymentSourceRefNo,
  };
  return Tripsch.findOneAndUpdate(
    query,
    update,
    { fields: "cost paymentSourceRefNo paymentRefNo", new: true },
    callback
  );
};

module.exports.getCostPayment = (data) => {
  return Tripsch.findById({ _id: data.tripId }, "cost");
};

module.exports.otpConfirm = (data) => {
  return Tripsch.findById({ _id: data }, "tripOTP customerId");
};

module.exports.scheduleTrip = async function (data, callback) {
  var datad = {
    customerRefId: data.customerId,
    customerNumber: data.mobileNumber,
    customerName: data.name,
    customerId: data.customerId,
    // will use it at complete trip cost:               data.cost,
    estimatedCost: data.estimatedCost,
    carTypeRequired: data.carTypeRequired,
    distance: data.distance,
    startLocation: data.startLocation,
    endLocation: data.endLocation,
    estimatedTime: data.estimatedTime,
    tripCreatedAt: new Date(),
    customerAvgRating: data.customerAvgRating,
    endLocationAddr: data.endLocationAddr,
    startLocationAddr: data.startLocationAddr,
    paymentMethod: data.paymentMethod,
    paymentSourceRefNo: data.paymentSourceRefNo,
    tripStatus: constant.TRIP_SCHEDULED,
    promoCode: data.promoCode,
    scheduledAt: data.scheduledAt,
    scheduleCompare: data.scheduleCompare,
    scheduleTimezone: data.scheduleTimezone,
    trip_type: data.trip_type,
    description: data.description,
    readableDate: data.readableDate,
  };
  var mystr = data.startLocationAddr.split(",");
  var state = mystr[mystr.length - 2].replace(/\d+/g, "").trim();
  datad.country = mystr[mystr.length - 1].trim();
  datad.city = mystr[mystr.length - 3].trim();
  datad.state = state;
  AddRefToPrefferedDriver;
  var getcost = await CarTypes.getCarsTypeCity({
    country: datad.country,

    carType: datad.carTypeRequired,
  });
  //datad.estimatedCost = getcost.costPerKm* datad.distance;
  datad.estimatedCost = Math.round(datad.estimatedCost * 100) / 100;
  datad.percentCharge = getcost.percentCharge;
  Tripsch.create(datad, callback);
};

module.exports.getCustomerPastTrips = (data, callback) => {
  Tripsch.find(
    {
      customerId: data.customerId,
      tripStatus: { $in: [constant.TRIP_COMPLETED, constant.TRIP_CANCELLED] },
    },
    callback
  ).sort({ tripEndedAt: -1 });
};

module.exports.getCustomerPastTripsASync = (data, callback) => {
  return Tripsch.find(
    {
      customerId: data.customerId,
      tripStatus: { $in: [constant.TRIP_COMPLETED, constant.TRIP_CANCELLED] },
    },
    callback
  ).sort({ tripEndedAt: -1 });
};

module.exports.getDriverPastTripsASync = (data, callback) => {
  return Tripsch.find(
    {
      driverId: data.driverId,
      tripStatus: { $in: [constant.TRIP_COMPLETED, constant.TRIP_CANCELLED] },
    },
    callback
  ).sort({ tripEndedAt: -1 });
};

module.exports.getCustomerUpcomingTrips = (data, callback) => {
  Tripsch.find(
    {
      customerId: data.customerId,
      tripStatus: constant.TRIP_SCHEDULED,
      scheduleCompare: { $gt: new Date() },
    },
    callback
  ).sort({ tripCreatedAt: -1 });
};

module.exports.getCustomerUpcomingTripsAsync = (data, callback) => {
  return Tripsch.find(
    {
      customerId: data.customerId,
      tripStatus: constant.TRIP_SCHEDULED,
      scheduleCompare: { $gt: new Date() },
    },
    callback
  ).sort({ tripCreatedAt: -1 });
};

module.exports.getDriverUpcomingTripsAsync = (data, callback) => {
  return Tripsch.find(
    {
      driverId: data.driverId,
      tripStatus: constant.TRIP_SCHEDULED,
      scheduleCompare: { $gt: new Date() },
    },
    callback
  ).sort({ tripCreatedAt: -1 });
};

module.exports.getDriverUpcomingTripsCallback = (callback) => {
  Tripsch.find(
    {
      tripStatus: constant.TRIP_SCHEDULED,
      scheduleCompare: { $gt: new Date() },
    },
    "readableDate scheduleDate scheduleTime distance estimatedCost cost estimatedTime startLocation startLocationAddr endLocation endLocationAddr customerName customerNumber countryCode",
    callback
  ).sort({ tripCreatedAt: -1 });
};

module.exports.getDriverTripsHistory = (data, callback) => {
  Tripsch.find(
    {
      driverId: data.driverId,
      tripStatus: { $in: [constant.TRIP_COMPLETED, constant.TRIP_CANCELLED] },
    },
    callback
  ).sort({ tripCreatedAt: -1 });
};

module.exports.getHoteRideNowTrips = (hotelId, callback) => {
  Tripsch.find({ hotelId: hotelId, trip_type: "ridenow" }, callback).sort({
    tripCreatedAt: -1,
  });
};

module.exports.getHoteRideLaterTrips = (hotelId, callback) => {
  Tripsch.find({ hotelId: hotelId, trip_type: "ridelater" }, callback).sort({
    tripCreatedAt: -1,
  });
};

module.exports.getCompletedTripById = (id, callback) => {
  Tripsch.find({ _id: id })
    .populate({
      path: "driverRefId",
      populate: {
        path: "selectedCar",
        model: "Cars",
      },
    })
    .exec(callback);
};

module.exports.getCustomerTripDetails = (id, callback) => {
  Tripsch.findById(
    id,
    "trip_type countryCode tripStatus rideType tripOTP driverId prefDriver driverName driverNumber driverImage tripCompleted driverAvgRtaing driverSelectedCar estimatedCost startLocation startLocationAddr endLocation endLocationAddr driver description paymentSourceRefNo paymentMethod cost"
  )
    .populate({
      path: "driverRefId",
      populate: {
        path: "selectedCar",
        model: "Cars",
      },
      select: {
        password: 0,
        updatedAt: 0,
        CompletedTripsInfo: 0,
        token: 0,
        licenceExpDate: 0,
        dl: 0,
        OTPexp: 0,
        restToken: 0,
        address: 0,
        licenceExpDate: 0,
        status: 0,
        accountDetails: 0,
        avgRating: 0,
        cars: 0,
        countryCode: 0,
        currentTripId: 0,
        documentsList: 0,
        driverLocation: 0,
        driverStatus: 0,
        email: 0,
        firebaseToken: 0,
        isBlocked: 0,
        isRequestSend: 0,
        isTripAccepted: 0,
        languageDetails: 0,
        mobileNumber: 0,
        name: 0,
        OTP: 0,
        overallCashBalance: 0,
        overallPendingBalance: 0,
        profileImage: 0,
        requestTrips: 0,
        selectedCarTypeId: 0,
        socketConnectedAt: 0,
        socketId: 0,
        socketStatus: 0,
        tripRequestTime: 0,
        tripsCompleted: 0,
        driverSelectedCar: 0,
        endLocation: 0,
        endLocationAddr: 0,
        estimatedCost: 0,
        prefDriver: 0,
        rideType: 0,
      },
      options: {},
      match: { status: "approved" },
    })
    .exec(callback);
};

module.exports.getDriverTripDetails = (id, callback) => {
  Tripsch.findById(
    id,
    "trip_type countryCode tripStatus rideType customerId customerName customerNumber customerAvgRating distance estimatedCost cost estimatedTime startLocation startLocationAddr endLocation endLocationAddr description cost",
    callback
  );
};

module.exports.getDriverCurrentPoolTrips = (driverId, callback) => {
  return Tripsch.find(
    {
      driverId: driverId,
      trip_type: "pool",
      tripStatus: {
        $in: [
          constant.TRIP_PICKUP_INROUTE,
          constant.TRIP_ARRIVED,
          constant.TRIP_DESTINATION_INROUTE,
        ],
      },
    },
    callback
  ).sort({ tripCreatedAt: -1 });
};

module.exports.getDriverAllPoolTrips = (driverId, callback) => {
  return Tripsch.find(
    {
      driverId: driverId,
      trip_type: "pool",
      tripStatus: {
        $in: [
          constant.TRIP_PICKUP_INROUTE,
          constant.TRIP_ARRIVED,
          constant.TRIP_DESTINATION_INROUTE,
        ],
      },
    },
    callback
  ).sort({ tripCreatedAt: -1 });
};

module.exports.getDriverAllPoolTripsCallback = (driverId, callback) => {
  Tripsch.find(
    {
      driverId: driverId,
      trip_type: "pool",
      tripStatus: {
        $in: [
          constant.TRIP_PICKUP_INROUTE,
          constant.TRIP_ARRIVED,
          constant.TRIP_DESTINATION_INROUTE,
        ],
      },
    },
    "customerId tripStatus",
    callback
  ).sort({ tripCreatedAt: -1 });
};

module.exports.getDriverAllPoolTripsCallbackData = (driverId, callback) => {
  Tripsch.find(
    {
      driverId: driverId,
      trip_type: "pool",
      tripStatus: {
        $in: [
          constant.TRIP_PICKUP_INROUTE,
          constant.TRIP_ARRIVED,
          constant.TRIP_DESTINATION_INROUTE,
        ],
      },
    },
    "trip_type tripStatus rideType customerId customerName customerNumber customerAvgRating distance estimatedCost cost estimatedTime startLocation startLocationAddr endLocation endLocationAddr",
    callback
  ).sort({ tripCreatedAt: -1 });
};

module.exports.getTripById = (id, callback) => {
  return Tripsch.findById(id, "tripStatus isTripAccepted", callback);
};

module.exports.getHotelTripById = (id, callback) => {
  return Tripsch.findById(id, callback);
};

module.exports.getAllTripsWithFilter = (
  obj,
  sortByField,
  sortOrder,
  paged,
  pageSize,
  status,
  callback
) => {
  Tripsch.aggregate(
    [
      { $match: { tripStatus: { $in: status } } },
      { $match: obj },
      {
        $lookup: {
          from: "drivers",
          localField: "driverRefId",
          foreignField: "_id",
          as: "driver",
        },
      },
      { $sort: { [sortByField]: parseInt(sortOrder) } },
      { $skip: (paged - 1) * pageSize },
      { $limit: parseInt(pageSize) },
    ],
    callback
  );
};
