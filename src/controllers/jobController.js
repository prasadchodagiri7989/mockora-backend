const Job = require('../models/Job');
const User = require('../models/User');

// GET /api/jobs
exports.getAllJobs = async (req, res) => {
  try {
    const { category, type, experienceLevel, location, search } = req.query;
    const filter = { isActive: true };

    if (category && category !== 'all') {
      filter.category = category;
    }
    if (type && type !== 'all') {
      filter.type = type;
    }
    if (experienceLevel && experienceLevel !== 'all') {
      filter.experienceLevel = experienceLevel;
    }
    if (location && location !== 'all') {
      filter.location = { $regex: location, $options: 'i' };
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const jobs = await Job.find(filter).sort({ postedAt: -1 });

    res.json({ success: true, count: jobs.length, jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/jobs/:id
exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }
    res.json({ success: true, job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/jobs (Admin)
exports.createJob = async (req, res) => {
  try {
    const { title, company, logo, location, category, type, experienceLevel, salaryRange, description, requirements, tags, applyLink, expiresAt } = req.body;

    if (!title || !company || !location || !category || !applyLink) {
      return res.status(400).json({ success: false, message: 'Required job fields missing.' });
    }

    const job = await Job.create({
      title,
      company,
      logo: logo || '',
      location,
      category,
      type: type || 'Full-time',
      experienceLevel: experienceLevel || 'Entry Level',
      salaryRange: salaryRange || 'Competitive',
      description: description || '',
      requirements: Array.isArray(requirements) ? requirements : (requirements ? requirements.split('\n').filter(Boolean) : []),
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : []),
      applyLink,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    res.status(201).json({ success: true, message: 'Job posting created.', job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/jobs/:id (Admin)
exports.updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    const fields = ['title', 'company', 'logo', 'location', 'category', 'type', 'experienceLevel', 'salaryRange', 'description', 'applyLink', 'isActive'];
    fields.forEach(f => {
      if (req.body[f] !== undefined) job[f] = req.body[f];
    });

    if (req.body.requirements) {
      job.requirements = Array.isArray(req.body.requirements) ? req.body.requirements : req.body.requirements.split('\n').filter(Boolean);
    }
    if (req.body.tags) {
      job.tags = Array.isArray(req.body.tags) ? req.body.tags : req.body.tags.split(',').map(t => t.trim());
    }

    await job.save();
    res.json({ success: true, message: 'Job updated.', job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/jobs/:id (Admin)
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    await Job.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Job posting deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/jobs/:id/bookmark
exports.toggleJobBookmark = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const jobId = req.params.id;

    const index = user.savedJobs.indexOf(jobId);
    let bookmarked = false;

    if (index > -1) {
      user.savedJobs.splice(index, 1);
      bookmarked = false;
    } else {
      user.savedJobs.push(jobId);
      bookmarked = true;
    }

    await user.save();
    res.json({
      success: true,
      bookmarked,
      message: bookmarked ? 'Job saved' : 'Job removed from saved list',
      savedJobs: user.savedJobs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
