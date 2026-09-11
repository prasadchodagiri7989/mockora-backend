const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['pdf', 'note', 'video'],
    required: true,
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  fileUrl: {
    type: String,
    default: '',
  },
  videoUrl: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
  tags: [{
    type: String,
    trim: true,
  }],
  author: {
    type: String,
    default: 'Editorial Team',
  },
  fileSize: {
    type: String,
    default: '2.4 MB',
  },
  duration: {
    type: String,
    default: '',
  },
  isPublished: {
    type: Boolean,
    default: true,
  },
  downloadsCount: {
    type: Number,
    default: 142,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, { timestamps: true });

module.exports = mongoose.model('Resource', resourceSchema);
