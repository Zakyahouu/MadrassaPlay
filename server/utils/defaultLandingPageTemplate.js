// server/utils/defaultLandingPageTemplate.js

/**
 * Default Landing Page Template
 * Professional configuration for online tutoring schools
 * Used as the starting point for all new school landing pages
 */

const DEFAULT_LANDING_PAGE_CONFIG = {
  theme: {
    primaryColor: '#3B82F6',       // Blue - trust, professionalism
    secondaryColor: '#F97316',     // Orange - energy, enthusiasm
    accentColor: '#8B5CF6',        // Purple - creativity, wisdom
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937',          // Dark gray
    fontFamily: 'Inter',           // Modern, readable font
    buttonStyle: 'rounded',        // rounded, square
    buttonVariant: 'filled',       // filled, outlined
    spacing: 'normal',             // compact, normal, spacious
    animations: true
  },
  
  seo: {
    metaTitle: 'Welcome to Excellence in Online Learning',
    metaDescription: 'Join our online learning community and unlock your potential with expert-led courses and personalized instruction.',
    keywords: ['online learning', 'tutoring', 'education', 'courses', 'online school', 'distance learning'],
    ogTitle: 'Excellence in Online Learning',
    ogDescription: 'Transform your future with expert-led courses',
    twitterCard: 'summary_large_image'
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
          {
            text: 'Explore Programs',
            link: '#programs',
            variant: 'primary'
          },
          {
            text: 'Learn More',
            link: '#about',
            variant: 'secondary'
          }
        ],
        backgroundImage: '',
        overlayOpacity: 0.5,
        showScrollIndicator: true
      }
    },
    
    // 2. ABOUT SECTION
    {
      type: 'about',
      enabled: true,
      order: 2,
      data: {
        title: 'About Our School',
        description: 'We are dedicated to providing world-class online education that empowers students to achieve their goals. Our experienced teachers, comprehensive curriculum, and flexible learning approach make education accessible to everyone, everywhere.',
        image: '',
        stats: [
          {
            number: '500+',
            label: 'Active Students'
          },
          {
            number: '50+',
            label: 'Expert Teachers'
          },
          {
            number: '95%',
            label: 'Success Rate'
          },
          {
            number: '4.8/5',
            label: 'Student Rating'
          }
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
        subtitle: 'Explore our comprehensive course offerings designed for your success',
        cards: [
          {
            id: 'prog-1',
            title: 'Mathematics Mastery',
            description: 'From fundamental arithmetic to advanced calculus. Build a strong foundation and excel in mathematics.',
            image: '',
            duration: '12 weeks',
            level: 'All Levels',
            price: '$299',
            features: [
              'Live Interactive Classes',
              'Practice Tests & Quizzes',
              'Study Materials Included',
              'Certificate of Completion'
            ],
            highlight: false
          },
          {
            id: 'prog-2',
            title: 'Science Excellence',
            description: 'Comprehensive science education covering Physics, Chemistry, and Biology with hands-on learning.',
            image: '',
            duration: '16 weeks',
            level: 'Intermediate',
            price: '$399',
            features: [
              'Virtual Lab Sessions',
              'Expert Science Teachers',
              'Interactive Experiments',
              'Certificate of Completion'
            ],
            highlight: true
          },
          {
            id: 'prog-3',
            title: 'Language Arts',
            description: 'Master reading comprehension, writing, grammar, and communication skills.',
            image: '',
            duration: '10 weeks',
            level: 'All Levels',
            price: '$249',
            features: [
              'Interactive Lessons',
              'Personalized Writing Feedback',
              'Reading Materials Library',
              'Certificate of Completion'
            ],
            highlight: false
          },
          {
            id: 'prog-4',
            title: 'Computer Science',
            description: 'Learn programming, web development, and computational thinking from scratch.',
            image: '',
            duration: '14 weeks',
            level: 'Beginner to Advanced',
            price: '$349',
            features: [
              'Hands-on Coding Projects',
              'Industry-Standard Tools',
              'Portfolio Development',
              'Certificate of Completion'
            ],
            highlight: false
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
        subtitle: 'Learn from passionate educators with years of experience',
        cards: [
          {
            id: 'teacher-1',
            name: 'Dr. Sarah Johnson',
            photo: '',
            title: 'Mathematics Expert',
            bio: 'PhD in Mathematics with 15+ years of teaching experience. Passionate about making complex concepts simple and accessible.',
            subjects: ['Algebra', 'Calculus', 'Geometry', 'Statistics'],
            rating: 4.9,
            studentsCount: 150
          },
          {
            id: 'teacher-2',
            name: 'Prof. Michael Chen',
            photo: '',
            title: 'Science Specialist',
            bio: 'PhD in Physics and award-winning educator. Brings real-world science to life through engaging experiments.',
            subjects: ['Physics', 'Chemistry', 'Biology'],
            rating: 4.8,
            studentsCount: 120
          },
          {
            id: 'teacher-3',
            name: 'Ms. Emily Rodriguez',
            photo: '',
            title: 'Language Arts Instructor',
            bio: 'Published author and certified educator with expertise in literature and creative writing.',
            subjects: ['English', 'Literature', 'Writing', 'Grammar'],
            rating: 5.0,
            studentsCount: 180
          },
          {
            id: 'teacher-4',
            name: 'Mr. David Kim',
            photo: '',
            title: 'Computer Science Teacher',
            bio: 'Former software engineer turned educator. Makes coding fun and accessible for all ages.',
            subjects: ['Programming', 'Web Development', 'Python', 'JavaScript'],
            rating: 4.9,
            studentsCount: 95
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
        subtitle: 'Real feedback from real students and parents',
        cards: [
          {
            id: 'test-1',
            studentName: 'Ahmed Ali',
            photo: '',
            quote: 'The best online learning experience I\'ve ever had. The teachers are patient, knowledgeable, and truly care about student success. My grades have improved dramatically!',
            rating: 5,
            course: 'Mathematics Mastery',
            date: '2024-10-15'
          },
          {
            id: 'test-2',
            studentName: 'Fatima Hassan',
            photo: '',
            quote: 'I was struggling with science, but the interactive lessons and virtual labs made everything click. I actually enjoy studying now!',
            rating: 5,
            course: 'Science Excellence',
            date: '2024-09-22'
          },
          {
            id: 'test-3',
            studentName: 'Omar Khalil',
            photo: '',
            quote: 'Flexible schedule that works with my sports training. The quality of education is top-notch, and the support is amazing.',
            rating: 4,
            course: 'Language Arts',
            date: '2024-11-01'
          },
          {
            id: 'test-4',
            studentName: 'Layla Mohammed',
            photo: '',
            quote: 'Learning to code online seemed impossible, but the step-by-step approach and supportive community made it achievable. Now I\'m building my own projects!',
            rating: 5,
            course: 'Computer Science',
            date: '2024-08-30'
          },
          {
            id: 'test-5',
            studentName: 'Parent: Mrs. Sarah Ahmad',
            photo: '',
            quote: 'As a parent, I\'m impressed by the regular progress updates and how engaged my daughter is in her studies. Worth every penny!',
            rating: 5,
            course: 'Multiple Courses',
            date: '2024-10-05'
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
            description: 'Real-time learning sessions with expert teachers using advanced video conferencing technology.'
          },
          {
            icon: 'clock',
            title: 'Flexible Schedule',
            description: 'Learn at your own pace with class times that fit your lifestyle and commitments.'
          },
          {
            icon: 'certificate',
            title: 'Certified Programs',
            description: 'Earn recognized certificates upon course completion to showcase your achievements.'
          },
          {
            icon: 'support',
            title: '24/7 Student Support',
            description: 'Get help whenever you need it with our dedicated support team and community forums.'
          },
          {
            icon: 'assignment',
            title: 'Rich Learning Materials',
            description: 'Access comprehensive study guides, practice tests, videos, and interactive exercises.'
          },
          {
            icon: 'trophy',
            title: 'Track Your Progress',
            description: 'Monitor your learning journey with detailed analytics and achievement milestones.'
          },
          {
            icon: 'users',
            title: 'Small Class Sizes',
            description: 'Personalized attention with limited students per class for better learning outcomes.'
          },
          {
            icon: 'shield',
            title: 'Safe Learning Environment',
            description: 'Secure platform with privacy protection and monitored sessions for student safety.'
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
        subtitle: 'Flexible pricing options to fit every budget',
        plans: [
          {
            id: 'basic',
            name: 'Basic',
            price: '$99',
            period: 'month',
            description: 'Perfect for getting started',
            features: [
              'Access to 5 courses',
              'Email support',
              'Study materials included',
              'Progress tracking',
              'Community forum access'
            ],
            highlighted: false,
            ctaText: 'Get Started',
            ctaLink: '#contact'
          },
          {
            id: 'standard',
            name: 'Standard',
            price: '$199',
            period: 'month',
            description: 'Most popular choice',
            features: [
              'Access to 15 courses',
              'Priority support',
              'All study materials',
              'Live interactive sessions',
              'Progress tracking',
              'Monthly progress reports',
              'Community forum access'
            ],
            highlighted: true,
            ctaText: 'Start Learning',
            ctaLink: '#contact'
          },
          {
            id: 'premium',
            name: 'Premium',
            price: '$299',
            period: 'month',
            description: 'Complete learning experience',
            features: [
              'Unlimited course access',
              '24/7 priority support',
              'All learning materials',
              'Live interactive sessions',
              'One-on-one tutoring (2hrs/month)',
              'Personalized learning plan',
              'Weekly progress reports',
              'Certificate priority processing'
            ],
            highlighted: false,
            ctaText: 'Go Premium',
            ctaLink: '#contact'
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
        subtitle: 'Get answers to common questions about our programs',
        items: [
          {
            id: 'faq-1',
            question: 'How do I enroll in a course?',
            answer: 'Simply browse our programs above, select the course that interests you, and click the enrollment button. You\'ll be guided through a simple registration process. Once completed, you\'ll receive immediate access to your course materials and schedule.'
          },
          {
            id: 'faq-2',
            question: 'What equipment do I need?',
            answer: 'All you need is a computer or tablet with a stable internet connection, a webcam, and a microphone. We recommend using headphones for better audio quality during live sessions. Our platform works on all major browsers (Chrome, Firefox, Safari, Edge).'
          },
          {
            id: 'faq-3',
            question: 'Can I get a refund if I\'m not satisfied?',
            answer: 'Yes! We offer a 30-day money-back guarantee. If you\'re not satisfied with your course within the first 30 days, simply contact our support team for a full refund, no questions asked.'
          },
          {
            id: 'faq-4',
            question: 'Are the certificates recognized?',
            answer: 'Absolutely. Our certificates are recognized by educational institutions and employers worldwide. Each certificate includes a unique verification code that can be verified online, ensuring its authenticity.'
          },
          {
            id: 'faq-5',
            question: 'How long do I have access to course materials?',
            answer: 'Once you enroll in a course, you have lifetime access to all course materials, including any future updates. You can learn at your own pace and revisit materials whenever you need to refresh your knowledge.'
          },
          {
            id: 'faq-6',
            question: 'Do you offer group discounts?',
            answer: 'Yes! We offer special pricing for group enrollments of 5 or more students. This is perfect for families, study groups, or schools. Contact our team for a customized quote based on your needs.'
          },
          {
            id: 'faq-7',
            question: 'What if I need to pause my subscription?',
            answer: 'We understand life gets busy. You can pause your subscription for up to 3 months without losing your progress or access. Simply contact support at least 7 days before your next billing cycle.'
          },
          {
            id: 'faq-8',
            question: 'How are live classes scheduled?',
            answer: 'Live classes are scheduled at various times throughout the week to accommodate different time zones and schedules. When you enroll, you\'ll see available class times and can choose the ones that work best for you. Recordings are always available if you miss a session.'
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
        subtitle: 'Have questions? We\'d love to hear from you. Send us a message and we\'ll respond as soon as possible.',
        showContactForm: true,
        contactInfo: {
          email: 'info@yourschool.com',
          phone: '+1 (234) 567-8900',
          address: '123 Education Street, Learning City, LC 12345',
          hours: 'Monday - Friday: 8:00 AM - 6:00 PM'
        },
        showMap: false,
        mapEmbedUrl: '',
        socialLinks: [
          { platform: 'facebook', url: '' },
          { platform: 'twitter', url: '' },
          { platform: 'instagram', url: '' },
          { platform: 'linkedin', url: '' }
        ]
      }
    },
    
    // 10. FOOTER
    {
      type: 'footer',
      enabled: true,
      order: 10,
      data: {
        description: 'Empowering students worldwide through accessible, high-quality online education.',
        socialLinks: [
          { platform: 'facebook', url: '#', icon: 'facebook' },
          { platform: 'twitter', url: '#', icon: 'twitter' },
          { platform: 'instagram', url: '#', icon: 'instagram' },
          { platform: 'linkedin', url: '#', icon: 'linkedin' },
          { platform: 'youtube', url: '#', icon: 'youtube' }
        ],
        quickLinks: [
          { text: 'About Us', url: '#about' },
          { text: 'Programs', url: '#programs' },
          { text: 'Teachers', url: '#teachers' },
          { text: 'Testimonials', url: '#testimonials' },
          { text: 'FAQ', url: '#faq' },
          { text: 'Contact', url: '#contact' }
        ],
        legalLinks: [
          { text: 'Privacy Policy', url: '/privacy' },
          { text: 'Terms of Service', url: '/terms' },
          { text: 'Cookie Policy', url: '/cookies' },
          { text: 'Refund Policy', url: '/refunds' }
        ],
        copyrightText: '© 2025 All rights reserved.',
        showNewsletterSignup: true,
        newsletterTitle: 'Stay Updated',
        newsletterDescription: 'Subscribe to our newsletter for course updates and educational tips.'
      }
    }
  ]
};

module.exports = DEFAULT_LANDING_PAGE_CONFIG;
