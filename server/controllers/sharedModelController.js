// server/controllers/sharedModelController.js
const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const SharedModel = require('../models/SharedModel');
const GameCreation = require('../models/GameCreation');
const GameTemplate = require('../models/GameTemplate');
const User = require('../models/User');

// Helper function to generate share URL
const generateShareUrl = (authKey) => {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? (process.env.CORS_ORIGIN || 'http://72.60.133.119')
    : 'http://localhost:5173';
  return `${baseUrl}/shared/${authKey}`;
};

// Helper function to get model data
const getModelData = async (modelId, modelType) => {
  let model;
  switch (modelType) {
    case 'GameCreation':
      model = await GameCreation.findById(modelId).populate('template', 'name');
      break;
    case 'GameTemplate':
      model = await GameTemplate.findById(modelId);
      break;
    default:
      throw new Error('Unsupported model type');
  }
  
  if (!model) {
    throw new Error('Model not found');
  }
  
  return model;
};

// @desc    Generate a share link for a model
// @route   POST /api/shared/generate/:modelId
// @access  Private
const generateShareLink = asyncHandler(async (req, res) => {
  const { modelId } = req.params;
  const { modelType = 'GameCreation', expiresInDays, customTitle, customDescription } = req.body;
  
  // Verify the model exists and user has access
  const model = await getModelData(modelId, modelType);
  
  // Check if user owns the model or has permission to share it
  if (modelType === 'GameCreation' && model.owner.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to share this model');
  }
  
  if (modelType === 'GameTemplate' && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Only admins can share game templates');
  }
  
  // Check if there's already an active share for this model
  const existingShare = await SharedModel.findOne({
    modelId,
    modelType,
    sharedBy: req.user._id,
    isActive: true
  });
  
  if (existingShare) {
    // Update access count and return existing share
    existingShare.lastAccessedAt = new Date();
    await existingShare.save();
    
    return res.json({
      data: {
        ...existingShare.toObject(),
        shareUrl: generateShareUrl(existingShare.authKey)
      }
    });
  }
  
  // Generate unique auth key
  const authKey = crypto.randomBytes(32).toString('hex');
  
  // Calculate expiration date if provided
  let expiresAt = null;
  if (expiresInDays && expiresInDays > 0) {
    expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);
  }
  
  // Create share record
  const shareUrl = generateShareUrl(authKey);
  const sharedModel = await SharedModel.create({
    modelId,
    modelType,
    sharedBy: req.user._id,
    authKey,
    shareUrl,
    expiresAt,
    customTitle,
    customDescription
  });
  
  res.status(201).json({
    data: {
      ...sharedModel.toObject(),
      shareUrl: generateShareUrl(sharedModel.authKey)
    }
  });
});

// @desc    Disable a share link
// @route   POST /api/shared/disable/:modelId
// @access  Private
const disableShareLink = asyncHandler(async (req, res) => {
  const { modelId } = req.params;
  const { modelType = 'GameCreation' } = req.body;
  
  const sharedModel = await SharedModel.findOne({
    modelId,
    modelType,
    sharedBy: req.user._id,
    isActive: true
  });
  
  if (!sharedModel) {
    res.status(404);
    throw new Error('Active share link not found');
  }
  
  sharedModel.isActive = false;
  await sharedModel.save();
  
  res.json({
    data: {
      message: 'Share link disabled successfully',
      isActive: false
    }
  });
});

// @desc    Get share status for a model
// @route   GET /api/shared/status/:modelId
// @access  Private
const getShareStatus = asyncHandler(async (req, res) => {
  const { modelId } = req.params;
  const { modelType = 'GameCreation' } = req.query;
  
  const sharedModel = await SharedModel.findOne({
    modelId,
    modelType,
    sharedBy: req.user._id
  }).sort({ createdAt: -1 }); // Get the most recent share
  
  if (!sharedModel) {
    return res.json({
      data: {
        isShared: false,
        isActive: false,
        shareUrl: null
      }
    });
  }
  
  // Check if expired
  const isExpired = sharedModel.expiresAt && new Date(sharedModel.expiresAt) < new Date();
  
  res.json({
    data: {
      isShared: true,
      isActive: sharedModel.isActive && !isExpired,
      shareUrl: generateShareUrl(sharedModel.authKey),
      accessCount: sharedModel.accessCount,
      expiresAt: sharedModel.expiresAt,
      lastAccessedAt: sharedModel.lastAccessedAt,
      createdAt: sharedModel.createdAt
    }
  });
});

// @desc    View a shared model (public endpoint)
// @route   GET /api/shared/view/:authKey
// @access  Public
const viewSharedModel = asyncHandler(async (req, res) => {
  const { authKey } = req.params;
  
  const sharedModel = await SharedModel.findOne({ authKey })
    .populate('sharedBy', 'firstName lastName email')
    .populate('modelId');
  
  if (!sharedModel) {
    res.status(404);
    throw new Error('Share link not found');
  }
  
  // Check if share is active
  if (!sharedModel.isActive) {
    res.status(410);
    throw new Error('Share link has been disabled');
  }
  
  // Check if expired
  if (sharedModel.expiresAt && new Date(sharedModel.expiresAt) < new Date()) {
    res.status(410);
    throw new Error('Share link has expired');
  }
  
  // Update access tracking
  sharedModel.accessCount += 1;
  sharedModel.lastAccessedAt = new Date();
  await sharedModel.save();
  
  // Get the actual model data
  const model = await getModelData(sharedModel.modelId, sharedModel.modelType);
  
  // Prepare response data
  const responseData = {
    model: {
      _id: model._id,
      name: model.name || model.title,
      description: model.description || model.customDescription || sharedModel.customDescription,
      fileUrl: null, // Will be set based on model type
      uploadedBy: sharedModel.sharedBy,
      sharedAt: sharedModel.createdAt,
      accessCount: sharedModel.accessCount
    }
  };
  
  // Set file URL based on model type
  if (sharedModel.modelType === 'GameCreation') {
    // For game creations, we need to look for 3D model files in the content
    if (model.content && Array.isArray(model.content)) {
      // Look for 3D model files in the content
      for (const item of model.content) {
        if (item.modelFile || item.fileUrl) {
          const fileUrl = item.modelFile || item.fileUrl;
          if (fileUrl && (fileUrl.endsWith('.glb') || fileUrl.endsWith('.gltf'))) {
            // Convert relative URL to absolute URL
            const baseUrl = process.env.NODE_ENV === 'production' 
              ? (process.env.CORS_ORIGIN || 'http://72.60.133.119')
              : 'http://localhost:5000';
            responseData.model.fileUrl = fileUrl.startsWith('http') ? fileUrl : `${baseUrl}${fileUrl}`;
            break;
          }
        }
      }
    }
  } else if (sharedModel.modelType === 'GameTemplate') {
    // For game templates, look for 3D model files in the template
    if (model.manifest && model.manifest.assets) {
      // This would depend on how 3D models are stored in templates
      // For now, we'll leave it as null
    }
  }
  
  res.json({
    data: responseData
  });
});

// @desc    Get all shared models by user
// @route   GET /api/shared/my-shares
// @access  Private
const getUserSharedModels = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  
  const sharedModels = await SharedModel.find({ sharedBy: req.user._id })
    .populate('modelId', 'name title')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  
  const total = await SharedModel.countDocuments({ sharedBy: req.user._id });
  
  res.json({
    data: sharedModels.map(share => ({
      ...share.toObject(),
      shareUrl: generateShareUrl(share.authKey)
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

module.exports = {
  generateShareLink,
  disableShareLink,
  getShareStatus,
  viewSharedModel,
  getUserSharedModels
};
