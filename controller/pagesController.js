const Pages = require('../models/contenttable');
const faq = require('../models/faq.js');

module.exports = {

   getAboutUsContent: async (req, res) => {

      var languageCode = req.get('accept-language');
      var contentData = null;
      console.log("languageCODE", languageCode);
      if (!languageCode) {
         console.log("Inside if in about", languageCode);
         languageCode = 'en';
         contentData = await Pages.findOne({ name: "ABOUT_US" });
      } else {
         contentData = await Pages.findOne({ name: "ABOUT_US" });
         //contentData = await Pages.getContentData({ name: "ABOUT_US", languageCode: languageCode });

         /*if (contentData == null) {
            contentData = await Pages.getContentData({ name: "ABOUT_US", languageCode: 'en' });
         }*/
      }
      console.log("Content data", contentData);
      if (contentData == null) {
         res.render('aboutus', { title: '', data: 'No Content Added' });
      } else {
         res.render('aboutus', { title: '', data: contentData.content });
      }
   },

   getPrivacyPolicyContent: async (req, res) => {
      var languageCode = req.get('accept-language');
      var contentData = null;

      if (!languageCode) {
         languageCode = 'en';
         contentData = await Pages.findOne({ name: "PRIVACY_POLICY"});
      } else {
         contentData = await Pages.findOne({ name: "PRIVACY_POLICY"});
         //contentData = await Pages.getContentData({ name: "PRIVACY_POLICY", languageCode: languageCode });

         /*if (contentData == null) {
            contentData = await Pages.getContentData({ name: "PRIVACY_POLICY", languageCode: 'en' });
         }*/
      }

      if (contentData == null) {
         res.render('privacypolicy', { title: '', data: 'No Content Added' });
      } else {
         res.render('privacypolicy', { title: '', data: contentData.content });
      }
   },

   getRefundPolicyContent: async (req, res) => {
      var languageCode = req.get('accept-language');
      var contentData = null;

      if (!languageCode) {
         languageCode = 'en';
         contentData = await Pages.findOne({ name: "REFUND_POLICY"});
      } else {
         contentData = await Pages.findOne({ name: "REFUND_POLICY"});
         //contentData = await Pages.getContentData({ name: "REFUND_POLICY", languageCode: languageCode });
         /*if (contentData == null) {
            contentData = await Pages.getContentData({ name: "REFUND_POLICY", languageCode: 'en' });
         }*/
      }

      if (contentData == null) {
         res.render('refundPolicy', { title: '', data: 'No Content Added' });
      } else {
         res.render('refundPolicy', { title: '', data: contentData.content });
      }
   },

   getTermsAndConditionsContent: async (req, res) => {
      var languageCode = req.get('accept-language');
      var contentData = null;

      if (!languageCode) {
         languageCode = 'en';
         contentData = await Pages.findOne({ name: "TERMS_CONDITIONS"});
      } else {
         contentData = await Pages.findOne({ name: "TERMS_CONDITIONS"});
         //contentData = await Pages.getContentData({ name: "TERMS_CONDITIONS", languageCode: languageCode });
         /*if (contentData == null) {
            contentData = await Pages.getContentData({ name: "TERMS_CONDITIONS", languageCode: 'en' });
         }*/
      }

      if (contentData == null) {
         res.render('tac', { title: '', data: 'No Content Added' });
      } else {
         res.render('tac', { title: '', data: contentData.content });
      }
   },

   getHelpAndSupportContent: async (req, res) => {

      var languageCode = req.get('accept-language');
      var contentData = [];

      if (!languageCode) {
         contentData = await faq.find({});
      } else {
         contentData = await faq.find({});
         //contentData = await faq.getContentData({ languageCode: languageCode });
         /*if (contentData == null) {
            contentData = await faq.getContentData({ languageCode: 'en' });
         }*/
      }

      if (contentData.length === 0) {
         res.render('faqs', { title: 'FAQs', data: [] });
      } else {
         res.render('faqs', { title: 'FAQs', data: contentData });
      }
   }
}