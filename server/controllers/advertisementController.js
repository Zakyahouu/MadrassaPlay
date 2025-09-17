const asyncHandler = require('express-async-handler');
const Advertisement = require('../models/Advertisement');
const path = require('path');
const LoggingService = require('../services/loggingService');

// @desc    Create a new advertisement
// @route   POST /api/advertisements
// @access  Private (Manager)
const createAdvertisement = asyncHandler(async (req, res) => {
  const { title, description, startDate, endDate, targetAudience, location, dateTime } = req.body;
  const schoolId = req.user?.school?._id || req.user?.school;
  console.log('[ads] createAdvertisement request', {
    userId: req.user?._id?.toString?.(),
    schoolId: schoolId?.toString?.(),
    title,
    targetAudience,
    location,
    dateTime
  });

  if (!schoolId) {
    res.status(400);
    throw new Error('Manager must be assigned to a school to create advertisements');
  }

  if (!title || !description || !startDate || !endDate || !targetAudience || !location) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  // Validate dates
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);
  const dateTimeObj = new Date(dateTime || startDate); // Use dateTime if provided, otherwise use startDate

  if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime()) || isNaN(dateTimeObj.getTime())) {
    res.status(400);
    throw new Error('Invalid date format');
  }

  if (startDateObj >= endDateObj) {
    res.status(400);
    throw new Error('Start date must be before end date');
  }

  const advertisement = await Advertisement.create({
    schoolId,
    title,
    description,
    startDate: startDateObj,
    endDate: endDateObj,
    dateTime: dateTimeObj,
    targetAudience,
    location,
    bannerImageUrl: null
  });

  if (advertisement) {
    console.log('[ads] createAdvertisement saved', {
      adId: advertisement._id?.toString?.(),
      schoolId: advertisement.schoolId?.toString?.()
    });

    // Log the advertisement creation activity
    await LoggingService.logManagerActivity(req, 'manager_advertisement_create', 
      `Created advertisement: ${advertisement.title}`, 
      { advertisementId: advertisement._id, title: advertisement.title, targetAudience: advertisement.targetAudience },
      { entityType: 'advertisement', entityId: advertisement._id }
    );

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
  const schoolId = req.user?.school?._id || req.user?.school;
  console.log('[ads] getAdvertisements (manager list)', {
    userId: req.user?._id?.toString?.(),
    schoolId: schoolId?.toString?.()
  });

  if (!schoolId) {
    res.status(400);
    throw new Error('Manager must be assigned to a school to access advertisements');
  }

  const advertisements = await Advertisement.find({ schoolId })
    .sort({ createdAt: -1 });
  console.log('[ads] getAdvertisements found', advertisements.length);
  res.json(advertisements);
});

// @desc    Update an advertisement
// @route   PUT /api/advertisements/:id
// @access  Private (Manager)
const updateAdvertisement = asyncHandler(async (req, res) => {
  const { title, description, startDate, endDate, targetAudience, location } = req.body;
  const schoolId = req.user?.school?._id || req.user?.school;

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
  advertisement.startDate = startDate ? new Date(startDate) : advertisement.startDate;
  advertisement.endDate = endDate ? new Date(endDate) : advertisement.endDate;
  advertisement.targetAudience = targetAudience || advertisement.targetAudience;
  advertisement.location = location || advertisement.location;

  const updatedAdvertisement = await advertisement.save();

  res.json(updatedAdvertisement);
});

// @desc    Upload or replace banner image for an advertisement
// @route   POST /api/advertisements/:id/banner
// @access  Private (Manager)
const uploadAdvertisementBanner = asyncHandler(async (req, res) => {
  const schoolId = req.user?.school?._id || req.user?.school;

  const advertisement = await Advertisement.findById(req.params.id);
  if (!advertisement) {
    res.status(404);
    throw new Error('Advertisement not found');
  }
  if (advertisement.schoolId.toString() !== schoolId.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this advertisement');
  }

  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }

  // File saved under server/public/uploads/ads/<filename>
  const publicPath = `/uploads/ads/${req.file.filename}`;
  console.log('[ads] uploadAdvertisementBanner', {
    adId: advertisement._id?.toString?.(),
    schoolId: schoolId?.toString?.(),
    file: {
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size
    },
    bannerImageUrl: publicPath
  });
  advertisement.bannerImageUrl = publicPath;
  await advertisement.save();
  res.json({ success: true, bannerImageUrl: publicPath });
});

// @desc    Delete an advertisement
// @route   DELETE /api/advertisements/:id
// @access  Private (Manager)
const deleteAdvertisement = asyncHandler(async (req, res) => {
  const schoolId = req.user?.school?._id || req.user?.school;

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
  const schoolId = req.user?.school?._id || req.user?.school;

  if (!schoolId) {
    res.status(400);
    throw new Error('User must be assigned to a school to access advertisements');
  }

  // Get current date for filtering active advertisements
  const now = new Date();

  // Find advertisements that are currently active (within date range)
  const advertisements = await Advertisement.find({
    schoolId,
    $and: [
      {
        $or: [
          { targetAudience: 'both' },
          { targetAudience: role },
          { targetAudience: 'custom' }
        ]
      },
      {
        $or: [
          // Regular ads: must be within date range and active
          {
            $and: [
              { startDate: { $lte: now } },
              { endDate: { $gte: now } },
              { status: 'active' }
            ]
          },
          // Banner ads: always show if active (regardless of date)
          {
            $and: [
              { location: 'banner' },
              { status: 'active' }
            ]
          }
        ]
      }
    ]
  })
    .sort({ dateTime: -1 })
    .limit(10); // Limit to 10 most recent ads

  console.log('[ads] getAdvertisementsForUser', {
    role,
    schoolId: schoolId?.toString?.(),
    now: now.toISOString(),
    foundAds: advertisements.length,
    ads: advertisements.map(ad => ({
      id: ad._id?.toString?.(),
      title: ad.title,
      targetAudience: ad.targetAudience,
      location: ad.location,
      status: ad.status,
      startDate: ad.startDate?.toISOString?.(),
      endDate: ad.endDate?.toISOString?.(),
      dateTime: ad.dateTime?.toISOString?.()
    }))
  });

  res.json(advertisements);
});

module.exports = {
  createAdvertisement,
  getAdvertisements,
  updateAdvertisement,
  deleteAdvertisement,
  getAdvertisementsForUser,
  uploadAdvertisementBanner
};
