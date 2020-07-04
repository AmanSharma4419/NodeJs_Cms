var express = require('express');
var router = express.Router();
const multipart = require('connect-multiparty');
const multipartMiddleware = multipart();
const settingController = require('../../adminController/settingController');

router.post('/addPromoCode',settingController.addPromoCode);
router.post('/editPromocode',settingController.editPromocode);
router.post('/updatePromocodeStatus',settingController.updatePromocodeStatus);
router.post('/getPromocodeList',settingController.getPromocodeList);
router.get('/getPromocodeDetails/:id',settingController.getPromocodeDetails);
router.get('/promocodeDelete/:id',settingController.promocodeDelete);
router.post('/deleteMultiplePromocode',settingController.deleteMultiplePromocode);

router.post('/changePassword',settingController.changePassword);

router.get('/getMailTitle',settingController.getMailTitle);
router.post('/editMailTemplate',settingController.editMailTemplate);
router.post('/addMailTemplate',settingController.addMailTemplate);
router.get('/getMailTemplateById/:id', settingController.getMailTemplateById);

router.get('/getSmsTemplate',settingController.getSmsTemplate);
router.post('/editSmsTemplate',settingController.editSmsTemplate);
router.post('/addSmsTemplate',settingController.addSmsTemplate);
router.get('/getSmsTemplateById/:id', settingController.getSmsTemplateById)


router.post('/MailGunConfigUpdate',settingController.MailGunConfigUpdate);
router.get('/getConfigInfo',settingController.getConfigInfo);
router.post('/twilioUpdate',settingController.twilioUpdate);
router.post('/emailConfiguration',settingController.emailConfiguration);
router.post('/googlePlacesApiKeyUpdate',settingController.googlePlacesApiKeyUpdate);
router.post('/IOSAppURLUpdate',settingController.IOSAppURLUpdate);
router.post('/AppNameUpdate',settingController.AppNameUpdate);
router.post('/PaymentConfigUpdate',settingController.PaymentConfigUpdate);
router.post('/GcmApiKeyUpdate',settingController.GcmApiKeyUpdate);
router.post('/AndroidAppUrlUpdate',settingController.AndroidAppUrlUpdate);
router.post('/AppVersionUpdate',settingController.AppVersionUpdate);

router.post('/basicAppSetting',settingController.basicAppSetting);
router.post('/notificationSettingUpdate',settingController.notificationSettingUpdate);
router.post('/iOSCertificatesUpdate',multipartMiddleware,settingController.iOSCertificatesUpdate);
router.get('/getBasicSettingInfo',settingController.getBasicSettingInfo);

module.exports = router;
