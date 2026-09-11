const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  company: {
    type: String,
    required: true,
    trim: true,
  },
  logo: {
    type: String,
    default: '',
  },
  location: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['Full-time', 'Internship', 'Part-time', 'Contract'],
    default: 'Full-time',
  },
  experienceLevel: {
    type: String,
    enum: ['Fresher', 'Entry Level', 'Mid Level', 'Senior'],
    default: 'Fresher',
  },
  salaryRange: {
    type: String,
    default: 'Competitive',
  },
  description: {
    type: String,
    required: true,
  },
  requirements: [{
    type: String,
  }],
  tags: [{
    type: String,
    trim: true,
  }],
  applyLink: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  postedAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  },
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);
