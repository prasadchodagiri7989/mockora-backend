const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  status: {
    type: String,
    enum: ['active', 'blocked'],
    default: 'active',
  },
  avatar: {
    type: String,
    default: '',
  },
  streakDays: {
    type: Number,
    default: 3,
  },
  targetExam: {
    type: String,
    default: 'Computer Science & GATE',
  },
  savedResources: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resource',
  }],
  savedJobs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
  }],
  phone: {
    type: String,
    trim: true,
  },
  occupation: {
    type: String,
    trim: true,
    default: 'Student',
  },
  passwordTemporary: {
    type: Boolean,
    default: false,
  },
  purchasedCategory: {
    type: String,
    default: '',
  },
  purchasedOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
  },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
