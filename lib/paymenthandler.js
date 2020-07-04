var config = require('../config/configsetting.json');
var configTable = require('../models/config');
//const keyPublishable = config.PaymentConfig.Stripe_Publishable_Key;

function paymenthandler(data, callback) {

    configTable.getStripeSetting((err, resdata) => {

        var keySecret = config.PaymentConfig.Stripe_Secret_Key;

        if (resdata != undefined && resdata != null) {
            //console.log(resdata.twilio.twilioFrom);
            if (resdata.PaymentConfig.Stripe_Secret_Key != '') {
                keySecret = resdata.PaymentConfig.Stripe_Secret_Key;
            }
        }

        const stripe = require("stripe")(keySecret);

        stripe.charges.create({
            amount: data.cost,
            currency: 'usd',
            customer: data.stripeCustomerId
        }, callback);

    });

}

function paymenthandlerCharge(data, callback) {

    configTable.getStripeSetting((err, resdata) => {

        var keySecret = config.PaymentConfig.Stripe_Secret_Key;

        if (resdata != undefined && resdata != null) {
            //console.log(resdata.twilio.twilioFrom);
            if (resdata.PaymentConfig.Stripe_Secret_Key != '') {
                keySecret = resdata.PaymentConfig.Stripe_Secret_Key;
            }
        }

        const stripe = require("stripe")(keySecret);

        stripe.charges.create({
            amount: data.cost,
            currency: 'usd',
            source: data.stripeToken,
        }, callback);

    });

}


function POhandler(data, callback) {

    configTable.getStripeSetting((err, resdata) => {

        var keySecret = config.PaymentConfig.Stripe_Secret_Key;

        if (resdata != undefined && resdata != null) {
            //console.log(resdata.twilio.twilioFrom);
            if (resdata.PaymentConfig.Stripe_Secret_Key != '') {
                keySecret = resdata.PaymentConfig.Stripe_Secret_Key;
            }
        }

        const stripe = require("stripe")(keySecret);

        stripe.customers.create({
            source: data.token,
            email: data.email
        }, callback);

    });
}


module.exports = { paymenthandler, POhandler, paymenthandlerCharge }
