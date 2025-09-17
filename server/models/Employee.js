// server/models/Employee.js

const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    schoolId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'School', 
      required: true 
    },
    name: { 
      type: String, 
      required: true, 
      trim: true 
    },
    role: { 
      type: String, 
      required: true, 
      trim: true 
    },
    employeeType: {
      type: String,
      enum: ['staff', 'other'],
      required: true,
      default: 'other'
    },
    salaryType: { 
      type: String, 
      enum: ['fixed', 'hourly'], 
      required: true 
    },
    salaryValue: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    hireDate: { 
      type: Date, 
      required: true 
    },
    status: { 
      type: String, 
      enum: ['active', 'inactive'], 
      default: 'active' 
    },
    phone: { 
      type: String, 
      trim: true 
    },
    email: { 
      type: String, 
      trim: true, 
      lowercase: true 
    },
    address: { 
      type: String, 
      trim: true 
    },
    notes: { 
      type: String, 
      trim: true 
    },
    // Platform access fields (only for staff)
    username: {
      type: String,
      trim: true,
      sparse: true, // Allows multiple null values
      unique: true
    },
    password: {
      type: String,
      trim: true
    },
    // Permissions for platform access (only for staff)
    permissions: {
      finance: {
        type: Boolean,
        default: false
      },
      logs: {
        type: Boolean,
        default: false
      }
    },
    // Link to User record for staff employees
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    }
  },
  { 
    timestamps: true 
  }
);

// Indexes for efficient queries
employeeSchema.index({ schoolId: 1, status: 1 });
employeeSchema.index({ schoolId: 1, role: 1 });
employeeSchema.index({ schoolId: 1, name: 1 });

// Virtual for full name display
employeeSchema.virtual('displayName').get(function() {
  return this.name;
});

// Method to calculate monthly salary
employeeSchema.methods.calculateMonthlySalary = function(year, month) {
  if (this.salaryType === 'fixed') {
    return this.salaryValue;
  } else if (this.salaryType === 'hourly') {
    // For hourly employees, we'll need to track hours worked
    // For now, return 0 and handle in the controller
    return 0;
  }
  return 0;
};

// Method to check if employee is active
employeeSchema.methods.isActive = function() {
  return this.status === 'active';
};

// Static method to get employees by school
employeeSchema.statics.getBySchool = function(schoolId) {
  return this.find({ schoolId: new mongoose.Types.ObjectId(schoolId) })
    .sort({ name: 1 })
    .lean(); // Use lean() for better performance
};

// Static method to get active employees
employeeSchema.statics.getActiveBySchool = function(schoolId) {
  return this.find({ 
    schoolId: new mongoose.Types.ObjectId(schoolId),
    status: 'active' 
  }).sort({ name: 1 });
};

module.exports = mongoose.model('Employee', employeeSchema);
