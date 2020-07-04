const basicsetting = require('../config/basicsetting.json');
const mailgunSendEmail = require('../lib/mailgunSendEmail.js');
const basicTables = require('../models/basicSetting.js');

module.exports = {

    sendSupportEmail: async (req, res) => {
        try {
            var data = req.body;

            //console.log("data", data);

            if (!data.name) {
                return res.json(helper.showValidationErrorResponse('NAME_IS_REQUIRED'));
            }

            if (!data.msg) {
                return res.json(helper.showValidationErrorResponse('MESSAGE_IS_REQUIRED'));
            }

            basicTables.getAppSetting( async(err, resdata) => {

                var admin_to = basicsetting.App_Settings.Contact_Email;

                //console.log("resdata", resdata);

                if (resdata != undefined && resdata != null) {
                   // console.log(resdata);
                    if (resdata.App_Settings.Contact_Email != '' ) {
                        admin_to = resdata.App_Settings.Contact_Email;
                    }
                }

                var body = '';
                body += '<p>Name: ' + data.name + '</p>';
                //body += '<p>Email: '+data.email+'</p>';
                body += '<p>Message: ' + data.msg + '</p>';
                var senemail = await mailgunSendEmail.sendEmail(admin_to, constant.APP_NAME+' Support!', body);
    
                res.json(helper.showSuccessResponse('MESSAGE_SENT', {}));

            });

        } catch (error) {
            console.log("error", error);
            res.json(helper.showInternalServerErrorResponse('INTERNAL_SERVER_ERROR'));
        }
    },

    socketCheck: async (req, res) => {
        res.render('socket', { title: '', data: 'No Content Added' });
    }
}