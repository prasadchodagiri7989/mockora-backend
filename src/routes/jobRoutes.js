const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/', jobController.getAllJobs);
router.get('/:id', jobController.getJobById);
router.post('/', verifyToken, requireAdmin, jobController.createJob);
router.put('/:id', verifyToken, requireAdmin, jobController.updateJob);
router.delete('/:id', verifyToken, requireAdmin, jobController.deleteJob);
router.post('/:id/bookmark', verifyToken, jobController.toggleJobBookmark);

module.exports = router;
