const express = require('express');
const router = express.Router();
const practiceController = require('../controllers/practiceController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/questions', practiceController.getPracticeQuestions);
router.get('/filters', practiceController.getPracticeFilters);
router.post('/verify', practiceController.verifyAnswer);
router.post('/questions', verifyToken, requireAdmin, practiceController.createPracticeQuestion);

module.exports = router;
