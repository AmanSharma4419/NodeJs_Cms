const express = require('express');
const router = express.Router();
const pc = require('../../controller/paymentcontroller');

/*
list of payment methods.
gpay
credit or debit card
paytm


currently activated payment methods through user ref
cash
card
gPAY

payment details add
userID:
type of payment method: enum['gpay', 'credit/debitcard', '']
image: logo
name:  can be some name of service or cards last4 digits
image for logo:
token:
detials:{
    can be anything
}

charge fn

*/
//Add payment method from admin
router.post('/addpms', pc.addPaymentMethods);
//Delete payment method by id
router.post('/deletepm', pc.deletePaymentMethodById);
//get payment method list to show in user ends, enabled by admin
router.get('/pmslist', pc.getEnabledPaymentMethodList);
//get user added payment options list
router.get('/poslist', pc.getUserAddedPaymentOptions);
//get user active payment option
router.post('/selectedpo', pc.getUserSelectedPaymentOption);
//update  user selected payment option
router.post('/updateselectedpo', pc.updateUserSelectedPaymentOption);
//add user paymentOption by stripe
router.post('/addpos', pc.addUserPaymentOptionByStripe);
//add user payment by square
//router.post('/addpos', pc.addUserPaymentOptionBySquare);
//Delete user payment option
router.post('/deletepos', pc.deleteUserPaymentOption);
//add user paystack paymentOption
router.post('/addpaystackpos', pc.addUserPaystackPaymentOption);
//router.post('/addmoney', pc.addMoneyToUserWalletByStripe);
router.post('/addmoney', pc.addMoneyToUserWalletBySquare);

module.exports = router;
