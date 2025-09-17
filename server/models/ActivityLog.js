const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userRole: {
    type: String,
    required: true,
    enum: ['student', 'teacher', 'manager', 'staff', 'employee']
  },
  userName: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      // Authentication actions
      'login', 'logout', 'password_change', 'profile_update',
      
      // Student actions
      'student_enroll', 'student_unenroll', 'student_payment', 'student_debt_adjustment',
      'student_attendance_mark', 'student_attendance_undo', 'student_profile_update',
      
      // Teacher actions
      'teacher_class_create', 'teacher_class_update', 'teacher_class_delete',
      'teacher_attendance_mark', 'teacher_attendance_undo', 'teacher_payout_request',
      'teacher_profile_update', 'teacher_timetable_update',
      
      // Manager actions
      'manager_student_create', 'manager_student_update', 'manager_student_delete',
      'manager_teacher_create', 'manager_teacher_update', 'manager_teacher_delete',
      'manager_employee_create', 'manager_employee_update', 'manager_employee_delete',
      'manager_class_create', 'manager_class_update', 'manager_class_delete',
      'manager_payment_record', 'manager_salary_pay', 'manager_debt_adjust',
      'manager_attendance_override', 'manager_finance_export', 'manager_report_generate',
      'manager_system_settings', 'manager_advertisement_create', 'manager_advertisement_update',
      'manager_advertisement_delete',
      
      // Staff/Employee actions
      'staff_attendance_view', 'staff_payment_view', 'staff_profile_update',
      'employee_salary_view', 'employee_profile_update',
      
      // System actions
      'system_backup', 'system_restore', 'system_maintenance', 'system_error'
    ]
  },
  description: {
    type: String,
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  category: {
    type: String,
    required: true,
    enum: [
      'authentication', 'student_management', 'teacher_management', 'employee_management',
      'class_management', 'attendance', 'payments', 'finance', 'reports', 'system'
    ]
  },
  relatedEntity: {
    type: {
      entityType: {
        type: String,
        enum: ['student', 'teacher', 'employee', 'class', 'payment', 'enrollment', 'advertisement']
      },
      entityId: {
        type: mongoose.Schema.Types.ObjectId
      }
    },
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
activityLogSchema.index({ school: 1, timestamp: -1 });
activityLogSchema.index({ user: 1, timestamp: -1 });
activityLogSchema.index({ action: 1, timestamp: -1 });
activityLogSchema.index({ category: 1, timestamp: -1 });
activityLogSchema.index({ severity: 1, timestamp: -1 });
activityLogSchema.index({ 'relatedEntity.entityType': 1, 'relatedEntity.entityId': 1 });

// Virtual for formatted timestamp
activityLogSchema.virtual('formattedTimestamp').get(function() {
  return this.timestamp.toLocaleString();
});

// Method to get activity summary
activityLogSchema.methods.getSummary = function() {
  return {
    id: this._id,
    user: this.userName,
    role: this.userRole,
    action: this.action,
    description: this.description,
    timestamp: this.formattedTimestamp,
    severity: this.severity,
    category: this.category
  };
};

module.exports = mongoose.model('ActivityLog', activityLogSchema);
