const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// Public: save a message and get visitor chat history
router.post('/message', chatController.saveMessage);
router.get('/history', chatController.getChatHistory);

// Admin: list, update, delete, reply to messages
router.get('/messages', verifyToken, requireAdmin, chatController.getAllMessages);
router.patch('/messages/:id', verifyToken, requireAdmin, chatController.updateMessage);
router.delete('/messages/:id', verifyToken, requireAdmin, chatController.deleteMessage);
router.post('/messages/:id/reply', verifyToken, requireAdmin, chatController.replyToMessage);

module.exports = router;

