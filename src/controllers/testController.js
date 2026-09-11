const Test = require('../models/Test');
const Question = require('../models/Question');
const Attempt = require('../models/Attempt');

// GET /api/tests
exports.getAllTests = async (req, res) => {
  try {
    const { categoryId, difficulty, status, search, type } = req.query;
    const filter = {};

    if (categoryId && categoryId !== 'all') {
      filter.categoryId = categoryId;
    }
    if (difficulty && difficulty !== 'all') {
      filter.difficulty = difficulty;
    }
    if (type) {
      filter.type = type;
    }
    // Only published tests for non-admins, unless specified
    if (status && status !== 'all') {
      filter.status = status;
    } else if (!status && (!req.user || req.user.role !== 'admin')) {
      filter.status = 'published';
    }

    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    const tests = await Test.find(filter)
      .populate('categoryId', 'name slug icon color')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    // Format output with question count
    const formatted = tests.map(test => ({
      ...test.toObject(),
      questionCount: test.questions ? test.questions.length : 0,
    }));

    res.json({ success: true, count: formatted.length, tests: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/tests/:id
exports.getTestById = async (req, res) => {
  try {
    const { mode } = req.query; // 'taking', 'edit', or undefined
    const test = await Test.findById(req.params.id)
      .populate('categoryId', 'name slug icon color')
      .populate('questions');

    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found.' });
    }

    // If candidate is actively taking the test, strip correct answers and explanations!
    if (mode === 'taking' && (!req.user || req.user.role !== 'admin')) {
      const sanitizedQuestions = test.questions.map(q => ({
        _id: q._id,
        text: q.text,
        questionType: q.questionType || 'single',
        codeSnippet: q.codeSnippet,
        passageSnippet: q.passageSnippet,
        imageUrl: q.imageUrl,
        options: q.options,
        marks: q.marks,
        negativeMarks: q.negativeMarks,
        subject: q.subject,
        topic: q.topic,
        difficulty: q.difficulty,
        timeLimitSeconds: q.timeLimitSeconds || 0,
      }));

      const testObj = test.toObject();
      testObj.questions = sanitizedQuestions;
      return res.json({ success: true, test: testObj });
    }

    res.json({ success: true, test });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/tests (Admin)
exports.createTest = async (req, res) => {
  try {
    const {
      title,
      description,
      instructions,
      tags,
      categoryId,
      type,
      difficulty,
      timing,
      totalMarks,
      passingMarks,
      status,
      questions,
    } = req.body;

    if (!title || !categoryId) {
      return res.status(400).json({ success: false, message: 'Title and category are required.' });
    }

    let questionIds = [];
    if (questions && questions.length > 0) {
      const createdQuestions = await Promise.all(
        questions.map(q => {
          if (q._id && typeof q._id === 'string' && q._id.length === 24 && !q.isNew) return q._id;
          const qData = { ...q, categoryId };
          delete qData._id;
          return Question.create(qData);
        })
      );
      questionIds = createdQuestions.map(q => (q._id ? q._id : q));
    }

    const test = await Test.create({
      title,
      description: description || '',
      instructions: instructions || '',
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : []),
      categoryId,
      type: type || 'mock',
      difficulty: difficulty || 'Medium',
      timing: {
        enabled: timing?.enabled ?? true,
        mode: timing?.mode || 'overall',
        duration: timing?.duration || 30,
        sameTimePerQuestion: timing?.sameTimePerQuestion ?? true,
        defaultQuestionTime: timing?.defaultQuestionTime || 60,
      },
      questions: questionIds,
      totalMarks: totalMarks || (questionIds.length * 4) || 100,
      passingMarks: passingMarks || 40,
      status: status || 'published',
      createdBy: req.user?._id,
    });

    const populated = await Test.findById(test._id)
      .populate('categoryId', 'name slug')
      .populate('questions');

    res.status(201).json({ success: true, message: 'Test created successfully.', test: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/tests/:id (Admin)
exports.updateTest = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found.' });
    }

    const {
      title,
      description,
      categoryId,
      difficulty,
      timing,
      instructions,
      tags,
      totalMarks,
      passingMarks,
      status,
      questions,
    } = req.body;

    if (title) test.title = title;
    if (description !== undefined) test.description = description;
    if (instructions !== undefined) test.instructions = instructions;
    if (tags !== undefined) test.tags = Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : []);
    if (categoryId) test.categoryId = categoryId;
    if (difficulty) test.difficulty = difficulty;
    if (timing) test.timing = { ...test.timing, ...timing };
    if (totalMarks !== undefined) test.totalMarks = totalMarks;
    if (passingMarks !== undefined) test.passingMarks = passingMarks;
    if (status) test.status = status;

    if (questions && Array.isArray(questions)) {
      // Handle question creation or updates
      const resolvedIds = [];
      for (const q of questions) {
        if (q._id && typeof q._id === 'string' && q._id.length === 24) {
          await Question.findByIdAndUpdate(q._id, q);
          resolvedIds.push(q._id);
        } else {
          const newQ = await Question.create({ ...q, categoryId: test.categoryId });
          resolvedIds.push(newQ._id);
        }
      }
      test.questions = resolvedIds;
    }

    await test.save();

    const updated = await Test.findById(test._id)
      .populate('categoryId', 'name slug')
      .populate('questions');

    res.json({ success: true, message: 'Test updated successfully.', test: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/tests/:id (Admin)
exports.deleteTest = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found.' });
    }

    await Test.findByIdAndDelete(req.params.id);
    await Attempt.deleteMany({ testId: req.params.id });

    res.json({ success: true, message: 'Test and associated attempts deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/tests/:id/duplicate (Admin)
exports.duplicateTest = async (req, res) => {
  try {
    const original = await Test.findById(req.params.id).populate('questions');
    if (!original) {
      return res.status(404).json({ success: false, message: 'Test not found.' });
    }

    // Duplicate questions
    const newQuestionIds = [];
    for (const q of original.questions) {
      const qObj = q.toObject();
      delete qObj._id;
      delete qObj.createdAt;
      delete qObj.updatedAt;
      const copyQ = await Question.create(qObj);
      newQuestionIds.push(copyQ._id);
    }

    const duplicated = await Test.create({
      title: `${original.title} (Copy)`,
      description: original.description,
      categoryId: original.categoryId,
      type: original.type,
      difficulty: original.difficulty,
      timing: original.timing,
      questions: newQuestionIds,
      totalMarks: original.totalMarks,
      passingMarks: original.passingMarks,
      status: 'draft',
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, message: 'Test duplicated successfully.', test: duplicated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/tests/:id/analytics (Admin)
exports.getTestAnalytics = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id).populate('questions');
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found.' });
    }

    const attempts = await Attempt.find({ testId: test._id }).populate('userId', 'name email');

    const totalAttempts = attempts.length;
    let avgScore = 0;
    let passCount = 0;
    const questionMissCounts = {};

    test.questions.forEach(q => {
      questionMissCounts[q._id.toString()] = {
        questionId: q._id,
        text: q.text,
        subject: q.subject,
        topic: q.topic,
        missedCount: 0,
        totalAttempts: 0,
      };
    });

    if (totalAttempts > 0) {
      let sumScore = 0;
      attempts.forEach(att => {
        sumScore += att.score;
        if (att.score >= test.passingMarks) passCount += 1;

        att.answers.forEach(ans => {
          const qIdStr = ans.questionId.toString();
          if (questionMissCounts[qIdStr]) {
            questionMissCounts[qIdStr].totalAttempts += 1;
            if (!ans.isCorrect) {
              questionMissCounts[qIdStr].missedCount += 1;
            }
          }
        });
      });
      avgScore = Math.round((sumScore / totalAttempts) * 10) / 10;
    }

    const mostMissedQuestions = Object.values(questionMissCounts)
      .filter(q => q.totalAttempts > 0)
      .sort((a, b) => b.missedCount - a.missedCount)
      .slice(0, 5);

    res.json({
      success: true,
      analytics: {
        testId: test._id,
        title: test.title,
        totalAttempts,
        averageScore: avgScore,
        passRate: totalAttempts > 0 ? Math.round((passCount / totalAttempts) * 100) : 0,
        mostMissedQuestions,
        recentAttempts: attempts.slice(-10).reverse(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
