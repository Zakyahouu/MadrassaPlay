# Professional Landing Page Builder - Implementation Specification

**Project**: MadrassaPlay - School Landing Page System  
**Date**: November 14, 2025  
**Status**: In Progress  

---

## 🎯 Project Overview

Create a professional, fully-customizable landing page system for online tutoring schools. Schools can showcase programs, teachers, testimonials, and convert visitors into leads through a visually-built, manager-controlled landing page.

---

## 📋 Implementation Checklist

### Phase 1: Backend Foundation
- [x] **1.1** Update School model with comprehensive landingPage.config schema
- [x] **1.2** Create ContactInquiry model for lead capture
- [x] **1.3** Create LandingPageAnalytics model for tracking metrics
- [x] **1.4** Add backend routes for config CRUD operations
- [x] **1.5** Add backend route for contact form submissions
- [x] **1.6** Add backend route for analytics event tracking
- [x] **1.7** Create default landing page template configuration
- [x] **1.8** Add migration/seed script to initialize default configs

### Phase 2: Public Landing Page Frontend
- [x] **2.1** Create professional Hero section component
- [x] **2.2** Create Programs/Courses showcase component
- [x] **2.3** Create Teacher profiles component
- [x] **2.4** Create Testimonials carousel component
- [x] **2.5** Create Features/Benefits component
- [x] **2.6** Create Pricing tiers component
- [x] **2.7** Create FAQ accordion component
- [x] **2.8** Create Contact form component
- [x] **2.9** Create Footer component
- [x] **2.10** Assemble PublicSchoolPage.jsx with all sections
- [x] **2.11** Implement theme system (CSS variables from config)
- [x] **2.12** Add smooth scroll navigation and animations
- [x] **2.13** Make fully responsive (mobile-first design)

### Phase 3: Manager Builder Interface
- [x] **3.1** Create LandingPageBuilder.jsx main component
- [x] **3.2** Implement tabbed navigation (Content/Media/Design/Analytics)
- [x] **3.3** Create Content tab - section enable/disable toggles
- [x] **3.4** Create Content tab - section reordering (drag-drop)
- [x] **3.5** Create ProgramCardEditor sub-component
- [x] **3.6** Create TeacherCardEditor sub-component
- [x] **3.7** Create TestimonialEditor sub-component
- [x] **3.8** Create FAQEditor sub-component
- [x] **3.9** Create HeroEditor for hero section customization
- [x] **3.10** Create Media tab - image upload and management
- [x] **3.11** Create Design tab - theme color pickers
- [x] **3.12** Create Design tab - font family selector
- [x] **3.13** Create Design tab - layout/spacing options
- [ ] **3.14** Implement live preview iframe
- [x] **3.15** Add Save Draft / Publish buttons
- [x] **3.16** Add Preview in New Tab button

### Phase 4: Analytics & Insights
- [x] **4.1** Implement page view tracking (public page)
- [x] **4.2** Implement CTA click tracking
- [x] **4.3** Implement contact form submission tracking
- [x] **4.4** Create AnalyticsDashboard.jsx component
- [x] **4.5** Add charts for daily/weekly/monthly metrics
- [x] **4.6** Display conversion rates and engagement metrics
- [x] **4.7** Create InquiriesManager.jsx for viewing leads

### Phase 5: Advanced Features
- [x] **5.1** Add SEO meta fields to config schema
- [x] **5.2** Create SEOEditor tab in builder
- [x] **5.3** Implement dynamic meta tags in PublicSchoolPage
- [x] **5.4** Add Open Graph and Twitter Card tags
- [ ] **5.5** Implement image optimization (sharp library)
- [ ] **5.6** Add lazy loading for images
- [ ] **5.7** Implement caching strategy for public pages
- [x] **5.8** Add revision history tracking
- [x] **5.9** Implement rollback functionality

### Phase 6: Testing & Documentation
- [ ] **6.1** Write tests for backend config endpoints
- [ ] **6.2** Write tests for contact form submission
- [ ] **6.3** Write tests for analytics tracking
- [ ] **6.4** Test responsive design on mobile/tablet/desktop
- [ ] **6.5** Test all builder functionality
- [ ] **6.6** Optimize performance (Lighthouse score 90+)
- [ ] **6.7** Create user guide for managers
- [ ] **6.8** Document API endpoints

---

## 🗄️ Database Schema

