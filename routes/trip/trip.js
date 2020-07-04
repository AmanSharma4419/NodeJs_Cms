const express = require('express');
const router = express.Router();
const tripController = require('../../controller/tripController');

router.get('/', tripController.getAllTrips);
router.get('/tripdetails/:_id', tripController.getTripByID);
router.post('/estimatedcost', tripController.estimatedCalculateCost);
router.post('/addtripinstant', tripController.addUserTripInstant);
router.post('/addtrip', tripController.addUserTrip);

//ride hailing
router.post('/estimatedcostbydriver', tripController.estimatedCalculateCostByDriver);
//router.post('/addtripbydriver', tripController.addTripByDriver);

router.post('/accepttrip', tripController.aacceptTripByDriver);
router.post('/driverarrived', tripController.driverArrivedAtCustomerLocation);
router.post('/drivercancel', tripController.waitCancelByDriver);
//trip cancelled by customer
router.post('/customercancel', tripController.tripCancelledByCustomer);
router.post('/schedulecancel', tripController.scheduleTripCancelledByCustomer);
//when driver reject customer trip request
router.get('/rejecttrip', tripController.rejectTripByDriver);

// check date here..when driver start trip after submitting OTP
router.post('/tripstarted', tripController.tripStartedByDriver);
//when trip completed
router.post('/tripcompleted', tripController.tripCompletedAtDestination);
//feedback by customer to driver
router.post('/feedbackcustomer', tripController.feedbackByCustomerToDriver);
//feedback by driver to customer
router.post('/feedbackdriver', tripController.feedbackByDriverToCustomer);
//feedback post
router.post('/feedbackreport', tripController.reportDriver);
//cancle schedule trip
//router.post('/schedulecancel', tripController.scheduleTripCancelledByCustomer);

router.get('/driver/tripdetails/:_id', tripController.getDriverTripDetails);
router.get('/user/tripdetails/:_id', tripController.getCustomerTripDetails);

router.get('/user/alltrips', tripController.getCustomerAllTrips);

router.get('/user/past', tripController.getCustomerPastTrips);

router.get('/user/upcoming', tripController.getCustomerUpcomingTrips);

router.post('/user/addpreferdriver', tripController.addUserPrefDriver);

router.post('/user/removepreferdriver', tripController.removeUserPreferDriver);

router.post('/user/addprefertrip', tripController.addUserPrefTrip);

router.get('/user/preferdriverslist', tripController.getUserPrefferedList);

router.get('/driver/schedulerideslist', tripController.allScheduleTripsList);

router.get('/driver/triphistory', tripController.allDriverTripsHistory);

router.get('/driver/pooltrips', tripController.getDriverPoolTrips);

router.get('/driver/nomoreacceptpooltrips', tripController.noMoreAcceptPoolTrips);

module.exports = router;