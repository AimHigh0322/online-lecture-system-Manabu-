import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./app/homepage/HomePage";
import Login from "./app/auth/Login";
import Register from "./app/auth/Register";
import CourseSelection from "./app/courses/CourseSelection";
import CourseLearning from "./app/courses/CourseLearning";
import Payment from "./app/payment/Payment";
import PaymentSuccess from "./app/payment/PaymentSuccess";
import { ProfileManagement } from "./app/profile/Profile";
import { AdminDashboard } from "./app/dashboard/AdminDashboard";
import MaterialManagement from "./app/admin/MaterialManagement";
import StudentManagement from "./app/admin/StudentManagement";
import ExamQuestionManagement from "./app/admin/ExamQuestionManagement";
import ExamQuestionForm from "./app/admin/ExamQuestionForm";
import ExamManagement from "./app/admin/ExamManagement";
import ExamSettings from "./app/admin/ExamSettings";
import NotificationManagement from "./app/admin/NotificationManagement";
import ExamRoom from "./app/student/ExamRoom";
import ExamTaking from "./app/student/ExamTaking";
import ExamResults from "./app/student/ExamResults";
import ExamReview from "./app/student/ExamReview";
import Help from "./app/help/Help";
import { StudentLayout } from "./components/layout/StudentLayout";
import { AdminRoute, StudentRoute } from "./components/auth/ProtectedRoute";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route
            path="/"
            element={
              <StudentRoute>
                <StudentLayout>
                  <HomePage />
                </StudentLayout>
              </StudentRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/courses"
            element={
              <StudentRoute>
                <StudentLayout>
                  <CourseSelection />
                </StudentLayout>
              </StudentRoute>
            }
          />
          <Route
            path="/course/:courseId/learning"
            element={
              <StudentRoute>
                <StudentLayout>
                  <CourseLearning />
                </StudentLayout>
              </StudentRoute>
            }
          />
          <Route
            path="/payment"
            element={
              <StudentRoute>
                <StudentLayout>
                  <Payment />
                </StudentLayout>
              </StudentRoute>
            }
          />
          <Route
            path="/payment-success"
            element={
              <StudentRoute>
                <StudentLayout>
                  <PaymentSuccess />
                </StudentLayout>
              </StudentRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/material-upload"
            element={
              <AdminRoute>
                <MaterialManagement />
              </AdminRoute>
            }
          />
          <Route
            path="/student-management"
            element={
              <AdminRoute>
                <StudentManagement />
              </AdminRoute>
            }
          />

          {/* Exam Question Management Routes */}
          <Route
            path="/admin/question-management"
            element={
              <AdminRoute>
                <ExamQuestionManagement />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/question-management/create"
            element={
              <AdminRoute>
                <ExamQuestionForm />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/question-management/:id/edit"
            element={
              <AdminRoute>
                <ExamQuestionForm />
              </AdminRoute>
            }
          />

          {/* Exam Management Routes */}
          <Route
            path="/admin/exam-management"
            element={
              <AdminRoute>
                <ExamManagement />
              </AdminRoute>
            }
          />

          {/* Exam Settings Routes */}
          <Route
            path="/admin/exam-settings"
            element={
              <AdminRoute>
                <ExamSettings />
              </AdminRoute>
            }
          />

          {/* Notification Management Routes */}
          <Route
            path="/admin/notifications"
            element={
              <AdminRoute>
                <NotificationManagement />
              </AdminRoute>
            }
          />

          {/* Student Exam Routes */}
          <Route
            path="/exam-room"
            element={
              <StudentRoute>
                <StudentLayout>
                  <ExamRoom />
                </StudentLayout>
              </StudentRoute>
            }
          />
          <Route
            path="/exam-taking"
            element={
              <StudentRoute>
                <StudentLayout>
                  <ExamTaking />
                </StudentLayout>
              </StudentRoute>
            }
          />
          <Route
            path="/exam-results"
            element={
              <StudentRoute>
                <StudentLayout>
                  <ExamResults />
                </StudentLayout>
              </StudentRoute>
            }
          />
          <Route
            path="/exam-review"
            element={
              <StudentRoute>
                <StudentLayout>
                  <ExamReview />
                </StudentLayout>
              </StudentRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <StudentRoute>
                <StudentLayout>
                  <ProfileManagement />
                </StudentLayout>
              </StudentRoute>
            }
          />
          <Route
            path="/help"
            element={
              <StudentRoute>
                <StudentLayout>
                  <Help />
                </StudentLayout>
              </StudentRoute>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