### School Model Extension
```javascript
landingPage: {
  isEnabled: { type: Boolean, default: false },
  isDraft: { type: Boolean, default: true },
  publishedAt: Date,
  lastEditedAt: Date,
  
  config: {
    // Theme Configuration
    theme: {
      primaryColor: { type: String, default: '#3B82F6' },      // Blue
      secondaryColor: { type: String, default: '#F97316' },    // Orange
      accentColor: { type: String, default: '#8B5CF6' },       // Purple
      backgroundColor: { type: String, default: '#FFFFFF' },
      textColor: { type: String, default: '#1F2937' },
      fontFamily: { type: String, default: 'Inter' },
      buttonStyle: { type: String, default: 'rounded' },       // rounded, square
      buttonVariant: { type: String, default: 'filled' },      // filled, outlined
      spacing: { type: String, default: 'normal' },            // compact, normal, spacious
      animations: { type: Boolean, default: true }
    },
    
    // SEO Configuration
    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String],
      ogImage: String,
      ogTitle: String,
      ogDescription: String,
      twitterCard: String,
      twitterImage: String
    },
    
    // Sections Configuration
    sections: [
      {
        type: { type: String, required: true },  // 'hero', 'programs', 'teachers', etc.
        enabled: { type: Boolean, default: true },
        order: { type: Number, required: true },
        data: Schema.Types.Mixed  // Section-specific data
      }
    ]
  },
  
  // Revision History
  revisions: [{
    config: Schema.Types.Mixed,
    createdAt: Date,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
  }]
}
```

### ContactInquiry Model (NEW)
```javascript
{
  school: { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  message: { type: String, required: true },
  source: { type: String, default: 'landing_page' },
  status: { type: String, enum: ['new', 'contacted', 'converted', 'archived'], default: 'new' },
  notes: String,
  createdAt: { type: Date, default: Date.now, index: true }
}
```

### LandingPageAnalytics Model (NEW)
```javascript
{
  school: { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  date: { type: Date, required: true, index: true },
  
  // Daily aggregated metrics
  pageViews: { type: Number, default: 0 },
  uniqueVisitors: { type: Number, default: 0 },
  
  // Engagement metrics
  ctaClicks: {
    total: { type: Number, default: 0 },
    bySection: Schema.Types.Mixed  // { hero: 5, programs: 3, ... }
  },
  
  contactFormSubmissions: { type: Number, default: 0 },
  
  // Time metrics
  avgTimeOnPage: Number,  // in seconds
  bounceRate: Number,     // percentage
  
  // Section engagement
  sectionViews: Schema.Types.Mixed  // { hero: 100, programs: 85, ... }
}
```

---

## 🎨 Default Landing Page Template

