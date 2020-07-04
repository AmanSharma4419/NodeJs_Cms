var SquareConnect = require('square-connect');
var defaultClient = SquareConnect.ApiClient.instance;

// Set sandbox url
defaultClient.basePath = 'https://connect.squareupsandbox.com';

// Configure OAuth2 access token for authorization: oauth2
var oauth2 = defaultClient.authentications['oauth2'];
oauth2.accessToken = "EAAAEC6SpD1KrAEt0GdY-I0kl1BQCaqh7rn5B-X7mDvT0XhfBt_dRRhPrtAZGsFq";

//EAAAEC6SpD1KrAEt0GdY-I0kl1BQCaqh7rn5B-X7mDvT0XhfBt_dRRhPrtAZGsFq
//old
//EAAAELPalQfyYXa5PgDoy_gEedKKpq9g_tMymLrWrxMbiO7dlJgxC8XX7r8N0WEp

function createCustomer(data, callback) {

    var apiInstance = new SquareConnect.CustomersApi();

    apiInstance.createCustomer({
        "email_address": data.email
    }).then(function (response) {
        //console.log('API called successfully. Returned data: ' + response.customer.id);
        callback({ status: true, data: response });
    }, function (error) {
        //console.error("LLLLerrr", error.response.body.errors[0].detail);
        callback({ status: false, message: error.response.body.errors[0].detail });
    });
}

function createCustomerCard(data, callback) {

    var apiInstance = new SquareConnect.CustomersApi();

    // String | The Square ID of the customer profile the card is linked to.
    var customerId = data.customerId;

    var cardData = {
        "card_nonce": data.card_nonce,
        "billing_address": {
            "postal_code": data.postal_code,
        }
    }

    //console.log("cardData", cardData);

    apiInstance.createCustomerCard(customerId, cardData).then(function (response) {
        //console.log('API called successfully. Returned data: ' + response);
        callback({ status: true, data: response });
    }, function (error) {
        //console.error(error);
        callback({ status: false, message: error.response.body.errors[0].detail });
    });
}

function chargeCustomer(data, callback) {

    var chargeData = {
        "amount_money": {
            "amount": data.cost,
            "currency": "CAD"
        },
        "source_id": data.cardId, //"ccof:customer-card-id-ok",
        "idempotency_key": new Date().getTime().toString(),
        "customer_id": data.customerId
    }

    //console.log("chargeData", chargeData);

    var apiInstance = new SquareConnect.PaymentsApi();

    apiInstance.createPayment(chargeData).then(function (response) {
        //console.log('API called successfully. Returned data: ' + response);
        callback({ status: true, data: response });
    }, function (error) {
        //console.error(error);
         console.log("error.response.body",error.response.body);
        //console.log("error.response", error.response);
        callback({ status: false, message: error.response.body.errors[0].detail });
    });
}

function deleteCustomerCard(data, callback) {

    var apiInstance = new SquareConnect.CustomersApi();

    var customerId = data.customerId; // String | The ID of the customer that the card on file belongs to.

    var cardId = data.cardId; // String | The ID of the card on file to delete.

    apiInstance.deleteCustomerCard(customerId, cardId).then(function (response) {
        //console.log('API called successfully. Returned data: ' + response);
        callback({ status: true, data: response });
    }, function (error) {
        //console.error(error);
        callback({ status: false, message: error.response.body.errors[0].detail });
    });
}

module.exports = { createCustomer, createCustomerCard, chargeCustomer, deleteCustomerCard }