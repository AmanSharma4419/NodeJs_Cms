var stripeHandler = require('../lib/paymenthandler');
var Square = require('../lib/square');
var POs = require('../models/paymentoptions');
var HotelPOs = require('../models/hotelPaymentOptions');
var DispatcherPOs = require('../models/dispatcherPaymentOptions');

module.exports.paymentByStripe = async (data, responseCallback) => {

    var stripeCost = data.cost * 100;
    var finalcost = parseInt(stripeCost);

    if(data.isHotelTrip === "yes"){
        var getCard = await HotelPOs.getPObyId(data.paymentSourceRefNo);
    }else if(data.isDispatcherTrip === "yes"){
        getCard = await HotelPOs.getPObyId(data.paymentSourceRefNo); 
    }else{
        getCard = await DispatcherPOs.getPObyId(data.paymentSourceRefNo);
    }

    var chargeData = {
        stripeCustomerId: getCard.token,
        cost: finalcost
    }

    //console.log("chargeData", chargeData);

    stripeHandler.paymenthandler(chargeData, (err, presponse) => {
        if (err) {
            responseCallback({ status: false, message: err.message, code: err.code });
        } else {
            responseCallback({ status: true, chargeId: presponse.id });
        }
    });
}

module.exports.paymentBySquare = async (data, responseCallback) => {

    var stripeCost = data.cost * 100;
    var finalcost = parseInt(stripeCost);

    var getCard = await POs.getPObyId(data.paymentSourceRefNo);

    var chargeData = {
        customerId: getCard.token,
        cost: finalcost,
        cardId : getCard.detials.id
    }

    //console.log("chargeData", chargeData);

    Square.chargeCustomer(chargeData, (presponse) => {
        if (presponse.status) {
            responseCallback({ status: true, chargeId: presponse.data.payment.id });
        } else {
            responseCallback({ status: false, message: presponse.message });
        }
    });
}