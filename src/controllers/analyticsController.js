const User = require('../models/User');
const Test = require('../models/Test');
const Attempt = require('../models/Attempt');
const Category = require('../models/Category');
const Resource = require('../models/Resource');
const Job = require('../models/Job');
const Question = require('../models/Question');

// GET /api/analytics/platform (Admin platform stats)
exports.getPlatformAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalTests = await Test.countDocuments();
    const totalAttempts = await Attempt.countDocuments();
    const totalResources = await Resource.countDocuments();
    const totalJobs = await Job.countDocuments({ isActive: true });

    // Category distribution & test attempts per category
    const categories = await Category.find({ isActive: true });
    const categoryStats = await Promise.all(
      categories.map(async (cat) => {
        const tests = await Test.find({ categoryId: cat._id });
        const testIds = tests.map(t => t._id);
        const attempts = await Attempt.find({ testId: { $in: testIds } });
        
        let avgScore = 0;
        if (attempts.length > 0) {
          const sum = attempts.reduce((acc, a) => acc + (a.accuracyPercentage || 0), 0);
          avgScore = Math.round(sum / attempts.length);
        }

        return {
          name: cat.name,
          testsCount: tests.length,
          attemptsCount: attempts.length,
          averageAccuracy: avgScore,
          color: cat.color || '#4F46E5',
        };
      })
    );

    // Recent 10 platform attempts
    const recentAttempts = await Attempt.find()
      .populate('userId', 'name email avatar')
      .populate('testId', 'title categoryId')
      .sort({ createdAt: -1 })
      .limit(10);

    // Score distribution buckets
    const allAttempts = await Attempt.find().select('accuracyPercentage');
    const scoreBuckets = [
      { range: '0-40%', count: 0 },
      { range: '41-60%', count: 0 },
      { range: '61-80%', count: 0 },
      { range: '81-100%', count: 0 },
    ];

    allAttempts.forEach(att => {
      const acc = att.accuracyPercentage || 0;
      if (acc <= 40) scoreBuckets[0].count += 1;
      else if (acc <= 60) scoreBuckets[1].count += 1;
      else if (acc <= 80) scoreBuckets[2].count += 1;
      else scoreBuckets[3].count += 1;
    });

    res.json({
      success: true,
      metrics: {
        totalUsers,
        totalTests,
        totalAttempts,
        totalResources,
        totalJobs,
      },
      categoryStats,
      scoreBuckets,
      recentAttempts,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/analytics/user-dashboard (Student portal dashboard data)
exports.getUserDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    // Fetch user's attempts
    const userAttempts = await Attempt.find({ userId })
      .populate({
        path: 'testId',
        select: 'title categoryId difficulty totalMarks',
        populate: { path: 'categoryId', select: 'name icon color' },
      })
      .sort({ createdAt: -1 });

    const testsTaken = userAttempts.length;
    let avgScore = 0;
    let avgAccuracy = 0;

    if (testsTaken > 0) {
      const totalAcc = userAttempts.reduce((acc, a) => acc + (a.accuracyPercentage || 0), 0);
      const totalSc = userAttempts.reduce((acc, a) => acc + (a.score || 0), 0);
      avgAccuracy = Math.round(totalAcc / testsTaken);
      avgScore = Math.round((totalSc / testsTaken) * 10) / 10;
    }

    // Score trend over time (chronological)
    const scoreTrend = [...userAttempts].reverse().slice(-7).map(a => ({
      date: new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      score: a.score,
      accuracy: a.accuracyPercentage,
      title: a.testId?.title || 'Mock Test',
    }));

    // Category-wise performance for Radar/Bar charts
    const categoryAccuracyMap = {};
    userAttempts.forEach(a => {
      const catName = a.testId?.categoryId?.name || 'General';
      if (!categoryAccuracyMap[catName]) {
        categoryAccuracyMap[catName] = { total: 0, count: 0 };
      }
      categoryAccuracyMap[catName].total += a.accuracyPercentage;
      categoryAccuracyMap[catName].count += 1;
    });

    const categoryPerformance = Object.entries(categoryAccuracyMap).map(([subject, data]) => ({
      subject,
      score: Math.round(data.total / data.count),
      fullMark: 100,
    }));

    // If less than 3 categories, add standard targets for radar chart
    if (categoryPerformance.length < 3) {
      const allCats = await Category.find().limit(5);
      allCats.forEach(c => {
        if (!categoryAccuracyMap[c.name]) {
          categoryPerformance.push({
            subject: c.name.split(' ')[0],
            score: 0,
            fullMark: 100,
          });
        }
      });
    }

    // Extract weak areas from latest attempt's aiReview or aggregate
    const latestAttempt = userAttempts[0];
    const weakAreas = latestAttempt?.aiReview?.weakAreas || [
      'Time Complexity & Dynamic Programming',
      'System Design Trade-offs',
    ];

    // Recommended tests
    const recommendedTests = await Test.find({ status: 'published' })
      .populate('categoryId', 'name icon color')
      .limit(4);

    res.json({
      success: true,
      stats: {
        testsTaken,
        averageScore: avgScore,
        practiceAccuracy: avgAccuracy || 78,
        streakDays: user.streakDays || 5,
        targetExam: user.targetExam || 'Computer Science & Engineering',
      },
      scoreTrend,
      categoryPerformance,
      weakAreas,
      recentActivity: userAttempts.slice(0, 5),
      recommendedTests,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/analytics/search?q=query (Global platform live search)
exports.searchGlobal = async (req, res) => {
  try {
    const query = req.query.q || '';
    if (!query.trim()) {
      return res.json({ success: true, results: { tests: [], practice: [], resources: [], jobs: [] } });
    }

    const reg = new RegExp(query.trim(), 'i');

    const [tests, practice, resources, jobs] = await Promise.all([
      Test.find({
        status: 'published',
        $or: [{ title: reg }, { description: reg }, { tags: { $in: [reg] } }],
      })
        .populate('categoryId', 'name')
        .limit(5)
        .select('title description difficulty categoryId tags'),

      Question.find({
        type: { $in: ['practice', 'both'] },
        $or: [{ text: reg }, { subject: reg }, { topic: reg }],
      })
        .populate('categoryId', 'name')
        .limit(5)
        .select('text subject topic difficulty categoryId'),

      Resource.find({
        isPublished: true,
        $or: [{ title: reg }, { description: reg }, { tags: { $in: [reg] } }],
      })
        .limit(5)
        .select('title type description fileSize duration'),

      Job.find({
        isActive: true,
        $or: [{ title: reg }, { company: reg }, { location: reg }, { category: reg }],
      })
        .limit(5)
        .select('title company location salaryRange type'),
    ]);

    res.json({
      success: true,
      results: {
        tests,
        practice,
        resources,
        jobs,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
