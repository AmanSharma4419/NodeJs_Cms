const globalConstants = {
  LOCALURL: 'http://localhost:5000/',
  STAGEURL: 'http://localhost:5000/',
  PRODURL: '',
  LIVEURL: '',
  STAGINGURL: '',
  EMAIL : '',
  JWTOKENLOCAL: 'fax42c62-g215-4dc1-ad2d-sa1f32kk1w22',
  JWTOKENSTAGING: 'fcv42f62-g465-4dc1-ad2c-sa1f27kk1w43',
  JWTOKENDEV:'fcv42f62-g465-4dc1-ad2c-sa1f27kk1w43',
  JWTOKENLIVE: 'asd42e62-g465-4bc1-ae2c-da1f27kk3a20',
  key: {
       privateKey: 'c3f42e68-b461-4bc1-ae2c-da9f27ee3a20',
       tokenExpiry: 1 * 30 * 1000 * 60 * 24 //1 hour
   },
   FROM_MAIL :{
     LOCALHOST: "mobilytesolu123@gmail.com",
     LIVE: "mobilytesolu123@gmail.com",
     STAGING: "mobilytesolu123@gmail.com"
   },
   SMTP_CRED: {
     LOCALHOST: {
       email:'mobilytesolu123@gmail.com',
       password:'123456789mobilyte'
     },
     LIVE: {email:'mobilytesolu123@gmail.com',
       password:'123456789mobilyte'},
     STAGING: {email:'mobilytesolu123@gmail.com',
       password:'123456789mobilyte'}
   },
  AWS:{
    SECRET_ACCESS_KEY: "tm/6az4Ot57YzVhAAD+9tuw59sf0lWVLpfvo7Gfc",
    SECRET_ACCESS_ID: "AKIAT3I4BCUADQFFBUGQ",
    REGION_NAME: "ap-south-1",
    BUCKET_NAME: "eliteapp"
  },
  FCM:{
    keys:'AAAAQyhwR9E:APA91bEY_sHjXmI2NdBEe9ChMhUYtv50_7QP1MQHsafPtLtsJBTkkcN_bd5XNyIO0K2NdKCk6EZPq0Edjt7ARr9kLiDxoWuEYsj9QLUT5sJqP1TFN4MHrYfNDulGuWzGjeL2e4GBBSiq'
  },


  MONGODB: {
    LOCALHOST: {
     URL: 'mongodb://localhost:27017/jcar',

    },
    TEST: {
      URL: 'mongodb://localhost:27017/jcar',


    },
    LIVE: {
      URL: 'mongodb://localhost:27017/jcar',

    },
    STAGING: {
      URL: 'mongodb://localhost:27017/jcar',
    },
  },
};

module.exports = globalConstants;
