// server/controllers/catalogController.js

const SchoolCatalog = require('../models/SchoolCatalog');
const School = require('../models/School');

// Helper: normalize user.school to an id string whether it's populated (document) or ObjectId/string
const getUserSchoolId = (user) => {
  if (!user) return undefined;
  const s = user.school;
  if (!s) return undefined;
  if (typeof s === 'string') return s;
  if (typeof s === 'object' && s !== null) {
    if (s._id) return s._id.toString();
  }
  try {
    return s.toString();
  } catch (e) {
    return undefined;
  }
};

// @desc    Get school catalog
// @route   GET /api/catalog/:schoolId
// @access  Private/Manager
const getSchoolCatalog = async (req, res) => {
  try {
  const { schoolId } = req.params;
    
  // Verify the user has access to this school
  const userSchoolId = getUserSchoolId(req.user);
    if ((req.user.role === 'manager' || req.user.role === 'teacher') && userSchoolId !== schoolId) {
      return res.status(403).json({ message: 'Access denied. You can only view your own school catalog.' });
    }

    let catalog = await SchoolCatalog.findOne({ schoolId }).populate('schoolId', 'name');
    
    if (!catalog) {
      // Create empty catalog if it doesn't exist
      catalog = await SchoolCatalog.create({
        schoolId,
        supportLessons: [],
        reviewCourses: [],
        vocationalTrainings: [],
        languages: [],
        otherActivities: []
      });
    }

    res.json(catalog);
  } catch (error) {
    console.error('Error fetching school catalog:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update school catalog
// @route   PUT /api/catalog/:schoolId
// @access  Private/Manager
const updateSchoolCatalog = async (req, res) => {
  try {
  const { schoolId } = req.params;
    const updateData = req.body;
    
    // Verify the user has access to this school
  if (req.user.role === 'manager' && getUserSchoolId(req.user) !== schoolId) {
      return res.status(403).json({ message: 'Access denied. You can only manage your own school catalog.' });
    }

    let catalog = await SchoolCatalog.findOne({ schoolId });
    
    if (!catalog) {
      catalog = new SchoolCatalog({ schoolId });
    }

    // Update only the fields that are provided
    if (updateData.supportLessons !== undefined) {
      catalog.supportLessons = updateData.supportLessons;
    }
    if (updateData.reviewCourses !== undefined) {
      catalog.reviewCourses = updateData.reviewCourses;
    }
    if (updateData.vocationalTrainings !== undefined) {
      catalog.vocationalTrainings = updateData.vocationalTrainings;
    }
    if (updateData.languages !== undefined) {
      catalog.languages = updateData.languages;
    }
    if (updateData.otherActivities !== undefined) {
      catalog.otherActivities = updateData.otherActivities;
    }

    const updatedCatalog = await catalog.save();
    res.json(updatedCatalog);
  } catch (error) {
    console.error('Error updating school catalog:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation Error', error: error.message });
    }
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Add support lesson
// @route   POST /api/catalog/:schoolId/support-lessons
// @access  Private/Manager
const addSupportLesson = async (req, res) => {
  try {
  const { schoolId } = req.params;
    const lessonData = req.body;
    
    // Verify the user has access to this school
  if (req.user.role === 'manager' && getUserSchoolId(req.user) !== schoolId) {
      return res.status(403).json({ message: 'Access denied. You can only manage your own school catalog.' });
    }

    let catalog = await SchoolCatalog.findOne({ schoolId });
    
    if (!catalog) {
      catalog = new SchoolCatalog({ schoolId });
    }

    catalog.supportLessons.push(lessonData);
    const updatedCatalog = await catalog.save();
    
    res.status(201).json(updatedCatalog);
  } catch (error) {
    console.error('Error adding support lesson:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation Error', error: error.message });
    }
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update support lesson
// @route   PUT /api/catalog/:schoolId/support-lessons/:lessonId
// @access  Private/Manager
const updateSupportLesson = async (req, res) => {
  try {
  const { schoolId, lessonId } = req.params;
    const lessonData = req.body;
    
    // Verify the user has access to this school
  if (req.user.role === 'manager' && getUserSchoolId(req.user) !== schoolId) {
      return res.status(403).json({ message: 'Access denied. You can only manage your own school catalog.' });
    }

    const catalog = await SchoolCatalog.findOne({ schoolId });
    
    if (!catalog) {
      return res.status(404).json({ message: 'School catalog not found.' });
    }

    const lessonIndex = catalog.supportLessons.findIndex(lesson => lesson._id.toString() === lessonId);
    
    if (lessonIndex === -1) {
      return res.status(404).json({ message: 'Support lesson not found.' });
    }

    catalog.supportLessons[lessonIndex] = { ...catalog.supportLessons[lessonIndex].toObject(), ...lessonData };
    const updatedCatalog = await catalog.save();
    
    res.json(updatedCatalog);
  } catch (error) {
    console.error('Error updating support lesson:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation Error', error: error.message });
    }
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete support lesson
// @route   DELETE /api/catalog/:schoolId/support-lessons/:lessonId
// @access  Private/Manager
const deleteSupportLesson = async (req, res) => {
  try {
  const { schoolId, lessonId } = req.params;
    
    // Verify the user has access to this school
  if (req.user.role === 'manager' && getUserSchoolId(req.user) !== schoolId) {
      return res.status(403).json({ message: 'Access denied. You can only manage your own school catalog.' });
    }

    const catalog = await SchoolCatalog.findOne({ schoolId });
    
    if (!catalog) {
      return res.status(404).json({ message: 'School catalog not found.' });
    }

    catalog.supportLessons = catalog.supportLessons.filter(lesson => lesson._id.toString() !== lessonId);
    const updatedCatalog = await catalog.save();
    
    res.json(updatedCatalog);
  } catch (error) {
    console.error('Error deleting support lesson:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Add review course
// @route   POST /api/catalog/:schoolId/review-courses
// @access  Private/Manager
const addReviewCourse = async (req, res) => {
  try {
  const { schoolId } = req.params;
    const courseData = req.body;
    
    // Verify the user has access to this school
  if (req.user.role === 'manager' && getUserSchoolId(req.user) !== schoolId) {
      return res.status(403).json({ message: 'Access denied. You can only manage your own school catalog.' });
    }

    let catalog = await SchoolCatalog.findOne({ schoolId });
    
    if (!catalog) {
      catalog = new SchoolCatalog({ schoolId });
    }

    catalog.reviewCourses.push(courseData);
    const updatedCatalog = await catalog.save();
    
    res.status(201).json(updatedCatalog);
  } catch (error) {
    console.error('Error adding review course:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation Error', error: error.message });
    }
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update review course
// @route   PUT /api/catalog/:schoolId/review-courses/:courseId
// @access  Private/Manager
const updateReviewCourse = async (req, res) => {
  try {
  const { schoolId, courseId } = req.params;
    const courseData = req.body;
    
    // Verify the user has access to this school
  if (req.user.role === 'manager' && getUserSchoolId(req.user) !== schoolId) {
      return res.status(403).json({ message: 'Access denied. You can only manage your own school catalog.' });
    }

    const catalog = await SchoolCatalog.findOne({ schoolId });
    
    if (!catalog) {
      return res.status(404).json({ message: 'School catalog not found.' });
    }

    const courseIndex = catalog.reviewCourses.findIndex(course => course._id.toString() === courseId);
    
    if (courseIndex === -1) {
      return res.status(404).json({ message: 'Review course not found.' });
    }

    catalog.reviewCourses[courseIndex] = { ...catalog.reviewCourses[courseIndex].toObject(), ...courseData };
    const updatedCatalog = await catalog.save();
    
    res.json(updatedCatalog);
  } catch (error) {
    console.error('Error updating review course:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation Error', error: error.message });
    }
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete review course
// @route   DELETE /api/catalog/:schoolId/review-courses/:courseId
// @access  Private/Manager
const deleteReviewCourse = async (req, res) => {
  try {
  const { schoolId, courseId } = req.params;
    
    // Verify the user has access to this school
  if (req.user.role === 'manager' && getUserSchoolId(req.user) !== schoolId) {
      return res.status(403).json({ message: 'Access denied. You can only manage your own school catalog.' });
    }

    const catalog = await SchoolCatalog.findOne({ schoolId });
    
    if (!catalog) {
      return res.status(404).json({ message: 'School catalog not found.' });
    }

    catalog.reviewCourses = catalog.reviewCourses.filter(course => course._id.toString() !== courseId);
    const updatedCatalog = await catalog.save();
    
    res.json(updatedCatalog);
  } catch (error) {
    console.error('Error deleting review course:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Add vocational training
// @route   POST /api/catalog/:schoolId/vocational-trainings
// @access  Private/Manager
const addVocationalTraining = async (req, res) => {
  try {
  const { schoolId } = req.params;
    const trainingData = req.body;
    
    // Verify the user has access to this school
  if (req.user.role === 'manager' && getUserSchoolId(req.user) !== schoolId) {
      return res.status(403).json({ message: 'Access denied. You can only manage your own school catalog.' });
    }

    let catalog = await SchoolCatalog.findOne({ schoolId });
    
    if (!catalog) {
      catalog = new SchoolCatalog({ schoolId });
    }

    catalog.vocationalTrainings.push(trainingData);
    const updatedCatalog = await catalog.save();
    
    res.status(201).json(updatedCatalog);
  } catch (error) {
    console.error('Error adding vocational training:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation Error', error: error.message });
    }
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update vocational training
// @route   PUT /api/catalog/:schoolId/vocational-trainings/:trainingId
// @access  Private/Manager
const updateVocationalTraining = async (req, res) => {
  try {
  const { schoolId, trainingId } = req.params;
    const trainingData = req.body;
    
    // Verify the user has access to this school
  if (req.user.role === 'manager' && getUserSchoolId(req.user) !== schoolId) {
      return res.status(403).json({ message: 'Access denied. You can only manage your own school catalog.' });
    }

    const catalog = await SchoolCatalog.findOne({ schoolId });
    
    if (!catalog) {
      return res.status(404).json({ message: 'School catalog not found.' });
    }

    const trainingIndex = catalog.vocationalTrainings.findIndex(training => training._id.toString() === trainingId);
    
    if (trainingIndex === -1) {
      return res.status(404).json({ message: 'Vocational training not found.' });
    }

    catalog.vocationalTrainings[trainingIndex] = { ...catalog.vocationalTrainings[trainingIndex].toObject(), ...trainingData };
    const updatedCatalog = await catalog.save();
    
    res.json(updatedCatalog);
  } catch (error) {
    console.error('Error updating vocational training:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation Error', error: error.message });
    }
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete vocational training
// @route   DELETE /api/catalog/:schoolId/vocational-trainings/:trainingId
// @access  Private/Manager
const deleteVocationalTraining = async (req, res) => {
  try {
  const { schoolId, trainingId } = req.params;
    
    // Verify the user has access to this school
  if (req.user.role === 'manager' && getUserSchoolId(req.user) !== schoolId) {
      return res.status(403).json({ message: 'Access denied. You can only manage your own school catalog.' });
    }

    const catalog = await SchoolCatalog.findOne({ schoolId });
    
    if (!catalog) {
      return res.status(404).json({ message: 'School catalog not found.' });
    }

    catalog.vocationalTrainings = catalog.vocationalTrainings.filter(training => training._id.toString() !== trainingId);
    const updatedCatalog = await catalog.save();
    
    res.json(updatedCatalog);
  } catch (error) {
    console.error('Error deleting vocational training:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Add language
// @route   POST /api/catalog/:schoolId/languages
// @access  Private/Manager
const addLanguage = async (req, res) => {
  try {
  const { schoolId } = req.params;
    const languageData = req.body;
    
    // Verify the user has access to this school
  if (req.user.role === 'manager' && getUserSchoolId(req.user) !== schoolId) {
      return res.status(403).json({ message: 'Access denied. You can only manage your own school catalog.' });
    }

    let catalog = await SchoolCatalog.findOne({ schoolId });
    
    if (!catalog) {
      catalog = new SchoolCatalog({ schoolId });
    }

    catalog.languages.push(languageData);
    const updatedCatalog = await catalog.save();
    
    res.status(201).json(updatedCatalog);
  } catch (error) {
    console.error('Error adding language:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation Error', error: error.message });
    }
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update language
// @route   PUT /api/catalog/:schoolId/languages/:languageId
// @access  Private/Manager
const updateLanguage = async (req, res) => {
  try {
  const { schoolId, languageId } = req.params;
    const languageData = req.body;
    
    // Verify the user has access to this school
  if (req.user.role === 'manager' && getUserSchoolId(req.user) !== schoolId) {
      return res.status(403).json({ message: 'Access denied. You can only manage your own school catalog.' });
    }

    const catalog = await SchoolCatalog.findOne({ schoolId });
    
    if (!catalog) {
      return res.status(404).json({ message: 'School catalog not found.' });
    }

    const languageIndex = catalog.languages.findIndex(language => language._id.toString() === languageId);
    
    if (languageIndex === -1) {
      return res.status(404).json({ message: 'Language not found.' });
    }

    catalog.languages[languageIndex] = { ...catalog.languages[languageIndex].toObject(), ...languageData };
    const updatedCatalog = await catalog.save();
    
    res.json(updatedCatalog);
  } catch (error) {
    console.error('Error updating language:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation Error', error: error.message });
    }
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete language
// @route   DELETE /api/catalog/:schoolId/languages/:languageId
// @access  Private/Manager
const deleteLanguage = async (req, res) => {
  try {
  const { schoolId, languageId } = req.params;
    
    // Verify the user has access to this school
  if (req.user.role === 'manager' && getUserSchoolId(req.user) !== schoolId) {
      return res.status(403).json({ message: 'Access denied. You can only manage your own school catalog.' });
    }

    const catalog = await SchoolCatalog.findOne({ schoolId });
    
    if (!catalog) {
      return res.status(404).json({ message: 'School catalog not found.' });
    }

    catalog.languages = catalog.languages.filter(language => language._id.toString() !== languageId);
    const updatedCatalog = await catalog.save();
    
    res.json(updatedCatalog);
  } catch (error) {
    console.error('Error deleting language:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Add other activity
// @route   POST /api/catalog/:schoolId/other-activities
// @access  Private/Manager
const addOtherActivity = async (req, res) => {
  try {
  const { schoolId } = req.params;
    const activityData = req.body;
    
    // Verify the user has access to this school
  if (req.user.role === 'manager' && getUserSchoolId(req.user) !== schoolId) {
      return res.status(403).json({ message: 'Access denied. You can only manage your own school catalog.' });
    }

    let catalog = await SchoolCatalog.findOne({ schoolId });
    
    if (!catalog) {
      catalog = new SchoolCatalog({ schoolId });
    }

    catalog.otherActivities.push(activityData);
    const updatedCatalog = await catalog.save();
    
    res.status(201).json(updatedCatalog);
  } catch (error) {
    console.error('Error adding other activity:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation Error', error: error.message });
    }
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update other activity
// @route   PUT /api/catalog/:schoolId/other-activities/:activityId
// @access  Private/Manager
const updateOtherActivity = async (req, res) => {
  try {
  const { schoolId, activityId } = req.params;
    const activityData = req.body;
    
    // Verify the user has access to this school
  if (req.user.role === 'manager' && getUserSchoolId(req.user) !== schoolId) {
      return res.status(403).json({ message: 'Access denied. You can only manage your own school catalog.' });
    }

    const catalog = await SchoolCatalog.findOne({ schoolId });
    
    if (!catalog) {
      return res.status(404).json({ message: 'School catalog not found.' });
    }

    const activityIndex = catalog.otherActivities.findIndex(activity => activity._id.toString() === activityId);
    
    if (activityIndex === -1) {
      return res.status(404).json({ message: 'Other activity not found.' });
    }

    catalog.otherActivities[activityIndex] = { ...catalog.otherActivities[activityIndex].toObject(), ...activityData };
    const updatedCatalog = await catalog.save();
    
    res.json(updatedCatalog);
  } catch (error) {
    console.error('Error updating other activity:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Validation Error', error: error.message });
    }
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Delete other activity
// @route   DELETE /api/catalog/:schoolId/other-activities/:activityId
// @access  Private/Manager
const deleteOtherActivity = async (req, res) => {
  try {
  const { schoolId, activityId } = req.params;
    
    // Verify the user has access to this school
  if (req.user.role === 'manager' && getUserSchoolId(req.user) !== schoolId) {
      return res.status(403).json({ message: 'Access denied. You can only manage your own school catalog.' });
    }

    const catalog = await SchoolCatalog.findOne({ schoolId });
    
    if (!catalog) {
      return res.status(404).json({ message: 'School catalog not found.' });
    }

    catalog.otherActivities = catalog.otherActivities.filter(activity => activity._id.toString() !== activityId);
    const updatedCatalog = await catalog.save();
    
    res.json(updatedCatalog);
  } catch (error) {
    console.error('Error deleting other activity:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  getSchoolCatalog,
  updateSchoolCatalog,
  addSupportLesson,
  updateSupportLesson,
  deleteSupportLesson,
  addReviewCourse,
  updateReviewCourse,
  deleteReviewCourse,
  addVocationalTraining,
  updateVocationalTraining,
  deleteVocationalTraining,
  addLanguage,
  updateLanguage,
  deleteLanguage,
  addOtherActivity,
  updateOtherActivity,
  deleteOtherActivity
};