### Sections Structure
```javascript
const DEFAULT_CONFIG = {
  theme: {
    primaryColor: '#3B82F6',
    secondaryColor: '#F97316',
    accentColor: '#8B5CF6',
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937',
    fontFamily: 'Inter',
    buttonStyle: 'rounded',
    buttonVariant: 'filled',
    spacing: 'normal',
    animations: true
  },
  
  seo: {
    metaTitle: 'Welcome to [School Name] - Online Learning Excellence',
    metaDescription: 'Join our online learning community and unlock your potential',
    keywords: ['online learning', 'tutoring', 'education', 'courses']
  },
  
  sections: [
    // 1. HERO SECTION
    {
      type: 'hero',
      enabled: true,
      order: 1,
      data: {
        title: 'Welcome to Excellence in Online Learning',
        subtitle: 'Transform your future with expert-led courses and personalized instruction',
        ctaButtons: [
          { text: 'Get Started', link: '#programs', variant: 'primary' },
          { text: 'Learn More', link: '#about', variant: 'secondary' }
        ],
        backgroundImage: '/uploads/hero-bg.jpg',
        overlayOpacity: 0.5
      }
    },
    
    // 2. ABOUT SECTION
    {
      type: 'about',
      enabled: true,
      order: 2,
      data: {
        title: 'About Our School',
        description: 'We are dedicated to providing world-class online education...',
        image: '/uploads/about.jpg',
        stats: [
          { number: '500+', label: 'Students' },
          { number: '50+', label: 'Expert Teachers' },
          { number: '95%', label: 'Success Rate' }
        ]
      }
    },
    
    // 3. PROGRAMS SECTION
    {
      type: 'programs',
      enabled: true,
      order: 3,
      data: {
        title: 'Our Programs',
        subtitle: 'Explore our comprehensive course offerings',
        cards: [
          {
            id: 'prog-1',
            title: 'Mathematics Mastery',
            description: 'From basics to advanced calculus',
            image: '/uploads/math.jpg',
            duration: '12 weeks',
            price: '$299',
            features: ['Live Classes', 'Practice Tests', 'Certificate']
          },
          {
            id: 'prog-2',
            title: 'Science Excellence',
            description: 'Physics, Chemistry, Biology',
            image: '/uploads/science.jpg',
            duration: '16 weeks',
            price: '$399',
            features: ['Lab Sessions', 'Study Materials', 'Certificate']
          },
          {
            id: 'prog-3',
            title: 'Language Arts',
            description: 'Reading, Writing, Grammar',
            image: '/uploads/language.jpg',
            duration: '10 weeks',
            price: '$249',
            features: ['Interactive Lessons', 'Writing Feedback', 'Certificate']
          }
        ]
      }
    },
    
    // 4. TEACHERS SECTION
    {
      type: 'teachers',
      enabled: true,
      order: 4,
      data: {
        title: 'Meet Our Expert Teachers',
        subtitle: 'Learn from the best in the industry',
        cards: [
          {
            id: 'teacher-1',
            name: 'Dr. Sarah Johnson',
            photo: '/uploads/teacher1.jpg',
            title: 'Mathematics Expert',
            bio: '15+ years of teaching experience',
            subjects: ['Algebra', 'Calculus', 'Geometry'],
            rating: 4.9
          },
          {
            id: 'teacher-2',
            name: 'Prof. Michael Chen',
            photo: '/uploads/teacher2.jpg',
            title: 'Science Specialist',
            bio: 'PhD in Physics, passionate educator',
            subjects: ['Physics', 'Chemistry'],
            rating: 4.8
          },
          {
            id: 'teacher-3',
            name: 'Ms. Emily Rodriguez',
            photo: '/uploads/teacher3.jpg',
            title: 'Language Arts',
            bio: 'Published author and educator',
            subjects: ['English', 'Literature', 'Writing'],
            rating: 5.0
          }
        ]
      }
    },
    
    // 5. TESTIMONIALS SECTION
    {
      type: 'testimonials',
      enabled: true,
      order: 5,
      data: {
        title: 'What Our Students Say',
        subtitle: 'Real feedback from real students',
        cards: [
          {
            id: 'test-1',
            studentName: 'Ahmed Ali',
            photo: '/uploads/student1.jpg',
            quote: 'The best online learning experience I ever had. Teachers are amazing!',
            rating: 5,
            course: 'Mathematics Mastery'
          },
          {
            id: 'test-2',
            studentName: 'Fatima Hassan',
            photo: '/uploads/student2.jpg',
            quote: 'I improved my grades significantly. Highly recommended!',
            rating: 5,
            course: 'Science Excellence'
          },
          {
            id: 'test-3',
            studentName: 'Omar Khalil',
            photo: '/uploads/student3.jpg',
            quote: 'Flexible schedule and great support. Perfect for my needs.',
            rating: 4,
            course: 'Language Arts'
          }
        ]
      }
    },
    
    // 6. FEATURES SECTION
    {
      type: 'features',
      enabled: true,
      order: 6,
      data: {
        title: 'Why Choose Us',
        subtitle: 'Everything you need for online learning success',
        items: [
          {
            icon: 'video',
            title: 'Live Interactive Classes',
            description: 'Real-time learning with expert teachers'
          },
          {
            icon: 'clock',
            title: 'Flexible Schedule',
            description: 'Learn at your own pace and time'
          },
          {
            icon: 'certificate',
            title: 'Certified Programs',
            description: 'Get recognized certificates upon completion'
          },
          {
            icon: 'support',
            title: '24/7 Support',
            description: 'Always here to help you succeed'
          },
          {
            icon: 'assignment',
            title: 'Practice Materials',
            description: 'Extensive resources and exercises'
          },
          {
            icon: 'trophy',
            title: 'Track Progress',
            description: 'Monitor your learning journey'
          }
        ]
      }
    },
    
    // 7. PRICING SECTION
    {
      type: 'pricing',
      enabled: true,
      order: 7,
      data: {
        title: 'Choose Your Plan',
        subtitle: 'Flexible pricing for every student',
        plans: [
          {
            id: 'basic',
            name: 'Basic',
            price: '$99',
            period: 'month',
            features: ['Access to 5 courses', 'Email support', 'Study materials'],
            highlighted: false
          },
          {
            id: 'standard',
            name: 'Standard',
            price: '$199',
            period: 'month',
            features: ['Access to 15 courses', 'Priority support', 'Study materials', 'Live sessions'],
            highlighted: true
          },
          {
            id: 'premium',
            name: 'Premium',
            price: '$299',
            period: 'month',
            features: ['Unlimited courses', '24/7 support', 'All materials', 'Live sessions', '1-on-1 tutoring'],
            highlighted: false
          }
        ]
      }
    },
    
    // 8. FAQ SECTION
    {
      type: 'faq',
      enabled: true,
      order: 8,
      data: {
        title: 'Frequently Asked Questions',
        subtitle: 'Get answers to common questions',
        items: [
          {
            id: 'faq-1',
            question: 'How do I enroll in a course?',
            answer: 'Simply browse our programs, select the course you want, and click the Enroll button. You\'ll be guided through the registration process.'
          },
          {
            id: 'faq-2',
            question: 'What equipment do I need?',
            answer: 'All you need is a computer or tablet with internet connection, a webcam, and a microphone for interactive sessions.'
          },
          {
            id: 'faq-3',
            question: 'Can I get a refund?',
            answer: 'Yes, we offer a 30-day money-back guarantee if you\'re not satisfied with our courses.'
          },
          {
            id: 'faq-4',
            question: 'Are the certificates recognized?',
            answer: 'Our certificates are recognized by educational institutions and employers. Each certificate includes a unique verification code.'
          },
          {
            id: 'faq-5',
            question: 'How long do I have access to courses?',
            answer: 'Once enrolled, you have lifetime access to the course materials, including any future updates.'
          },
          {
            id: 'faq-6',
            question: 'Do you offer group discounts?',
            answer: 'Yes! Contact us for special pricing on group enrollments of 5 or more students.'
          }
        ]
      }
    },
    
    // 9. CONTACT SECTION
    {
      type: 'contact',
      enabled: true,
      order: 9,
      data: {
        title: 'Get In Touch',
        subtitle: 'Have questions? We\'d love to hear from you',
        email: 'info@school.com',
        phone: '+1 234 567 8900',
        address: '123 Education Street, Learning City',
        showMap: false,
        mapUrl: ''
      }
    },
    
    // 10. FOOTER
    {
      type: 'footer',
      enabled: true,
      order: 10,
      data: {
        description: 'Empowering students through online education',
        socialLinks: [
          { platform: 'facebook', url: 'https://facebook.com' },
          { platform: 'twitter', url: 'https://twitter.com' },
          { platform: 'instagram', url: 'https://instagram.com' },
          { platform: 'linkedin', url: 'https://linkedin.com' }
        ],
        links: [
          { text: 'About Us', url: '#about' },
          { text: 'Programs', url: '#programs' },
          { text: 'Teachers', url: '#teachers' },
          { text: 'Contact', url: '#contact' }
        ],
        copyrightText: '© 2025 All rights reserved.'
      }
    }
  ]
};
```

