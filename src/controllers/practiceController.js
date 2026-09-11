const Question = require('../models/Question');
const Category = require('../models/Category');

// GET /api/practice/questions
exports.getPracticeQuestions = async (req, res) => {
  try {
    const { categoryId, subject, topic, difficulty, mode, limit } = req.query;
    const filter = {
      type: { $in: ['practice', 'both'] },
    };

    if (categoryId && categoryId !== 'all') {
      filter.categoryId = categoryId;
    }
    if (subject && subject !== 'all') {
      filter.subject = subject;
    }
    if (topic && topic !== 'all') {
      filter.topic = topic;
    }
    if (difficulty && difficulty !== 'all') {
      filter.difficulty = difficulty;
    }
    if (mode && mode !== 'all') {
      filter.practiceMode = { $in: [mode, 'both'] };
    }

    const questionLimit = parseInt(limit, 10) || 50;

    // Return practice questions with options, but NOT correctOptionIndex or explanation upfront if candidate is answering
    // Wait, the client can submit individual answers, OR we can provide full data if client-side immediate feedback is preferred.
    // Let's include correctOptionIndex and explanation so client can immediately display feedback on click without waiting for roundtrips, or allow single question verification via /verify.
    const questions = await Question.find(filter)
      .populate('categoryId', 'name slug')
      .limit(questionLimit);

    res.json({ success: true, count: questions.length, questions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/practice/verify (Single question answer verification)
exports.verifyAnswer = async (req, res) => {
  try {
    const { questionId, selectedOption } = req.body;

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found.' });
    }

    const isCorrect = Number(selectedOption) === Number(question.correctOptionIndex);

    res.json({
      success: true,
      isCorrect,
      correctOptionIndex: question.correctOptionIndex,
      explanation: question.explanation,
      marks: question.marks,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/practice/filters (Get unique categories, subjects, topics)
exports.getPracticeFilters = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).select('name slug');
    const subjects = await Question.distinct('subject');
    const topics = await Question.distinct('topic');

    res.json({
      success: true,
      categories,
      subjects: subjects.filter(Boolean),
      topics: topics.filter(Boolean),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/practice/questions (Admin create practice question)
exports.createPracticeQuestion = async (req, res) => {
  try {
    const {
      text,
      codeSnippet,
      imageUrl,
      options,
      correctOptionIndex,
      explanation,
      categoryId,
      subject,
      topic,
      difficulty,
      practiceMode,
    } = req.body;

    if (!text || !options || options.length < 2 || correctOptionIndex === undefined || !categoryId) {
      return res.status(400).json({ success: false, message: 'Required question fields missing.' });
    }

    const question = await Question.create({
      text,
      codeSnippet: codeSnippet || '',
      imageUrl: imageUrl || '',
      options,
      correctOptionIndex: Number(correctOptionIndex),
      explanation: explanation || '',
      categoryId,
      subject: subject || 'General',
      topic: topic || 'General',
      difficulty: difficulty || 'Medium',
      type: 'practice',
      practiceMode: practiceMode || 'both',
    });

    res.status(201).json({ success: true, message: 'Practice question created.', question });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
