const express = require('express');
const router = express.Router();
const pcc = require('../../controller/promocodecontroller');

//get all promocode list
router.get('/', pcc.getAllPromocodeList);
//get promocode visiblelist
 router.get('/visibleList', pcc.getAllPromocodeVisibleList);
//Add promocode
 router.post('/addpromocodes', pcc.addPromoCode);
//Validate promo code..apply promocode
 router.post('/validatepromocode', pcc.applyPromoCode);
//promo code list
 router.post('/promocodeslist', pcc.getPromoCodeList);

 module.exports = router;