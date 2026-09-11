const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', resourceController.getAllResources);
router.get('/admin', verifyToken, requireAdmin, resourceController.getAdminResources);
router.get('/:id', resourceController.getResourceById);
router.post('/', verifyToken, requireAdmin, resourceController.createResource);
router.put('/:id', verifyToken, requireAdmin, resourceController.updateResource);
router.delete('/:id', verifyToken, requireAdmin, resourceController.deleteResource);
router.post('/:id/bookmark', verifyToken, resourceController.toggleBookmark);
router.post('/upload', verifyToken, requireAdmin, upload.single('file'), resourceController.uploadFile);

module.exports = router;
