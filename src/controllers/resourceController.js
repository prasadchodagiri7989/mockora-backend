const Resource = require('../models/Resource');
const User = require('../models/User');

// GET /api/resources
exports.getAllResources = async (req, res) => {
  try {
    const { categoryId, type, search, tag } = req.query;
    const filter = { isPublished: true };

    if (categoryId && categoryId !== 'all') {
      filter.categoryId = categoryId;
    }
    if (type && type !== 'all') {
      filter.type = type;
    }
    if (tag) {
      filter.tags = tag;
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const resources = await Resource.find(filter)
      .populate('categoryId', 'name slug icon color')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: resources.length, resources });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/resources/admin (Admin view all including unpublished)
exports.getAdminResources = async (req, res) => {
  try {
    const resources = await Resource.find()
      .populate('categoryId', 'name slug')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: resources.length, resources });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/resources/:id
exports.getResourceById = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id).populate('categoryId', 'name slug icon color');
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found.' });
    }
    res.json({ success: true, resource });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/resources (Admin)
exports.createResource = async (req, res) => {
  try {
    const { title, type, categoryId, fileUrl, videoUrl, description, tags, author, fileSize, duration, isPublished } = req.body;

    if (!title || !type || !categoryId) {
      return res.status(400).json({ success: false, message: 'Title, type, and category are required.' });
    }

    const resource = await Resource.create({
      title,
      type,
      categoryId,
      fileUrl: fileUrl || '',
      videoUrl: videoUrl || '',
      description: description || '',
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : []),
      author: author || 'Faculty Team',
      fileSize: fileSize || '3.2 MB',
      duration: duration || '',
      isPublished: isPublished !== undefined ? isPublished : true,
      uploadedBy: req.user?._id,
    });

    res.status(201).json({ success: true, message: 'Resource added.', resource });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/resources/:id (Admin)
exports.updateResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found.' });
    }

    const fields = ['title', 'type', 'categoryId', 'fileUrl', 'videoUrl', 'description', 'author', 'fileSize', 'duration', 'isPublished'];
    fields.forEach(f => {
      if (req.body[f] !== undefined) resource[f] = req.body[f];
    });

    if (req.body.tags) {
      resource.tags = Array.isArray(req.body.tags) ? req.body.tags : req.body.tags.split(',').map(t => t.trim());
    }

    await resource.save();
    res.json({ success: true, message: 'Resource updated.', resource });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/resources/:id (Admin)
exports.deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found.' });
    }

    await Resource.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Resource deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/resources/:id/bookmark (Toggle bookmark for user)
exports.toggleBookmark = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const resourceId = req.params.id;

    const index = user.savedResources.indexOf(resourceId);
    let bookmarked = false;

    if (index > -1) {
      user.savedResources.splice(index, 1);
      bookmarked = false;
    } else {
      user.savedResources.push(resourceId);
      bookmarked = true;
    }

    await user.save();
    res.json({
      success: true,
      bookmarked,
      message: bookmarked ? 'Saved to bookmarks' : 'Removed from bookmarks',
      savedResources: user.savedResources,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/resources/upload (File upload endpoint)
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const fileSize = `${(req.file.size / (1024 * 1024)).toFixed(1)} MB`;

    res.json({
      success: true,
      fileUrl,
      fileSize,
      originalName: req.file.originalname,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
