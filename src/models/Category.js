const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  icon: {
    type: String,
    default: 'BookOpen', // Lucide icon name
  },
  description: {
    type: String,
    default: '',
  },
  badgeText: {
    type: String,
    default: 'High Demand',
  },
  color: {
    type: String,
    default: '#4F46E5', // Indigo
  },
  order: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
