const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/', verifyToken, requireAdmin, userController.getAllUsers);
router.get('/:id', verifyToken, requireAdmin, userController.getUserById);
router.put('/:id/status', verifyToken, requireAdmin, userController.updateUserStatus);
router.put('/:id/role', verifyToken, requireAdmin, userController.updateUserRole);
router.put('/:id/password', verifyToken, requireAdmin, userController.updateUserPassword);
router.delete('/:id', verifyToken, requireAdmin, userController.deleteUser);
router.get('/:id/attempts', verifyToken, requireAdmin, userController.getUserAttemptHistory);

module.exports = router;
