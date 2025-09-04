const asyncHandler = require('express-async-handler');
const Advertisement = require('../models/Advertisement');

// @desc    Create a new advertisement
// @route   POST /api/advertisements
// @access  Private (Manager)
const createAdvertisement = asyncHandler(async (req, res) => {
  const { title, description, dateTime, targetAudience, location } = req.body;
  const { _id: managerId, school: schoolId } = req.user;

  if (!schoolId) {
    res.status(400);
    throw new Error('Manager must be assigned to a school to create advertisements');
  }

  if (!title || !description || !dateTime || !targetAudience || !location) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  const advertisement = await Advertisement.create({
    schoolId,
    title,
    description,
    dateTime: new Date(dateTime),
    targetAudience,
    location
  });

  if (advertisement) {
    res.status(201).json(advertisement);
  } else {
    res.status(400);
    throw new Error('Invalid advertisement data');
  }
});

// @desc    Get all advertisements for a school
// @route   GET /api/advertisements
// @access  Private (Manager)
const getAdvertisements = asyncHandler(async (req, res) => {
  const { school: schoolId } = req.user;

  if (!schoolId) {
    res.status(400);
    throw new Error('Manager must be assigned to a school to access advertisements');
  }

  const advertisements = await Advertisement.find({ schoolId })
    .sort({ createdAt: -1 });

  res.json(advertisements);
});

// @desc    Update an advertisement
// @route   PUT /api/advertisements/:id
// @access  Private (Manager)
const updateAdvertisement = asyncHandler(async (req, res) => {
  const { title, description, dateTime, targetAudience, location } = req.body;
  const { school: schoolId } = req.user;

  if (!schoolId) {
    res.status(400);
    throw new Error('Manager must be assigned to a school to update advertisements');
  }

  const advertisement = await Advertisement.findById(req.params.id);

  if (!advertisement) {
    res.status(404);
    throw new Error('Advertisement not found');
  }

  // Verify the advertisement belongs to the manager's school
  if (advertisement.schoolId.toString() !== schoolId.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this advertisement');
  }

  advertisement.title = title || advertisement.title;
  advertisement.description = description || advertisement.description;
  advertisement.dateTime = dateTime ? new Date(dateTime) : advertisement.dateTime;
  advertisement.targetAudience = targetAudience || advertisement.targetAudience;
  advertisement.location = location || advertisement.location;

  const updatedAdvertisement = await advertisement.save();

  res.json(updatedAdvertisement);
});

// @desc    Delete an advertisement
// @route   DELETE /api/advertisements/:id
// @access  Private (Manager)
const deleteAdvertisement = asyncHandler(async (req, res) => {
  const { school: schoolId } = req.user;

  if (!schoolId) {
    res.status(400);
    throw new Error('Manager must be assigned to a school to delete advertisements');
  }

  const advertisement = await Advertisement.findById(req.params.id);

  if (!advertisement) {
    res.status(404);
    throw new Error('Advertisement not found');
  }

  // Verify the advertisement belongs to the manager's school
  if (advertisement.schoolId.toString() !== schoolId.toString()) {
    res.status(403);
    throw new Error('Not authorized to delete this advertisement');
  }

  await advertisement.deleteOne();

  res.json({ message: 'Advertisement removed' });
});

// @desc    Get advertisements for a specific user role
// @route   GET /api/advertisements/user/:role
// @access  Private
const getAdvertisementsForUser = asyncHandler(async (req, res) => {
  const { role } = req.params;
  const { school: schoolId } = req.user;

  if (!schoolId) {
    res.status(400);
    throw new Error('User must be assigned to a school to access advertisements');
  }

  // Get current date for filtering active advertisements
  const now = new Date();

  const advertisements = await Advertisement.find({
    schoolId,
    dateTime: { $lte: now }, // Only show ads that have reached their scheduled time
    $or: [
      { targetAudience: 'both' },
      { targetAudience: role },
      { targetAudience: 'custom' } // Could add more logic here for custom targeting
    ]
  })
    .sort({ dateTime: -1 })
    .limit(10); // Limit to 10 most recent ads

  res.json(advertisements);
});

module.exports = {
  createAdvertisement,
  getAdvertisements,
  updateAdvertisement,
  deleteAdvertisement,
  getAdvertisementsForUser
};
