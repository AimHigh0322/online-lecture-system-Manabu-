const Exam = require("../model/Exam");
const Question = require("../model/Question");
const ExamAttempt = require("../model/ExamAttempt");
const Profile = require("../model/Profile");
const Notification = require("../model/Notification");
const User = require("../model/User");
const mongoose = require("mongoose");

// === Helper: Euclidean Distance ===
function euclideanDistance(desc1, desc2) {
  if (!desc1 || !desc2 || desc1.length !== desc2.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < desc1.length; i++) {
    const diff = desc1[i] - desc2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

// === FACE VERIFICATION ===
const verifyFace = async (req, res) => {
  try {
    const user = req.user; // from JWT
    const { faceDescriptor } = req.body;

    if (!faceDescriptor || !Array.isArray(faceDescriptor)) {
      return res.status(400).json({
        success: false,
        message: "Face descriptor is required",
      });
    }

    // Find profile
    const profile = await Profile.findOne({ userId: user.id });
    if (
      !profile ||
      !profile.faceDescriptor ||
      profile.faceDescriptor.length === 0
    ) {
      return res.status(404).json({
        success: false,
        message: "No face descriptor found for this user",
      });
    }

    // Compare descriptors
    const distance = euclideanDistance(faceDescriptor, profile.faceDescriptor);
    const threshold = 0.6; // typical threshold for face-api.js

    if (distance < threshold) {
      return res.json({
        success: true,
        message: "Face verified successfully",
        distance,
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "Face verification failed",
        distance,
      });
    }
  } catch (error) {
    console.error("Face verification error:", error);
    res.status(500).json({
      success: false,
      message: "Error verifying face",
      error: error.message,
    });
  }
};

// === Get available exams for students ===
const getAvailableExams = async (req, res) => {
  try {
    const { courseId } = req.query;
    const user = req.user;

    const query = {
      status: "published",
      isActive: true,
    };

    if (courseId) {
      query.courseId = courseId;
    }

    const exams = await Exam.find(query)
      .select("-questions")
      .sort({ createdAt: -1 });

    const availableExams = [];

    for (const exam of exams) {
      const attempts = await ExamAttempt.find({
        examId: exam._id,
        studentId: user.id,
      });

      if (attempts.length < exam.maxAttempts) {
        const inProgressAttempt = attempts.find(
          (attempt) => attempt.status === "in_progress"
        );

        availableExams.push({
          ...exam.toObject(),
          canContinue: !!inProgressAttempt,
          remainingAttempts: exam.maxAttempts - attempts.length,
        });
      }
    }

    res.json({
      success: true,
      exams: availableExams,
    });
  } catch (error) {
    console.error("Get available exams error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch available exams",
      error: error.message,
    });
  }
};

// === Get student's exam history ===
const getExamHistory = async (req, res) => {
  try {
    const user = req.user;

    const attempts = await ExamAttempt.find({ studentId: user.id })
      .populate(
        "examId",
        "title courseName totalQuestions totalPoints passingScore"
      )
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      attempts,
    });
  } catch (error) {
    console.error("Get exam history error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch exam history",
      error: error.message,
    });
  }
};

// === Start a new exam attempt ===
const startExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const user = req.user;

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    if (exam.status !== "published") {
      return res.status(400).json({
        success: false,
        message: "Exam is not available",
      });
    }

    const existingAttempts = await ExamAttempt.find({
      examId: exam._id,
      studentId: user.id,
    });

    if (existingAttempts.length >= exam.maxAttempts) {
      return res.status(400).json({
        success: false,
        message: "Maximum attempts reached for this exam",
      });
    }

    const inProgressAttempt = existingAttempts.find(
      (attempt) => attempt.status === "in_progress"
    );
    if (inProgressAttempt) {
      return res.json({
        success: true,
        attemptId: inProgressAttempt._id,
        exam: exam,
        message: "Resuming existing attempt",
      });
    }

    const attemptNumber = existingAttempts.length + 1;
    const attempt = new ExamAttempt({
      examId: exam._id,
      studentId: user.id,
      studentName: user.username || user.email,
      attemptNumber,
      status: "in_progress",
      startedAt: new Date(),
      answers: [],
      score: 0,
      percentage: 0,
      passed: false,
    });

    await attempt.save();

    res.status(201).json({
      success: true,
      attemptId: attempt._id,
      exam: exam,
      message: "Exam started successfully",
    });
  } catch (error) {
    console.error("Start exam error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to start exam",
      error: error.message,
    });
  }
};

