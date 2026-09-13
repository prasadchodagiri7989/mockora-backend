const User = require('../models/User');
const Attempt = require('../models/Attempt');

// GET /api/users (Admin)
exports.getAllUsers = async (req, res) => {
  try {
    const { search, role, status, sortBy, order } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (role && role !== 'all') {
      filter.role = role;
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    const sortOption = {};
    const sortField = sortBy || 'createdAt';
    sortOption[sortField] = order === 'asc' ? 1 : -1;

    const users = await User.find(filter)
      .select('-password')
      .sort(sortOption);

    res.json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/users/:id
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/users/:id/status (Admin - block/unblock)
exports.updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'blocked'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Prevent blocking oneself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot modify your own status.' });
    }

    user.status = status;
    await user.save();

    res.json({ success: true, message: `User status changed to ${status}.`, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/users/:id/role (Admin - promote/demote)
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.role = role;
    await user.save();

    res.json({ success: true, message: `User role updated to ${role}.`, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/users/:id (Admin)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account.' });
    }

    await User.findByIdAndDelete(req.params.id);
    await Attempt.deleteMany({ userId: req.params.id });

    res.json({ success: true, message: 'User and their test history deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/users/:id/attempts (Admin - view specific user's attempt history)
exports.getUserAttemptHistory = async (req, res) => {
  try {
    const attempts = await Attempt.find({ userId: req.params.id })
      .populate('testId', 'title categoryId difficulty')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: attempts.length, attempts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/users/:id/password (Admin - change or reset user password)
exports.updateUserPassword = async (req, res) => {
  try {
    const { newPassword, notifyUser = true } = req.body;
    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be a valid string of at least 6 characters.',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Set new password (userSchema pre('save') hook will hash it automatically)
    user.password = newPassword.trim();
    user.passwordTemporary = false;
    await user.save();

    console.log(`[Admin Password Change] Password updated for user: ${user.email}`);

    // Optionally dispatch notification email to candidate
    let emailDispatched = false;
    if (notifyUser) {
      try {
        const emailService = require('../utils/emailService');
        const emailResult = await emailService.sendPasswordResetNoticeEmail({
          toEmail: user.email,
          customerName: user.name,
          newPassword: newPassword.trim(),
        });
        emailDispatched = emailResult.success;
      } catch (mailErr) {
        console.warn('[Password Change Email Warning]', mailErr.message);
      }
    }

    res.json({
      success: true,
      message: `Password for ${user.name} (${user.email}) updated successfully.${emailDispatched ? ' Notification email sent to user.' : ''}`,
      emailSent: emailDispatched,
    });
  } catch (error) {
    console.error('[Admin Password Update Error]', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update user password.' });
  }
};
