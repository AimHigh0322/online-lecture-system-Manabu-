const StandaloneQuestion = require("../model/StandaloneQuestion");
const ExamHistory = require("../model/ExamHistory");
const ExamSettings = require("../model/ExamSettings");

// Submit exam and store results
const submitExam = async (req, res) => {
  try {
    const {
      examineeId,
      examId,
      answers,
      totalQuestions,
      timeSpent,
      submittedAt,
    } = req.body;

    const user = req.user;

    console.log("=== EXAM SUBMISSION RECEIVED ===");
    console.log("Examinee ID:", examineeId);
    console.log("Exam ID:", examId);
    console.log("User ID:", user.id);
    console.log("Number of answers:", answers.length);
    console.log("Answers:", JSON.stringify(answers, null, 2));
    console.log("=================================");

    // Get all questions to calculate results
    const allQuestions = await StandaloneQuestion.find({ isActive: true });
    const totalQuestionsInDB = allQuestions.length;

    // Get exam settings for time limit and number of questions
    const examSettings = await ExamSettings.getSettings();
    const timeLimitMinutes = examSettings.timeLimit || 60; // Default to 60 minutes
    const numberOfQuestions = examSettings.numberOfQuestions || 20; // Default to 20 questions

    let totalScore = 0;
    const gradedAnswers = [];

    console.log("=== GRADING PROCESS ===");
    console.log("Total questions in database:", totalQuestionsInDB);
    console.log("Questions answered by examinee:", answers.length);

    // Create a map of examinee answers for quick lookup
    const examineeAnswersMap = new Map();
    answers.forEach((answer) => {
      examineeAnswersMap.set(answer.questionId, answer);
    });

    // Grade only the questions that were submitted to the examinee (limited by numberOfQuestions setting)
    const questionsToGrade = allQuestions.slice(0, numberOfQuestions);
    for (const question of questionsToGrade) {
      console.log("Grading question ID:", question._id);
      console.log("Found question:", question.content);
      console.log("Question type:", question.type);

      // Check if examinee answered this question
      const examineeAnswer = examineeAnswersMap.get(question._id.toString());
      const examineeAnswered = !!examineeAnswer;

      console.log("Examinee answered this question:", examineeAnswered);
      if (examineeAnswered) {
        console.log("Examinee answer:", examineeAnswer.answer);
      } else {
        console.log("Examinee did not answer this question");
      }

      let isCorrect = false;
      let pointsEarned = 0;

      // Grade based on question type
      if (question.type === "true_false") {
        if (examineeAnswered) {
          isCorrect = examineeAnswer.answer === question.correctAnswer;
        }
        console.log("Correct answer:", question.correctAnswer);
        console.log(
          "Examinee answer:",
          examineeAnswered ? examineeAnswer.answer : "No answer"
        );
        console.log("Is correct:", isCorrect);
      } else if (question.type === "single_choice") {
        const correctOption = question.options.find((opt) => opt.isCorrect);
        if (examineeAnswered) {
          isCorrect = examineeAnswer.answer === correctOption?.id;
        }
        console.log("Correct option ID:", correctOption?.id);
        console.log(
          "Examinee answer:",
          examineeAnswered ? examineeAnswer.answer : "No answer"
        );
        console.log("Is correct:", isCorrect);
      } else if (question.type === "multiple_choice") {
        const correctOptionIds = question.options
          .filter((opt) => opt.isCorrect)
          .map((opt) => opt.id)
          .sort();
        if (examineeAnswered) {
          const examineeAnswers = Array.isArray(examineeAnswer.answer)
            ? examineeAnswer.answer.sort()
            : [];
          isCorrect =
            JSON.stringify(examineeAnswers) ===
            JSON.stringify(correctOptionIds);
        }
        console.log("Correct option IDs:", correctOptionIds);
        console.log(
          "Examinee answers:",
          examineeAnswered ? examineeAnswer.answer : "No answer"
        );
        console.log("Is correct:", isCorrect);
      }

      if (isCorrect) {
        pointsEarned = 1; // Each question is worth 1 point
        totalScore += pointsEarned;
      }

      // Add to graded answers (include all questions, answered or not)
      gradedAnswers.push({
        questionId: question._id.toString(),
        questionContent: question.content,
        questionType: question.type,
        answer: examineeAnswered ? examineeAnswer.answer : null,
        answeredAt: examineeAnswered ? examineeAnswer.answeredAt : null,
        isCorrect,
        pointsEarned,
        examineeAnswered,
        correctAnswer: question.correctAnswer,
        options: question.options,
      });
    }

    // Calculate percentage based on correct answers divided by number of questions in exam
    const percentage =
      numberOfQuestions > 0
        ? Math.round((totalScore / numberOfQuestions) * 100)
        : 0;
    const passed = percentage >= examSettings.passingScore;

    console.log("=== GRADING RESULTS ===");
    console.log("Total Score:", totalScore);
    console.log("Questions in Exam:", numberOfQuestions);
    console.log("Percentage:", percentage + "%");
    console.log("Passing Score:", examSettings.passingScore + "%");
    console.log("Passed:", passed);
    console.log(
      "Score divided by exam questions:",
      totalScore + "/" + numberOfQuestions
    );

    // Store exam results in the database
    const examResult = {
      examineeId: user.id,
      examineeName: user.username || user.email,
      answers: gradedAnswers,
      score: totalScore,
      totalQuestions: numberOfQuestions,
      percentage: percentage,
      passed: passed,
      passingGrade: examSettings.passingScore,
      timeAll: timeLimitMinutes * 60, // Total time allocated in seconds
      timeSpent: timeSpent,
      submittedAt: new Date(submittedAt),
      gradedAt: new Date(),
      status: "completed",
    };

    // Save to examHistories collection
    const savedExamHistory = new ExamHistory(examResult);
    await savedExamHistory.save();

    console.log("Exam results saved to database:", savedExamHistory._id);
    console.log("Exam results:", JSON.stringify(examResult, null, 2));

    res.json({
      success: true,
      message: "Exam submitted and graded successfully",
      examResult: examResult,
      examHistoryId: savedExamHistory._id,
    });
  } catch (error) {
    console.error("Submit exam error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit exam",
      error: error.message,
    });
  }
};

