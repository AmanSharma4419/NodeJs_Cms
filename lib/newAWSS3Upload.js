var aws = require('aws-sdk');
var config = require('../config/configsetting.json');

module.exports.uploadImageToS3 = async (imageData, callback) => {

    aws.config.update({
        // Your SECRET ACCESS KEY from AWS should go here,
        secretAccessKey: config.AWS.SECRET_ACCESS_KEY,
        // Not working key, Your ACCESS KEY ID from AWS should go here,
        accessKeyId: config.AWS.SECRET_ACCESS_ID,
        region: config.AWS.REGION_NAME // region of your bucket
    });

    var ss = Date.now().toString();

    const base64Data = new Buffer.from(imageData.replace(/^data:image\/\w+;base64,/, ""), 'base64');

    // Getting the file type, ie: jpeg, png or gif
    const type = imageData.split(';')[0].split('/')[1];

    var s3 = new aws.S3();

    const params = {
        Bucket: config.AWS.BUCKET_NAME,
        Key: `${ss}.${type}`,
        Body: base64Data,
        ACL: 'public-read',
        ContentEncoding: 'base64', // required
        ContentType: `image/${type}`
    }

    let location = '';
    let key = '';
    try {
        const { Location, Key } = await s3.upload(params).promise();
        location = Location;
        key = Key;

        callback(null, location);

    } catch (error) {
        // console.log(error);
        callback(error, null);
    }

};