// === Get exam questions for current attempt ===
const getExamQuestions = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const user = req.user;

    const attempt = await ExamAttempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Exam attempt not found",
      });
    }

    if (attempt.studentId !== user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (attempt.status !== "in_progress") {
      return res.status(400).json({
        success: false,
        message: "Exam attempt is not in progress",
      });
    }

    const exam = await Exam.findById(attempt.examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    const questions = await Question.find({
      examId: exam._id,
      isActive: true,
    }).sort({ order: 1 });

    if (exam.shuffleQuestions) {
      questions.sort(() => Math.random() - 0.5);
    }

    if (exam.shuffleOptions) {
      questions.forEach((question) => {
        if (question.options) {
          question.options.sort(() => Math.random() - 0.5);
        }
      });
    }

    res.json({
      success: true,
      questions,
    });
  } catch (error) {
    console.error("Get exam questions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch exam questions",
      error: error.message,
    });
  }
};

// === Save exam progress ===
const saveExamProgress = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { answers, currentQuestionIndex } = req.body;
    const user = req.user;

    const attempt = await ExamAttempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Exam attempt not found",
      });
    }

    if (attempt.studentId !== user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (attempt.status !== "in_progress") {
      return res.status(400).json({
        success: false,
        message: "Exam attempt is not in progress",
      });
    }

    await ExamAttempt.findByIdAndUpdate(attemptId, {
      answers,
      currentQuestionIndex: currentQuestionIndex || 0,
      updatedAt: new Date(),
    });

    res.json({
      success: true,
      message: "Progress saved successfully",
    });
  } catch (error) {
    console.error("Save exam progress error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save progress",
      error: error.message,
    });
  }
};