// Get exam results by exam history ID
const getExamResults = async (req, res) => {
  try {
    const { examHistoryId } = req.params;
    const user = req.user;

    const examHistory = await ExamHistory.findById(examHistoryId);

    if (!examHistory) {
      return res.status(404).json({
        success: false,
        message: "Exam history not found",
      });
    }

    // Check if the exam history belongs to the current user
    if (examHistory.examineeId !== user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.json({
      success: true,
      message: "Exam results retrieved successfully",
      examResults: examHistory,
    });
  } catch (error) {
    console.error("Get exam results error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch exam results",
      error: error.message,
    });
  }
};

// Get exam histories for an examinee
const getExamHistories = async (req, res) => {
  try {
    const user = req.user;
    const { page = 1, limit = 10 } = req.query;

    const query = { examineeId: user.id };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const examHistories = await ExamHistory.find(query)
      .select("-answers") // Don't include detailed answers in list
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalHistories = await ExamHistory.countDocuments(query);

    // Get statistics for the examinee
    const stats = await ExamHistory.getExamineeStats(user.id);

    res.json({
      success: true,
      examHistories,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalHistories / parseInt(limit)),
        totalHistories,
        hasNext: skip + examHistories.length < totalHistories,
        hasPrev: parseInt(page) > 1,
      },
      statistics: stats,
    });
  } catch (error) {
    console.error("Get exam histories error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch exam histories",
      error: error.message,
    });
  }
};

