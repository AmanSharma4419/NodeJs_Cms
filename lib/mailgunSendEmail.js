var config = require('../config/configsetting.json');
var configTable = require('../models/config');

module.exports.sendEmail = function (to, sub, msg) {

  configTable.getMailgunSetting((err, resdata) => {

    var from = config.mailgun.MAILGUN_FROM;
    var api_key = config.mailgun.MAILGUN_API_KEY;
    var domain = config.mailgun.MAILGUN_DOMAIN;

    if (resdata != undefined && resdata != null) {
      //console.log(resdata.twilio.twilioFrom);
      if (resdata.mailgun.MAILGUN_FROM != '' && resdata.mailgun.MAILGUN_API_KEY != '' && resdata.mailgun.MAILGUN_DOMAIN != '') {
        from = resdata.mailgun.MAILGUN_FROM;
        api_key = resdata.mailgun.MAILGUN_API_KEY;
        domain = resdata.mailgun.MAILGUN_DOMAIN;
      }
    }

    var mailgun = require('mailgun-js')({ apiKey: api_key, domain: domain });

    var data = {
      from: from,
      to: to,
      subject: sub,
      html: msg
    };

    mailgun.messages().send(data, function (error, body) {
      if (error) {
        //console.log('Mail gun error', error);
        return true;
      } else {
        //console.log('Mail gun send mesg success', body);
        return true;
      }
    });

  });
}