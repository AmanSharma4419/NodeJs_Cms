const stats = require('../models/reports');

module.exports = {

    getAllStatsList: async (req, res) => {
        try {
            stats.findallStats((err, data) => {
                if (err || data.length == 0) {
                    res.status(400).json({ "message": "No Drivers in database", "data": {}, "error": err });
                } else { res.status(200).json({ "message": "All Stats", "data": data, "error": {} }); }
            });
        }
        catch (err) {
            res.status(400).json({ "message": "Internal server Error", "data": {}, "error": err })
        }
    },

    getOverallStatsList: async (req, res) => {
        try {
            var resdata = req.body;
            var headers = req.headers;
            stats.findStats(resdata, (err, data) => {
                if (err || data.length == 0) {
                    res.status(400).json({ "message": "No Drivers in database", "data": {}, "error": err });
                } else { res.status(200).json({ "message": "All Stats", "data": data, "error": {} }); }
            });
        }
        catch (err) {
            res.status(400).json({ "message": "Internal server Error", "data": {}, "error": err })
        }
    },

    getCurrentDayStats: async (req, res) => {
        try {
            var resdata = req.body
            var headers = req.headers
            var day = new Date();
            day = day.toLocaleDateString();
            resdata.day = day;
            console.log(day);
            stats.checkDayStats(resdata, (err, data) => {
                if (err || data === null) {
                    res.status(400).json({ "message": "No Drivers in database", "data": {}, "error": err });
                } else { res.status(200).json({ "message": "All Stats", "data": data, "error": {} }); }
            });
        }
        catch (err) {
            res.status(400).json({ "message": "Internal server Error", "data": {}, "error": err })
        }

    },

    getWeekStats: async (req, res) => {
        try {
            var resdata = req.body
            var headers = req.headers
            var from = new Date();
            var to = new Date();
            from = from.setDate(from.getDate() - 7);
            to = to.setDate(to.getDate() - 1);
            resdata.from = from;
            resdata.to = to;
            stats.sevenDaysStats(resdata, (err, data) => {
                if (err || data.length == 0) {
                    res.status(404).json({ "message": "No Stats for last 7 days in database", "data": {}, "error": err });
                } else { res.status(200).json({ "message": "Last 7 days Stats", "data": data, "error": {} }); }
            });
        }
        catch (err) {
            res.status(400).json({ "message": "Internal server Error", "data": {}, "error": err })
        }
    },

    getRangeStats: async (req, res) => {
        try {
            var resdata = req.body
            var headers = req.headers
            // var from = new Date();
            // var to = new Date();
            // from = from.setDate(from.getDate()-7);
            // to = to.setDate(to.getDate()-1);
            // resdata.from = from;
            // resdata.to = to;
            //////////// to and from dates will be send from api request
            stats.sevenDaysStats(resdata, (err, data) => {
                if (err || data.length == 0) {
                    res.status(404).json({ "message": "No Stats for last 7 days in database", "data": {}, "error": err });
                } else { res.status(200).json({ "message": "Last 7 days Stats", "data": data, "error": {} }); }
            });
        }
        catch (err) {
            res.status(400).json({ "message": "Internal server Error", "data": {}, "error": err })
        }
    },

    getRangeStatsForDriver: async (req, res) => {
        try {
            var resdata = req.body
            var headers = req.headers
            // var from = new Date();
            // var to = new Date();
            // from = from.setDate(from.getDate()-7);
            // to = to.setDate(to.getDate()-1);
            // resdata.from = from;
            // resdata.to = to;
            //////////// to and from dates will be send from api request
            stats.sevenDaysStats(resdata, (err, data) => {
                if (err || data.length == 0) {
                    res.status(404).json({ "message": "No Stats for last 7 days in database", "data": {}, "error": err });
                } else { res.status(200).json({ "message": "Last 7 days Stats", "data": data, "error": {} }); }
            });
        }
        catch (err) {
            res.status(400).json({ "message": "Internal server Error", "data": {}, "error": err })
        }
    },

    getTodayDriverStats: async (req, res) => {
        try {
            var day = new Date();
            day = day.toLocaleDateString();

            var driverId = req.params._id;

            //console.log("From", from2 + "to", to2);

            var eData = await stats.checkDayStats({ driverId: driverId, day: day });

            if (eData == null) {

                var results = {
                    earned: 0,
                    rejected: 0,
                    completed: 0,
                    accepted: 0,
                    canceled: 0,
                    receivedRequest: 0
                }

                res.render('daystats', { title: '', data: results });
            } else {

                var results = {
                    earned: eData.earned,
                    rejected: eData.rejected,
                    completed: eData.completed,
                    accepted: eData.accepted,
                    canceled: eData.canceled,
                    receivedRequest: eData.receivedRequest
                }

                res.render('daystats', { title: '', data: results });
            }

        } catch (error) {
            res.status(400).json({ "message": "Internal server Error", "data": {}, "error": error })
        }
    },

    getWeekDriverStats: async (req, res) => {
        try {
            var from = new Date();
            var to = new Date();
            from = from.setDate(from.getDate() - 7);
            to = to.setDate(to.getDate() - 1);

            var resdata = {
                driverId: req.params._id,
                from: from,
                to: to
            }

            stats.aggregate([{
                "$match": {
                    $and: [
                        { driverId: resdata.driverId },
                        { date: { $lte: new Date(resdata.to), $gt: new Date(resdata.from) } }
                    ]
                }
            },
            {
                $group: {
                    _id: "$driverId",
                    earned: { $sum: "$earned" },
                    rejected: { $sum: "$rejected" },
                    completed: { $sum: "$completed" },
                    accepted: { $sum: "$accepted" },
                    canceled: { $sum: "$canceled" },
                    receivedRequest: { $sum: "$receivedRequest" }
                }
            }], function (err, result) {
                if (err || result == null || result.length == 0) {
                    var results = {
                        earned: 0,
                        rejected: 0,
                        completed: 0,
                        accepted: 0,
                        canceled: 0,
                        receivedRequest: 0
                    }
                    res.render('weekstats', { title: '', data: results });
                } else {
                    //console.log('week status data', result.length);

                    var results = {
                        earned:  Math.round(result[0].earned * 100) / 100,
                        rejected: result[0].rejected,
                        completed: result[0].completed,
                        accepted: result[0].accepted,
                        canceled: result[0].canceled,
                        receivedRequest: result[0].receivedRequest
                    }

                    res.render('weekstats', { title: '', data: results });
                }
            });
        } catch (error) {
            res.status(400).json({ "message": "Internal server Error!!!", "data!": {}, "error": error })
        }
    }
}