// Get all exam histories for admin
const getAllExamHistories = async (req, res) => {
  try {
    const user = req.user;
    const { page = 1, limit = 10 } = req.query;

    // Check if user is admin (you might want to add proper admin role checking)
    // For now, we'll allow any authenticated user to access all histories
    const query = {}; // No filter - get all exam histories

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const examHistories = await ExamHistory.find(query)
      .select("-answers") // Don't include detailed answers in list
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalHistories = await ExamHistory.countDocuments(query);

    // Get overall statistics
    const stats = await ExamHistory.aggregate([
      {
        $group: {
          _id: null,
          totalExams: { $sum: 1 },
          averageScore: { $avg: "$score" },
          averagePercentage: { $avg: "$percentage" },
          passedExams: { $sum: { $cond: ["$passed", 1, 0] } },
          totalTimeSpent: { $sum: "$timeSpent" },
          totalTimeAllocated: { $sum: "$timeAll" },
          bestScore: { $max: "$score" },
          bestPercentage: { $max: "$percentage" },
        },
      },
    ]);

    const result = stats[0] || {
      totalExams: 0,
      averageScore: 0,
      averagePercentage: 0,
      passedExams: 0,
      totalTimeSpent: 0,
      totalTimeAllocated: 0,
      bestScore: 0,
      bestPercentage: 0,
    };

    res.json({
      success: true,
      examHistories,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalHistories / parseInt(limit)),
        totalHistories,
        hasNext: skip + examHistories.length < totalHistories,
        hasPrev: parseInt(page) > 1,
      },
      statistics: result,
    });
  } catch (error) {
    console.error("Get all exam histories error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch exam histories",
      error: error.message,
    });
  }
};

// Get exam statistics
const getExamStats = async (req, res) => {
  try {
    const user = req.user;

    // Get overall statistics
    const stats = await ExamHistory.aggregate([
      {
        $group: {
          _id: null,
          totalExams: { $sum: 1 },
          averageScore: { $avg: "$score" },
          averagePercentage: { $avg: "$percentage" },
          passedExams: { $sum: { $cond: ["$passed", 1, 0] } },
          totalTimeSpent: { $sum: "$timeSpent" },
          totalTimeAllocated: { $sum: "$timeAll" },
          bestScore: { $max: "$score" },
          bestPercentage: { $max: "$percentage" },
        },
      },
    ]);

    const result = stats[0] || {
      totalExams: 0,
      averageScore: 0,
      averagePercentage: 0,
      passedExams: 0,
      totalTimeSpent: 0,
      totalTimeAllocated: 0,
      bestScore: 0,
      bestPercentage: 0,
    };

    res.json({
      success: true,
      stats: result,
    });
  } catch (error) {
    console.error("Error fetching exam stats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching exam statistics",
      error: error.message,
    });
  }
};

// Update exam history (admin only)
const updateExamHistory = async (req, res) => {
  try {
    const { examHistoryId } = req.params;
    const {
      examineeName,
      score,
      totalQuestions,
      percentage,
      passed,
      timeSpent,
      timeAll,
    } = req.body;

    // Find the exam history
    const examHistory = await ExamHistory.findById(examHistoryId);
    if (!examHistory) {
      return res.status(404).json({
        success: false,
        message: "Exam history not found",
      });
    }

    // Update the fields
    if (examineeName !== undefined) examHistory.examineeName = examineeName;
    if (score !== undefined) examHistory.score = score;
    if (totalQuestions !== undefined)
      examHistory.totalQuestions = totalQuestions;
    if (percentage !== undefined) examHistory.percentage = percentage;
    if (passed !== undefined) examHistory.passed = passed;
    if (timeSpent !== undefined) examHistory.timeSpent = timeSpent;
    if (timeAll !== undefined) examHistory.timeAll = timeAll;

    // Update gradedAt timestamp
    examHistory.gradedAt = new Date();

    await examHistory.save();

    res.json({
      success: true,
      message: "Exam history updated successfully",
      examHistory: examHistory,
    });
  } catch (error) {
    console.error("Update exam history error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update exam history",
      error: error.message,
    });
  }
};

// Delete exam history (admin only)
const deleteExamHistory = async (req, res) => {
  try {
    const { examHistoryId } = req.params;

    const examHistory = await ExamHistory.findById(examHistoryId);
    if (!examHistory) {
      return res.status(404).json({
        success: false,
        message: "Exam history not found",
      });
    }

    await ExamHistory.findByIdAndDelete(examHistoryId);

    res.json({
      success: true,
      message: "Exam history deleted successfully",
    });
  } catch (error) {
    console.error("Delete exam history error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete exam history",
      error: error.message,
    });
  }
};

module.exports = {
  submitExam,
  getExamResults,
  getExamHistories,
  getAllExamHistories,
  getExamStats,
  updateExamHistory,
  deleteExamHistory,
};
