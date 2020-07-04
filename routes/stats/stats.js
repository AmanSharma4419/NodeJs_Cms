const express = require('express');
const router = express.Router();
const statscontroller = require('../../controller/statscontroller');

router.get('/', statscontroller.getAllStatsList);

router.post('/overallstats', statscontroller.getOverallStatsList);

router.post('/daystats', statscontroller.getCurrentDayStats);

router.post('/weekstats', statscontroller.getWeekStats);

router.post('/rangestats', statscontroller.getRangeStats);

router.post('/rangestatsforalldrivers', statscontroller.getRangeStatsForDriver);

router.get('/driver/today/:_id', statscontroller.getTodayDriverStats);

router.get('/driver/week/:_id', statscontroller.getWeekDriverStats);

module.exports = router;