// === Submit exam ===
const submitExam = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { answers } = req.body;
    const user = req.user;

    // Log the received answers for debugging
    console.log("=== EXAM SUBMISSION RECEIVED ===");
    console.log("Attempt ID:", attemptId);
    console.log("Student ID:", user.id);
    console.log("Student Name:", user.username || user.email);
    console.log("Number of answers:", answers ? answers.length : 0);
    console.log("Answers received:", JSON.stringify(answers, null, 2));
    console.log("=================================");

    // Handle mock attempt ID for testing purposes
    if (attemptId === "mock-attempt-id") {
      console.log(
        "Mock attempt ID detected - performing grading simulation for testing"
      );

      // Use StandaloneQuestion model to find questions by their actual IDs
      const StandaloneQuestion = require("../model/StandaloneQuestion");

      // Get question IDs from student answers (these are the actual questions that were presented)
      const questionIds = answers.map((answer) => answer.questionId);

      // Get only the questions that were actually presented to the student
      const presentedQuestions = await StandaloneQuestion.find({
        _id: { $in: questionIds },
        isActive: true,
      });

      const totalQuestions = presentedQuestions.length;

      let totalScore = 0;
      const gradedAnswers = [];

      console.log("=== GRADING PROCESS ===");
      console.log("Total questions presented to examinee:", totalQuestions);
      console.log("Questions answered by student:", answers.length);

      // Create a map of student answers for quick lookup
      const studentAnswersMap = new Map();
      answers.forEach((answer) => {
        studentAnswersMap.set(answer.questionId, answer);
      });

      // Create a map of questions for quick lookup
      const questionsMap = new Map();
      presentedQuestions.forEach((question) => {
        questionsMap.set(question._id.toString(), question);
      });

      // Grade only the questions that were presented to the examinee
      for (const questionId of questionIds) {
        const question = questionsMap.get(questionId);
        if (!question) {
          console.warn(`Question ${questionId} not found, skipping`);
          continue;
        }
        console.log("Grading question ID:", question._id);
        console.log("Found question:", question.content);
        console.log("Question type:", question.type);

        // Check if student answered this question
        const studentAnswer = studentAnswersMap.get(question._id.toString());
        const studentAnswered = !!studentAnswer;

        console.log("Student answered this question:", studentAnswered);
        if (studentAnswered) {
          console.log("Student answer:", studentAnswer.answer);
        } else {
          console.log("Student did not answer this question");
        }

        let isCorrect = false;
        let pointsEarned = 0;

        // Grade based on question type
        if (question.type === "true_false") {
          if (studentAnswered) {
            isCorrect = studentAnswer.answer === question.correctAnswer;
          }
          console.log("Correct answer:", question.correctAnswer);
          console.log(
            "Student answer:",
            studentAnswered ? studentAnswer.answer : "No answer"
          );
          console.log("Is correct:", isCorrect);
        } else if (question.type === "single_choice") {
          const correctOption = question.options.find((opt) => opt.isCorrect);
          if (studentAnswered) {
            isCorrect = studentAnswer.answer === correctOption?.id;
          }
          console.log("Correct option ID:", correctOption?.id);
          console.log(
            "Student answer:",
            studentAnswered ? studentAnswer.answer : "No answer"
          );
          console.log("Is correct:", isCorrect);
        } else if (question.type === "multiple_choice") {
          const correctOptionIds = question.options
            .filter((opt) => opt.isCorrect)
            .map((opt) => opt.id)
            .sort();
          if (studentAnswered) {
            const studentAnswers = Array.isArray(studentAnswer.answer)
              ? studentAnswer.answer.sort()
              : [];
            isCorrect =
              JSON.stringify(studentAnswers) ===
              JSON.stringify(correctOptionIds);
          }
          console.log("Correct option IDs:", correctOptionIds);
          console.log(
            "Student answers:",
            studentAnswered ? studentAnswer.answer : "No answer"
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
          questionContent: question.content || question.title || "",
          questionType: question.type,
          answer: studentAnswered ? studentAnswer.answer : null,
          answeredAt: studentAnswered ? studentAnswer.answeredAt : null,
          isCorrect,
          pointsEarned,
          studentAnswered,
          correctAnswer: question.correctAnswer,
          options: question.options,
        });
      }

      // Get exam settings for passing score
      const ExamSettings = require("../model/ExamSettings");
      const examSettings = await ExamSettings.getSettings();
      const passingScore = examSettings.passingScore || 60;

      // For mock attempts, we need to get the exam to retrieve totalQuestions
      // Since we don't have examId in mock attempts, use presentedQuestions.length as fallback
      // In real scenarios, this should use exam.totalQuestions
      const mockTotalQuestions = presentedQuestions.length;

      // Calculate percentage based on correct answers divided by total questions (admin-submitted)
      const percentage =
        mockTotalQuestions > 0
          ? Math.round((totalScore / mockTotalQuestions) * 100)
          : 0;
      const passed = percentage >= passingScore;

      console.log("=== GRADING RESULTS ===");
      console.log("Total Score:", totalScore);
      console.log("Total Questions (admin-submitted):", mockTotalQuestions);
      console.log("Percentage:", percentage + "%");
      console.log("Passed:", passed);
      console.log(
        "Score divided by total questions:",
        totalScore + "/" + mockTotalQuestions
      );
      console.log("Graded Answers:", JSON.stringify(gradedAnswers, null, 2));
      console.log("======================");

      return res.json({
        success: true,
        message: "Mock exam submitted and graded successfully",
        attempt: {
          _id: "mock-attempt-id",
          status: "completed",
          answers: gradedAnswers,
          score: totalScore,
          percentage: percentage,
          passed: passed,
          studentId: user.id,
          studentName: user.username || user.email,
        },
      });
    }

    // Verify attempt exists and belongs to user
    const attempt = await ExamAttempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Exam attempt not found",
      });
    }

    if (attempt.studentId !== user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (attempt.status !== "in_progress") {
      return res.status(400).json({
        success: false,
        message: "Exam attempt is not in progress",
      });
    }

    // Get the exam to retrieve total questions count (admin-submitted questions)
    // Only try to find exam if examId is a valid MongoDB ObjectId
    let exam = null;
    if (attempt.examId && mongoose.Types.ObjectId.isValid(attempt.examId)) {
      try {
        exam = await Exam.findById(attempt.examId);
      } catch (error) {
        console.warn(
          "Failed to find exam by ID:",
          attempt.examId,
          error.message
        );
        exam = null;
      }
    }

    // If exam is not found, we'll use presentedQuestions.length as fallback
    // This allows the exam submission to proceed even if exam lookup fails

    // Get questions for grading using StandaloneQuestion
    const StandaloneQuestion = require("../model/StandaloneQuestion");

    // Get question IDs from student answers (these are the actual questions that were presented)
    const questionIds = answers.map((answer) => answer.questionId);

    // Get only the questions that were actually presented to the student
    const presentedQuestions = await StandaloneQuestion.find({
      _id: { $in: questionIds },
      isActive: true,
    });

    // Use totalQuestions from exam (admin-submitted questions) instead of presentedQuestions.length
    // This ensures the score is calculated as: correct answers / admin-submitted questions
    const totalQuestions = exam.totalQuestions || presentedQuestions.length;

    let totalScore = 0;
    const gradedAnswers = [];

    console.log("=== REAL EXAM GRADING PROCESS ===");
    console.log("Total questions (admin-submitted):", totalQuestions);
    console.log("Questions presented to student:", presentedQuestions.length);
    console.log("Questions answered by student:", answers.length);

    // Create a map of student answers for quick lookup
    const studentAnswersMap = new Map();
    answers.forEach((answer) => {
      studentAnswersMap.set(answer.questionId, answer);
    });

    // Create a map of questions for quick lookup
    const questionsMap = new Map();
    presentedQuestions.forEach((question) => {
      questionsMap.set(question._id.toString(), question);
    });

    // Grade only the questions that were presented to the examinee
    for (const questionId of questionIds) {
      const question = questionsMap.get(questionId);
      if (!question) {
        console.warn(`Question ${questionId} not found, skipping`);
        continue;
      }
      console.log("Grading question ID:", question._id);
      console.log("Found question:", question.content);
      console.log("Question type:", question.type);

      // Check if student answered this question
      const studentAnswer = studentAnswersMap.get(question._id.toString());
      const studentAnswered = !!studentAnswer;

      console.log("Student answered this question:", studentAnswered);
      if (studentAnswered) {
        console.log("Student answer:", studentAnswer.answer);
      } else {
        console.log("Student did not answer this question");
      }

      let isCorrect = false;
      let pointsEarned = 0;

      // Grade based on question type
      if (question.type === "true_false") {
        if (studentAnswered) {
          isCorrect = studentAnswer.answer === question.correctAnswer;
        }
        console.log("Correct answer:", question.correctAnswer);
        console.log(
          "Student answer:",
          studentAnswered ? studentAnswer.answer : "No answer"
        );
        console.log("Is correct:", isCorrect);
      } else if (question.type === "single_choice") {
        const correctOption = question.options.find((opt) => opt.isCorrect);
        if (studentAnswered) {
          isCorrect = studentAnswer.answer === correctOption?.id;
        }
        console.log("Correct option ID:", correctOption?.id);
        console.log(
          "Student answer:",
          studentAnswered ? studentAnswer.answer : "No answer"
        );
        console.log("Is correct:", isCorrect);
      } else if (question.type === "multiple_choice") {
        const correctOptionIds = question.options
          .filter((opt) => opt.isCorrect)
          .map((opt) => opt.id)
          .sort();
        if (studentAnswered) {
          const studentAnswers = Array.isArray(studentAnswer.answer)
            ? studentAnswer.answer.sort()
            : [];
          isCorrect =
            JSON.stringify(studentAnswers) === JSON.stringify(correctOptionIds);
        }
        console.log("Correct option IDs:", correctOptionIds);
        console.log(
          "Student answers:",
          studentAnswered ? studentAnswer.answer : "No answer"
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
        questionContent: question.content || question.title || "",
        questionType: question.type,
        answer: studentAnswered ? studentAnswer.answer : null,
        answeredAt: studentAnswered ? studentAnswer.answeredAt : null,
        isCorrect,
        pointsEarned,
        studentAnswered,
        correctAnswer: question.correctAnswer,
        options: question.options,
      });
    }

    // Get exam settings for passing score
    const ExamSettings = require("../model/ExamSettings");
    const examSettings = await ExamSettings.getSettings();
    const passingScore = examSettings.passingScore || 60;

    // Calculate percentage based on correct answers divided by total questions
    const percentage =
      totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;
    const passed = percentage >= passingScore;

    console.log("=== REAL EXAM GRADING RESULTS ===");
    console.log("Total Score:", totalScore);
    console.log("Total Questions (admin-submitted):", totalQuestions);
    console.log("Questions presented to student:", presentedQuestions.length);
    console.log("Percentage:", percentage + "%");
    console.log("Passed:", passed);
    console.log(
      "Score divided by total questions (admin-submitted):",
      totalScore + "/" + totalQuestions
    );
    console.log("Graded Answers:", JSON.stringify(gradedAnswers, null, 2));
    console.log("==================================");

    // Update attempt with submitted answers and grading results
    const completedAttempt = await ExamAttempt.findByIdAndUpdate(
      attemptId,
      {
        status: "completed",
        completedAt: new Date(),
        timeSpent: Math.floor(
          (new Date() - new Date(attempt.startedAt)) / 1000
        ),
        answers: gradedAnswers,
        score: totalScore,
        percentage: percentage,
        passed: passed,
        updatedAt: new Date(),
      },
      { new: true }
    );

    // If exam passed, send notification to all admins
    if (passed) {
      try {
        const admins = await User.find({ role: "admin" });
        const student = await User.findById(user.id);
        const studentName = student?.username || student?.email || "受講生";

        const notifications = admins.map((admin) => ({
          title: "試験合格通知",
          message: `${studentName}さんが試験に合格しました。修了証を発行してください。`,
          recipientId: admin._id.toString(),
          senderId: "system",
          type: "success",
          metadata: {
            userId: user.id,
            studentName: studentName,
            action: "issue_certificate",
          },
        }));

        if (notifications.length > 0) {
          await Notification.insertMany(notifications);
          console.log(
            `Sent exam pass notification to ${admins.length} admin(s)`
          );
        }
      } catch (error) {
        console.error("Error sending exam pass notification:", error);
        // Don't fail the exam submission if notification fails
      }
    }

    res.json({
      success: true,
      message: "Exam submitted and graded successfully",
      attempt: completedAttempt,
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

// === Get specific exam attempt ===
const getExamAttempt = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const user = req.user;

    if (attemptId === "mock-attempt-id") {
      const mockAttempt = {
        _id: "mock-attempt-id",
        examId: "mock-exam-id",
        studentId: user.id,
        studentName: user.username || user.email,
        attemptNumber: 1,
        status: "completed",
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        timeSpent: 300,
        answers: [],
        score: 1,
        percentage: 50,
        passed: false,
      };
      return res.json({ success: true, attempt: mockAttempt });
    }

    const attempt = await ExamAttempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Exam attempt not found",
      });
    }

    if (attempt.studentId !== user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.json({
      success: true,
      attempt,
    });
  } catch (error) {
    console.error("Get exam attempt error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch exam attempt",
      error: error.message,
    });
  }
};

module.exports = {
  getAvailableExams,
  getExamHistory,
  startExam,
  getExamQuestions,
  saveExamProgress,
  submitExam,
  getExamAttempt,
  verifyFace, // 👈 NEW export
};
