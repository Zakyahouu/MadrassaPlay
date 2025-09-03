// server/models/SchoolCatalog.js

const mongoose = require('mongoose');

// Custom validator for high school streams
const validateHighSchoolStreams = function(lessons) {
  for (let lesson of lessons) {
    if (lesson.level === 'high_school') {
      if (lesson.grade === 1) {
        // Grade 1: ONLY common core allowed
        const allowedStreams = ['common core science and technology', 'common core literature and languages'];
        if (!allowedStreams.includes(lesson.stream)) {
          return false;
        }
      } else if (lesson.grade === 2 || lesson.grade === 3) {
        // Grades 2&3: MUST be one specific stream
        const allowedStreams = [
          'experimental sciences', 'technical math', 'mathematics',
          'management & economics', 'foreign languages', 'literature & philosophy'
        ];
        if (!allowedStreams.includes(lesson.stream)) {
          return false;
        }
      }
    }
  }
  return true;
};

const lessonSchema = {
  level: {
    type: String,
    enum: ['primary', 'middle', 'high_school'],
    required: true,
  },
  grade: {
    type: Number,
    required: true,
    validate: {
      validator: function(grade) {
        if (this.level === 'primary') return grade >= 1 && grade <= 5;
        if (this.level === 'middle') return grade >= 1 && grade <= 4;
        if (this.level === 'high_school') return grade >= 1 && grade <= 3;
        return false;
      },
      message: 'Invalid grade for the selected level'
    },
  },
  stream: {
    type: String,
    required: function() {
      return this.level === 'high_school';
    },
    validate: {
      validator: function(stream) {
        if (this.level !== 'high_school') return true;
        
        if (this.grade === 1) {
          return ['common core science and technology', 'common core literature and languages'].includes(stream);
        } else if (this.grade === 2 || this.grade === 3) {
          return [
            'experimental sciences', 'technical math', 'mathematics',
            'management & economics', 'foreign languages', 'literature & philosophy'
          ].includes(stream);
        }
        return false;
      },
      message: 'Invalid stream for the selected grade level'
    },
  },
  subject: {
    type: String,
    required: true,
    trim: true,
  },
};

const schoolCatalogSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    unique: true,
  },
  
  supportLessons: {
    type: [lessonSchema],
    validate: {
      validator: validateHighSchoolStreams,
      message: 'Invalid high school stream configuration'
    },
  },
  
  reviewCourses: {
    type: [lessonSchema],
    validate: {
      validator: validateHighSchoolStreams,
      message: 'Invalid high school stream configuration'
    },
  },
  
  vocationalTrainings: [{
    field: {
      type: String,
      required: true,
      trim: true,
    },
    specialty: {
      type: String,
      required: true,
      trim: true,
    },
    certificateType: {
      type: String,
      required: true,
      trim: true,
    },
    gender: {
      type: String,
      enum: ['men', 'women', 'mixed'],
      required: true,
    },
    ageRange: {
      min: {
        type: Number,
        min: 0,
      },
      max: {
        type: Number,
        min: 0,
      },
    },
  }],
  
  languages: [{
    language: {
      type: String,
      required: true,
      trim: true,
    },
    levels: [{
      type: String,
      default: ['A0', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    }],
  }],
  
  otherActivities: [{
    activityType: {
      type: String,
      required: true,
      trim: true,
    },
    activityName: {
      type: String,
      required: true,
      trim: true,
    },
  }],
}, {
  timestamps: true,
});

// Unique index for schoolId is already declared on the field via `unique: true`.
// Avoid adding a duplicate single-field index.

module.exports = mongoose.model('SchoolCatalog', schoolCatalogSchema);
