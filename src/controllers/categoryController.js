const Category = require('../models/Category');
const Test = require('../models/Test');

// GET /api/categories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ order: 1, name: 1 });

    // Attach test counts to each category
    let categoriesWithCounts = await Promise.all(
      categories.map(async (cat) => {
        const testCount = await Test.countDocuments({
          categoryId: cat._id,
          status: 'published',
        });
        return {
          ...cat.toObject(),
          testCount,
        };
      })
    );

    if (req.query.onlyWithTests === 'true') {
      categoriesWithCounts = categoriesWithCounts.filter(c => c.testCount > 0);
    }

    res.json({ success: true, count: categoriesWithCounts.length, categories: categoriesWithCounts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/categories/:slug
exports.getCategoryBySlug = async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }
    const testCount = await Test.countDocuments({ categoryId: category._id, status: 'published' });
    res.json({ success: true, category: { ...category.toObject(), testCount } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/categories (Admin)
exports.createCategory = async (req, res) => {
  try {
    const { name, icon, description, badgeText, color, order } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const existing = await Category.findOne({ $or: [{ name }, { slug }] });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Category with this name already exists.' });
    }

    const category = await Category.create({
      name,
      slug,
      icon: icon || 'BookOpen',
      description: description || '',
      badgeText: badgeText || 'Popular',
      color: color || '#4F46E5',
      order: Number(order) || 0,
    });

    res.status(201).json({ success: true, message: 'Category created.', category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/categories/:id (Admin)
exports.updateCategory = async (req, res) => {
  try {
    const { name, icon, description, badgeText, color, order, isActive } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    if (name) {
      category.name = name;
      category.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    if (icon !== undefined) category.icon = icon;
    if (description !== undefined) category.description = description;
    if (badgeText !== undefined) category.badgeText = badgeText;
    if (color !== undefined) category.color = color;
    if (order !== undefined) category.order = Number(order);
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();

    res.json({ success: true, message: 'Category updated.', category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/categories/:id (Admin)
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Category deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
