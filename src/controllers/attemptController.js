const Attempt = require('../models/Attempt');
const Test = require('../models/Test');
const Question = require('../models/Question');
const Category = require('../models/Category');
const { generateAIReview } = require('../services/aiReviewService');

// POST /api/attempts/submit
exports.submitAttempt = async (req, res) => {
  try {
    const { testId, answers, timeSpentSeconds, startedAt } = req.body;
    const userId = req.user._id;

    if (!testId || !answers) {
      return res.status(400).json({ success: false, message: 'Test ID and answers are required.' });
    }

    const test = await Test.findById(testId).populate('categoryId').populate('questions');
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found.' });
    }

    // Evaluate answers
    let score = 0;
    let totalMarks = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    const evaluatedAnswers = test.questions.map((question) => {
      const qIdStr = question._id.toString();
      totalMarks += question.marks || 4;

      const userAns = answers.find(a => a.questionId && a.questionId.toString() === qIdStr);
      const selectedOption = userAns && userAns.selectedOption !== undefined ? userAns.selectedOption : -1;
      const selectedOptions = userAns && Array.isArray(userAns.selectedOptions) ? userAns.selectedOptions : [];
      const userBlank = userAns && userAns.blankAnswer ? userAns.blankAnswer.trim() : '';
      const timeSpent = userAns ? (userAns.timeSpent || 0) : 0;
      const markedForReview = userAns ? !!userAns.markedForReview : false;

      let isCorrect = false;
      let marksAwarded = 0;
      const qType = question.questionType || 'single';

      if (qType === 'multiple') {
        const correctSet = new Set(question.correctOptionIndices || [question.correctOptionIndex]);
        const userSet = new Set(selectedOptions);
        if (userSet.size === 0) {
          unansweredCount += 1;
          marksAwarded = 0;
        } else if (correctSet.size === userSet.size && [...correctSet].every(val => userSet.has(val))) {
          isCorrect = true;
          correctCount += 1;
          marksAwarded = question.marks || 4;
          score += marksAwarded;
        } else {
          incorrectCount += 1;
          marksAwarded = -(question.negativeMarks || 0);
          score += marksAwarded;
        }
      } else if (qType === 'blank') {
        if (!userBlank) {
          unansweredCount += 1;
          marksAwarded = 0;
        } else if (userBlank.toLowerCase() === (question.blankAnswer || '').trim().toLowerCase()) {
          isCorrect = true;
          correctCount += 1;
          marksAwarded = question.marks || 4;
          score += marksAwarded;
        } else {
          incorrectCount += 1;
          marksAwarded = -(question.negativeMarks || 0);
          score += marksAwarded;
        }
      } else {
        // Single MCQ
        if (selectedOption === -1 || selectedOption === null || selectedOption === undefined) {
          unansweredCount += 1;
          marksAwarded = 0;
        } else if (Number(selectedOption) === Number(question.correctOptionIndex)) {
          isCorrect = true;
          correctCount += 1;
          marksAwarded = question.marks || 4;
          score += marksAwarded;
        } else {
          incorrectCount += 1;
          marksAwarded = -(question.negativeMarks || 0);
          score += marksAwarded;
        }
      }

      return {
        questionId: question._id,
        selectedOption,
        selectedOptions,
        blankAnswer: userBlank,
        isCorrect,
        marksAwarded,
        timeSpent,
        markedForReview,
      };
    });

    const totalQuestions = test.questions.length;
    const accuracyPercentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    // Generate AI Review
    const aiReview = await generateAIReview({
      testTitle: test.title,
      categoryName: test.categoryId?.name || 'General',
      answers: evaluatedAnswers,
      questions: test.questions,
      score,
      totalMarks,
      accuracyPercentage,
      timeSpentSeconds: timeSpentSeconds || 0,
    });

    const attempt = await Attempt.create({
      userId,
      testId,
      answers: evaluatedAnswers,
      score: Math.max(0, score),
      totalMarks,
      accuracyPercentage,
      correctCount,
      incorrectCount,
      unansweredCount,
      timeSpentSeconds: timeSpentSeconds || 0,
      startedAt: startedAt ? new Date(startedAt) : new Date(Date.now() - (timeSpentSeconds || 60) * 1000),
      submittedAt: new Date(),
      status: 'completed',
      aiReview,
    });

    // Update Test statistics
    await Test.findByIdAndUpdate(testId, {
      $inc: { attemptCount: 1 },
    });

    // Populate question details for rich immediate response
    const populatedAttempt = await Attempt.findById(attempt._id)
      .populate({
        path: 'answers.questionId',
        select: 'text codeSnippet imageUrl options correctOptionIndex explanation marks negativeMarks subject topic difficulty',
      })
      .populate('testId', 'title categoryId passingMarks totalMarks difficulty timing');

    res.status(201).json({
      success: true,
      message: 'Test submitted and evaluated successfully.',
      attempt: populatedAttempt,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/attempts/:id
exports.getAttemptById = async (req, res) => {
  try {
    const attempt = await Attempt.findById(req.params.id)
      .populate({
        path: 'answers.questionId',
        select: 'text codeSnippet imageUrl options correctOptionIndex explanation marks negativeMarks subject topic difficulty',
      })
      .populate('testId', 'title categoryId passingMarks totalMarks difficulty timing')
      .populate('userId', 'name email');

    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Attempt not found.' });
    }

    // Check authorization: must be user's own attempt or admin
    if (attempt.userId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this attempt.' });
    }

    res.json({ success: true, attempt });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/attempts (User past attempts)
exports.getUserAttempts = async (req, res) => {
  try {
    const { testId } = req.query;
    const filter = { userId: req.user._id };

    if (testId) {
      filter.testId = testId;
    }

    const attempts = await Attempt.find(filter)
      .populate('testId', 'title categoryId difficulty totalMarks')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: attempts.length, attempts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/attempts/:id/ai-review (Regenerate AI review)
exports.triggerAIReview = async (req, res) => {
  try {
    const attempt = await Attempt.findById(req.params.id)
      .populate('testId')
      .populate('answers.questionId');

    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Attempt not found.' });
    }

    const category = await Category.findById(attempt.testId?.categoryId);

    const aiReview = await generateAIReview({
      testTitle: attempt.testId?.title || 'Mock Test',
      categoryName: category?.name || 'General',
      answers: attempt.answers,
      questions: attempt.answers.map(a => a.questionId),
      score: attempt.score,
      totalMarks: attempt.totalMarks,
      accuracyPercentage: attempt.accuracyPercentage,
      timeSpentSeconds: attempt.timeSpentSeconds,
    });

    attempt.aiReview = aiReview;
    await attempt.save();

    res.json({ success: true, message: 'AI Review generated successfully.', aiReview });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
