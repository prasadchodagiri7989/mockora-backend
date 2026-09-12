/**
 * AI Performance Review Service — Gemini-Powered
 * Evaluates candidate attempt results, identifies concept deficiencies,
 * and generates structured diagnostic analysis and personalized study plans.
 * Uses Google Gemini API when GEMINI_API_KEY is configured, falls back to
 * built-in structured analytical review otherwise.
 */

const generateAIReview = async ({ testTitle, categoryName, answers, questions, score, totalMarks, accuracyPercentage, timeSpentSeconds }) => {
  // 1. Analyze performance by topic and subject
  const topicStats = {};
  const missedQuestions = [];

  questions.forEach((q, idx) => {
    const questionIdStr = q._id.toString();
    const studentAnswer = answers.find(a => (a.questionId && a.questionId.toString() === questionIdStr) || a.questionIndex === idx);
    
    const topic = q.topic || 'Core Principles';
    const subject = q.subject || categoryName || 'General';
    const topicKey = `${subject} - ${topic}`;

    if (!topicStats[topicKey]) {
      topicStats[topicKey] = { total: 0, correct: 0, incorrect: 0, unanswered: 0, topic, subject };
    }

    topicStats[topicKey].total += 1;

    if (!studentAnswer || studentAnswer.selectedOption === -1 || studentAnswer.selectedOption === null || studentAnswer.selectedOption === undefined) {
      topicStats[topicKey].unanswered += 1;
      missedQuestions.push({ questionText: q.text, topic, subject, reason: 'unanswered', explanation: q.explanation });
    } else if (studentAnswer.isCorrect) {
      topicStats[topicKey].correct += 1;
    } else {
      topicStats[topicKey].incorrect += 1;
      missedQuestions.push({ questionText: q.text, topic, subject, reason: 'incorrect', explanation: q.explanation });
    }
  });

  // 2. Classify weak areas (<60% accuracy or skipped)
  const weakAreasList = [];
  const strongAreasList = [];

  Object.entries(topicStats).forEach(([topicKey, stats]) => {
    const topicAccuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
    if (topicAccuracy < 60) {
      weakAreasList.push({
        topic: stats.topic,
        subject: stats.subject,
        accuracy: Math.round(topicAccuracy),
        missed: stats.incorrect + stats.unanswered,
      });
    } else {
      strongAreasList.push({
        topic: stats.topic,
        subject: stats.subject,
        accuracy: Math.round(topicAccuracy),
      });
    }
  });

  // Sort weak areas by most missed
  weakAreasList.sort((a, b) => b.missed - a.missed);

  // Fallback / Built-in dynamic synthesizer
  const extractedWeakNames = weakAreasList.length > 0 
    ? weakAreasList.slice(0, 4).map(w => `${w.subject}: ${w.topic} (${w.accuracy}% accuracy)`)
    : ['Edge Cases & Timed Decision Making', 'Complex Multi-step Problem Solving'];

  const suggestedTopicsList = weakAreasList.length > 0
    ? weakAreasList.slice(0, 4).map(w => `${w.topic} revision & targeted practice drills`)
    : ['Advanced problem variants', 'Speed and accuracy optimization'];

  // Craft personalized encouraging summary text
  let performanceBand = '';
  if (accuracyPercentage >= 85) {
    performanceBand = 'Outstanding mastery! You exhibited superior conceptual clarity and sharp precision across most sections.';
  } else if (accuracyPercentage >= 70) {
    performanceBand = 'Solid performance! You have a firm grasp of the fundamental syllabus, with minor lapses in high-complexity questions.';
  } else if (accuracyPercentage >= 50) {
    performanceBand = 'Decent foundation, but conceptual gaps in specific sub-modules are pulling down your aggregate percentile.';
  } else {
    performanceBand = 'Substantial opportunity for upward momentum. Prioritize reinforcing core theory before attempting timed full-length simulations.';
  }

  const minutesSpent = Math.max(1, Math.round(timeSpentSeconds / 60));
  const weakestHighlights = weakAreasList.slice(0, 2).map(w => w.topic).join(' and ');

  const summaryText = `${performanceBand} In this ${testTitle} attempt, you achieved ${accuracyPercentage}% accuracy over ${minutesSpent} minute(s). ${
    weakestHighlights 
      ? `Our diagnostic engine detected repeated friction around ${weakestHighlights}. We strongly recommend reviewing the corresponding resource notes and running untimed practice drills on these exact topics.`
      : `Continue reinforcing your quick elimination strategies and revision cadence to maintain this high-percentile benchmark.`
  }`;

  const recommendedResources = [
    `${categoryName || 'Exam'} Comprehensive Revision High-Yield Notes`,
    `Topic Drill: ${weakAreasList[0] ? weakAreasList[0].topic : 'High Weightage Concepts'} Practice Set`,
    `Formula & Key Concepts Cheat Sheet`,
  ];

  // === GEMINI API INTEGRATION ===
  console.log('[AI Review] Invoking Gemini check... API Key defined:', Boolean(process.env.GEMINI_API_KEY));
  if (process.env.GEMINI_API_KEY) {
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
      console.log('[AI Review] Calling Gemini model:', modelName);
      const model = genAI.getGenerativeModel({ model: modelName });

      // Build a rich context payload for Gemini
      const missedSummary = missedQuestions.slice(0, 8).map(q =>
        `- [${q.reason.toUpperCase()}] Topic: "${q.topic}" | Subject: "${q.subject}"\n  Q: ${(q.questionText || '').slice(0, 120)}...\n  Correct Explanation: ${(q.explanation || 'N/A').slice(0, 200)}`
      ).join('\n');

      const weakSummary = weakAreasList.slice(0, 5).map(w =>
        `- ${w.subject}: ${w.topic} — ${w.accuracy}% accuracy (${w.missed} missed)`
      ).join('\n');

      const prompt = `You are an expert academic performance coach analyzing a student's mock exam results. Provide a highly personalized, actionable diagnostic review.

## Exam Context
- Test: "${testTitle}"
- Category / Stream: ${categoryName}
- Score: ${score}/${totalMarks} | Accuracy: ${accuracyPercentage}%
- Time Spent: ${Math.round(timeSpentSeconds / 60)} minutes

## Performance Data
### Weak Areas (below 60% accuracy):
${weakSummary || 'None identified — excellent performance!'}

### Missed / Incorrect Questions Sample:
${missedSummary || 'All questions answered correctly!'}

## Your Task
Provide a JSON response with EXACTLY this structure (no markdown, pure JSON):
{
  "summaryText": "3-4 sentence personalized summary with specific loopholes identified and encouragement",
  "weakAreas": ["specific loophole 1 with subject", "specific loophole 2", "specific loophole 3", "specific loophole 4"],
  "suggestedTopics": ["concrete study action 1", "concrete study action 2", "concrete study action 3", "concrete study action 4"],
  "recommendedResources": ["resource suggestion 1", "resource suggestion 2", "resource suggestion 3"],
  "preparationConcepts": ["key concept to master 1", "key concept to master 2", "key concept to master 3"],
  "timeManagementTip": "specific time management advice based on their performance"
}

Be specific about subject areas. Use the actual topics from the data. Keep each string concise (under 120 chars).`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text().trim();

      // Parse Gemini JSON response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const geminiData = JSON.parse(jsonMatch[0]);
        console.log('[AI Review] Gemini analysis generated successfully.');
        return {
          weakAreas: geminiData.weakAreas || extractedWeakNames,
          suggestedTopics: geminiData.suggestedTopics || suggestedTopicsList,
          summaryText: geminiData.summaryText || summaryText,
          recommendedResources: geminiData.recommendedResources || recommendedResources,
          preparationConcepts: geminiData.preparationConcepts || [],
          timeManagementTip: geminiData.timeManagementTip || '',
          generatedAt: new Date(),
          aiProvider: 'gemini',
        };
      }
    } catch (geminiErr) {
      console.error('[AI Review] Gemini API call failed:', geminiErr);
    }
  } else {
    console.warn('[AI Review] process.env.GEMINI_API_KEY is missing or empty.');
  }

  // Fallback: built-in structured analytical review (no API key needed)
  return {
    weakAreas: extractedWeakNames,
    suggestedTopics: suggestedTopicsList,
    summaryText,
    recommendedResources,
    preparationConcepts: weakAreasList.slice(0, 3).map(w => `Review core concepts in ${w.topic}`),
    timeManagementTip: timeSpentSeconds > 0 ? `You spent ${Math.round(timeSpentSeconds / 60)} minutes. Aim to allocate time evenly across sections.` : '',
    generatedAt: new Date(),
    aiProvider: 'built-in',
  };
};

module.exports = {
  generateAIReview,
};
