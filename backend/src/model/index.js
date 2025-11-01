// Lazy load models to prevent automatic collection creation at startup
// Only User model is loaded immediately since it's needed for authentication
const User = require("./User");

// Other models are loaded on-demand
const getProfile = () => require("./Profile");
const getCourse = () => require("./Course");
const getMaterial = () => require("./Material");
const getExamAttempt = () => require("./ExamAttempt");

module.exports = {
  User,
  get Profile() {
    return getProfile();
  },
  get Course() {
    return getCourse();
  },
  get Material() {
    return getMaterial();
  },
  get ExamAttempt() {
    return getExamAttempt();
  },
};
