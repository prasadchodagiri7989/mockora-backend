const express = require('express');
const router = express.Router();
const attemptController = require('../controllers/attemptController');
const { verifyToken } = require('../middleware/auth');

router.post('/submit', verifyToken, attemptController.submitAttempt);
router.get('/', verifyToken, attemptController.getUserAttempts);
router.get('/:id', verifyToken, attemptController.getAttemptById);
router.post('/:id/ai-review', verifyToken, attemptController.triggerAIReview);

module.exports = router;
