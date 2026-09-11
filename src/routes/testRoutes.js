const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');
const { verifyToken, optionalToken, requireAdmin } = require('../middleware/auth');

router.get('/', optionalToken, testController.getAllTests);
router.get('/:id', optionalToken, testController.getTestById);
router.get('/:id/analytics', verifyToken, requireAdmin, testController.getTestAnalytics);
router.post('/', verifyToken, requireAdmin, testController.createTest);
router.put('/:id', verifyToken, requireAdmin, testController.updateTest);
router.delete('/:id', verifyToken, requireAdmin, testController.deleteTest);
router.post('/:id/duplicate', verifyToken, requireAdmin, testController.duplicateTest);

module.exports = router;
