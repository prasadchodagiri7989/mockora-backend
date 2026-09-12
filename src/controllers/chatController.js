const ChatMessage = require('../models/ChatMessage');

// POST /api/chat/message  — save a visitor message (public, no auth required)
exports.saveMessage = async (req, res) => {
  try {
    const { message, senderName, senderEmail, page } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message text is required.' });
    }

    const chat = await ChatMessage.create({
      message: message.trim().slice(0, 2000),
      senderName: (senderName || 'Anonymous Visitor').trim().slice(0, 100),
      senderEmail: (senderEmail || '').trim().slice(0, 200),
      page: (page || '/').trim(),
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '',
      userAgent: (req.headers['user-agent'] || '').slice(0, 300),
      status: 'new',
    });

    res.status(201).json({ success: true, messageId: chat._id });
  } catch (err) {
    console.error('[Chat] Save message error:', err);
    res.status(500).json({ success: false, message: 'Failed to save message.' });
  }
};

// GET /api/chat/history?email=...  — visitor: fetch past chat messages & admin replies for an email
exports.getChatHistory = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Email query parameter is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const messages = await ChatMessage.find({ senderEmail: cleanEmail })
      .sort({ createdAt: 1 })
      .select('message adminReply repliedAt status senderName createdAt');

    res.json({
      success: true,
      messages,
    });
  } catch (err) {
    console.error('[Chat] Get chat history error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch chat history.' });
  }
};

// GET /api/chat/messages  — admin: list all messages with filters
exports.getAllMessages = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (status && status !== 'all') filter.status = status;

    if (search && search.trim()) {
      const s = search.trim();
      filter.$or = [
        { message: { $regex: s, $options: 'i' } },
        { senderName: { $regex: s, $options: 'i' } },
        { senderEmail: { $regex: s, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [messages, total, newCount] = await Promise.all([
      ChatMessage.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      ChatMessage.countDocuments(filter),
      ChatMessage.countDocuments({ status: 'new' }),
    ]);

    res.json({
      success: true,
      messages,
      pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
      newCount,
    });
  } catch (err) {
    console.error('[Chat] Get messages error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch messages.' });
  }
};

// PATCH /api/chat/messages/:id  — admin: mark read/replied, add note
exports.updateMessage = async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const update = {};
    if (status) update.status = status;
    if (adminNote !== undefined) update.adminNote = adminNote;

    const msg = await ChatMessage.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!msg) return res.status(404).json({ success: false, message: 'Message not found.' });

    res.json({ success: true, message: msg });
  } catch (err) {
    console.error('[Chat] Update message error:', err);
    res.status(500).json({ success: false, message: 'Failed to update message.' });
  }
};

// DELETE /api/chat/messages/:id  — admin: delete a message
exports.deleteMessage = async (req, res) => {
  try {
    await ChatMessage.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Message deleted.' });
  } catch (err) {
    console.error('[Chat] Delete message error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete message.' });
  }
};

// POST /api/chat/messages/:id/reply  — admin: send reply to visitor
exports.replyToMessage = async (req, res) => {
  try {
    const { replyText, sendEmail = true } = req.body;
    if (!replyText || !replyText.trim()) {
      return res.status(400).json({ success: false, message: 'Reply text cannot be empty.' });
    }

    const chat = await ChatMessage.findById(req.params.id);
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }

    chat.adminReply = replyText.trim();
    chat.repliedAt = new Date();
    chat.status = 'replied';
    if (req.user?._id) {
      chat.repliedBy = req.user._id;
    }
    await chat.save();

    // If visitor provided email and sendEmail is requested, dispatch email
    let emailResult = null;
    if (sendEmail && chat.senderEmail) {
      const { sendChatReplyEmail } = require('../utils/emailService');
      emailResult = await sendChatReplyEmail({
        toEmail: chat.senderEmail,
        recipientName: chat.senderName,
        originalMessage: chat.message,
        replyText: chat.adminReply,
      });
    }

    res.json({
      success: true,
      message: chat,
      emailSent: Boolean(emailResult?.success),
      emailSimulated: Boolean(emailResult?.simulated),
    });
  } catch (err) {
    console.error('[Chat] Reply error:', err);
    res.status(500).json({ success: false, message: 'Failed to send reply.' });
  }
};

