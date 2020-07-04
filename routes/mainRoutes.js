module.exports = function (app) {
    // importing routes files for routes /////

    var dispatcher = require('./dispatcher/dispatcher');
    app.use('/api/v1/dispatcher', dispatcher);

    var user = require('./customer/users');
    app.use('/api/v1/user', user);

    var driver = require('./driver/driver');
    app.use('/api/v1/driver', driver);

    var cars = require('./driver/cars');
    app.use('/api/v1/cars', cars);

    var promo = require('./promocodes/promocode');
    app.use('/api/v1/promo', promo);

    var payment = require('./payment/payment');
    app.use('/api/v1/payment', payment);

    var admin2 = require('./forAdminInfo/admin');
    app.use('/api/v1/admin', admin2);

    var trip = require('./trip/trip');
    app.use('/api/v1/trip', trip);

    var stats = require('./stats/stats');
    app.use('/api/v1/stats', stats);

    var hotel = require('./hotel/hotel');
    app.use('/api/v1/hotel', hotel);

    //admin panel routes
    var adminSetting = require('./forAdminInfo/setting');
    app.use('/api/v1/adminSetting', adminSetting);

    var adminDashboard = require('./forAdminInfo/dashboard');
    app.use('/api/v1/adminDashboard', adminDashboard);

    var driver = require('./forAdminInfo/driver');
    app.use('/api/v1/admin/driver', driver);
    //admin panel routes
};