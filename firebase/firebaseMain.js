const admin = require("firebase-admin");

module.exports = function (app) {
  /// firebase ///
  var serviceAccount = require("./firebaseInfoCustomer");
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: serviceAccount.project_id, // I get no error here
      clientEmail: serviceAccount.client_email, // I get no error here
      privateKey: serviceAccount.private_key.replace(/\\n/g, "\n"), // NOW THIS WORKS!!!
    }),
    databaseURL: serviceAccount.firebaseURL,
  });
  var serviceAccount1 = require("./firebaseInfoDriver");
  var driverFDB = admin.initializeApp(
    {
      credential: admin.credential.cert({
        projectId: serviceAccount1.project_id, // I get no error here
        clientEmail: serviceAccount1.client_email, // I get no error here
        privateKey: serviceAccount1.private_key.replace(/\\n/g, "\n"), // NOW THIS WORKS!!!
      }),
      databaseURL: serviceAccount1.firebaseURL,
    },
    "driverFDB"
  );

  app.set("driverFDB", driverFDB);
};
