const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/platform', verifyToken, requireAdmin, analyticsController.getPlatformAnalytics);
router.get('/user-dashboard', verifyToken, analyticsController.getUserDashboard);
router.get('/search', analyticsController.searchGlobal);

module.exports = router;