---

## 🛣️ API Endpoints

### Backend Routes

#### Landing Page Config Management
- `GET /api/schools/my-school/landing-page` - Get current landing page config
- `PUT /api/schools/my-school/landing-page/config` - Update entire config
- `POST /api/schools/my-school/landing-page/publish` - Publish draft to live
- `POST /api/schools/my-school/landing-page/revert/:revisionId` - Rollback to previous version
- `GET /api/schools/my-school/landing-page/revisions` - Get revision history

#### Media Management
- `POST /api/schools/my-school/landing-page/upload` - Upload image
- `DELETE /api/schools/my-school/landing-page/media/:filename` - Delete image
- `GET /api/schools/my-school/landing-page/media` - List all uploaded media

#### Contact Form
- `POST /api/public/landing-page/:schoolId/contact` - Submit contact form (public)
- `GET /api/schools/my-school/inquiries` - Get all inquiries (manager)
- `PATCH /api/schools/my-school/inquiries/:id` - Update inquiry status

#### Analytics
- `POST /api/public/landing-page/:schoolId/track` - Track analytics event (public)
- `GET /api/schools/my-school/landing-page/analytics` - Get analytics dashboard data
- `GET /api/schools/my-school/landing-page/analytics/export` - Export analytics CSV

#### Public Access
- `GET /api/public/landing-page/:schoolId` - Get published landing page (existing)
- `GET /api/public/landing-page/:schoolId/preview` - Preview draft (with auth token)

