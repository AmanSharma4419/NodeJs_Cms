const PayStack = require('paystack-node');
var config = require('../config/configsetting');
const keySecret = config.PaymentConfig.Stripe_Secret_Key;
const paystack = new PayStack(keySecret);
var POs = require('../models/paymentoptions');
var customer = require('../models/userTable');

const verifyTransactionByReferenceNumber = async function (referenceNumber, callback) {
    try {
        const verify = await paystack.verifyTransaction({ reference: referenceNumber });
        callback(verify.body);
    } catch (error) {
        callback(error.body);
    }
}

const refundFirstTransaction = async function (referenceNumber, callback) {
    try {
        const refund = await paystack.createRefund({ transaction: referenceNumber });
        callback(refund.body);
    } catch (error) {
        callback(error.body);
    }
}

const charge = async function (data, callback) {

    try {
        const customerData = await customer.getUserByIdAsync(data.customerId);

        const obj = {
            authorization_code: data.paystackAuthToken,
            amount: data.cost,
            email: customerData.email
        }
        //console.log('payment opbject', obj);
        const result = await paystack.chargeAuthorization(obj);
        // console.log('payment deduct response', result);
        callback(result.body);

    } catch (error) {
        //console.log('error while charge payment', error)
        callback({ status: false, message: 'error while charge payment' });
    }

}

module.exports = {
    verifyTransactionByReferenceNumber: verifyTransactionByReferenceNumber,
    refundFirstTransaction: refundFirstTransaction,
    charge: charge
}