---

## 🎯 Component Architecture

### Public Landing Page Components

```
PublicSchoolPage.jsx (Main Container)
├── LandingNavigation.jsx (Sticky nav with smooth scroll)
├── HeroSection.jsx
├── AboutSection.jsx
├── ProgramsSection.jsx
│   └── ProgramCard.jsx (repeatable)
├── TeachersSection.jsx
│   └── TeacherCard.jsx (repeatable)
├── TestimonialsSection.jsx
│   └── TestimonialCard.jsx (in carousel)
├── FeaturesSection.jsx
│   └── FeatureItem.jsx (repeatable)
├── PricingSection.jsx
│   └── PricingCard.jsx (repeatable)
├── FAQSection.jsx
│   └── FAQItem.jsx (accordion item)
├── ContactSection.jsx
│   └── ContactForm.jsx
└── FooterSection.jsx
```

### Manager Builder Components

```
LandingPageBuilder.jsx (Main Container)
├── BuilderNavigation.jsx (Tab switcher)
├── ContentTab.jsx
│   ├── SectionToggleList.jsx
│   ├── SectionReorderList.jsx (drag-drop)
│   ├── HeroEditor.jsx
│   ├── AboutEditor.jsx
│   ├── ProgramsEditor.jsx
│   │   └── ProgramCardEditor.jsx
│   ├── TeachersEditor.jsx
│   │   └── TeacherCardEditor.jsx
│   ├── TestimonialsEditor.jsx
│   │   └── TestimonialEditor.jsx
│   ├── FeaturesEditor.jsx
│   ├── PricingEditor.jsx
│   │   └── PricingPlanEditor.jsx
│   ├── FAQEditor.jsx
│   │   └── FAQItemEditor.jsx
│   ├── ContactEditor.jsx
│   └── FooterEditor.jsx
├── MediaTab.jsx
│   ├── MediaUploader.jsx
│   ├── MediaLibrary.jsx
│   └── MediaItem.jsx
├── DesignTab.jsx
│   ├── ThemeEditor.jsx
│   │   ├── ColorPicker.jsx
│   │   ├── FontSelector.jsx
│   │   └── SpacingSelector.jsx
│   └── LayoutOptions.jsx
├── AnalyticsTab.jsx
│   ├── AnalyticsDashboard.jsx
│   ├── MetricsCards.jsx
│   ├── AnalyticsChart.jsx
│   └── InquiriesList.jsx
├── SEOTab.jsx
│   └── SEOEditor.jsx
└── PreviewPanel.jsx (Iframe or split view)
```

---

## 🚀 Implementation Order

**Priority 1 - Core Functionality (Days 1-3)**
1. Backend schema and models
2. Default template configuration
3. Backend API routes
4. Basic public landing page rendering

**Priority 2 - Builder Interface (Days 4-6)**
5. Builder main structure
6. Content tab editors
7. Media upload functionality
8. Save/Publish workflow

**Priority 3 - Visual Design (Days 7-8)**
9. Design tab (theme customization)
10. Responsive design polish
11. Animations and transitions

**Priority 4 - Analytics & Advanced (Days 9-10)**
12. Analytics tracking
13. Analytics dashboard
14. Contact form backend
15. Inquiries management

**Priority 5 - Optimization & Testing (Days 11-12)**
16. Performance optimization
17. SEO implementation
18. Testing and bug fixes
19. Documentation

---

## 📝 Notes & Considerations

### Performance Targets
- Lighthouse Performance Score: 90+
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Total Bundle Size: < 500KB (landing page)

### Browser Support
- Chrome/Edge (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

### Accessibility
- WCAG 2.1 Level AA compliance
- Keyboard navigation support
- Screen reader friendly
- Proper ARIA labels

### Security
- Input sanitization (XSS prevention)
- CSRF protection on forms
- Rate limiting on public endpoints
- Image upload validation (file type, size)

---

**Last Updated**: November 14, 2025  
**Implementation Status**: 0/79 tasks completed (0%)
