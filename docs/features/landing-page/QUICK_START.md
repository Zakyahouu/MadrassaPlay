# Landing Page Builder - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Node.js v14+
- MongoDB running
- Existing MadrassaPlay installation

### Installation

No additional packages needed! The landing page builder uses existing dependencies:
- React (already installed)
- Tailwind CSS (already installed)
- Axios (already installed)
- Lucide React icons (already installed)
- Multer (already installed for file uploads)

### Initialize Database

Run the initialization script to set up landing pages for existing schools:

```bash
cd server
node scripts/initializeLandingPages.js
```

This will:
- Add landingPage.config to all existing schools
- Populate with professional default template
- Set all pages to draft mode (unpublished)

---

## 📋 Usage

### For Managers

#### Access the Builder
1. Log in as a manager
2. Navigate to `/manager/landing-page-builder`
3. System auto-initializes if no config exists

#### Edit Content
```
1. Click "Content" tab
2. Enable/disable sections with eye icon
3. Click "Edit" button on any section
4. Make changes in editor panel
5. Click "Save Draft" button
```

#### Customize Design
```
1. Click "Design" tab
2. Pick colors with color pickers
3. Select font from dropdown
4. Choose button style
5. Click "Save Draft" button
```

#### Upload Images
```
1. Click "Media" tab
2. Upload image (drag-drop or browse)
3. Copy URL from success message
4. Go back to "Content" tab
5. Paste URL in image field
6. Click "Save Draft" button
```

#### Publish
```
1. Make all desired changes
2. Click "Publish" button (top right)
3. Confirm in dialog
4. Page goes live immediately
```

#### View Analytics
```
1. Click "Analytics" tab
2. Select period (7/30/90 days)
3. View metrics cards
4. See recent inquiries
```

#### Manage Leads
```
1. Navigate to /manager/inquiries
2. Filter by status
3. Search inquiries
4. Click to view details
5. Update status
```

### For Developers

#### Backend API Usage

**Fetch Landing Page Config:**
```javascript
GET /api/schools/my-school/landing-page/config
Authorization: Bearer <token>

Response:
{
  config: {
    theme: { primaryColor, secondaryColor, ... },
    seo: { metaTitle, metaDescription, ... },
    sections: [...]
  },
  status: { isEnabled, isDraft, publishedAt, lastEditedAt }
}
```

**Update Config:**
```javascript
PUT /api/schools/my-school/landing-page/config
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  theme: { primaryColor: "#3B82F6", ... },
  sections: [...]
}

Response:
{
  message: "Landing page configuration updated successfully",
  config: { ... }
}
```

**Publish Page:**
```javascript
POST /api/schools/my-school/landing-page/publish
Authorization: Bearer <token>

Response:
{
  message: "Landing page published successfully",
  publishedAt: "2024-01-01T00:00:00.000Z"
}
```

**Track Analytics Event:**
```javascript
POST /api/public/landing-page/:schoolId/track
Content-Type: application/json

Body:
{
  eventType: "page_view", // or "cta_click", "section_view", etc.
  visitorId: "uuid-from-localstorage",
  metadata: {
    section: "hero",
    ctaText: "Get Started",
    device: "desktop"
  }
}
```

**Submit Contact Form:**
```javascript
POST /api/public/landing-page/:schoolId/contact
Content-Type: application/json

Body:
{
  name: "John Doe",
  email: "john@example.com",
  phone: "+1234567890",
  message: "I'm interested in your courses"
}

Response:
{
  message: "Contact form submitted successfully",
  inquiryId: "64f1a2b3c4d5e6f7g8h9i0j1"
}
```

#### Frontend Component Usage

**Render Public Landing Page:**
```jsx
import PublicSchoolLandingPage from './pages/PublicSchoolLandingPage';

// In your routes:
<Route path="/school/:schoolId" element={<PublicSchoolLandingPage />} />
```

**Embed Landing Page Builder:**
```jsx
import LandingPageBuilder from './components/manager/LandingPageBuilder';

// In manager routes:
<Route path="/manager/landing-page-builder" element={
  <ProtectedRoute>
    <LandingPageBuilder />
  </ProtectedRoute>
} />
```

**Use Individual Section Components:**
```jsx
import HeroSection from './components/landing/HeroSection';

const theme = {
  primaryColor: '#3B82F6',
  secondaryColor: '#F97316',
  accentColor: '#8B5CF6',
  textColor: '#1F2937',
  fontFamily: 'Inter',
  buttonStyle: 'rounded'
};

const heroData = {
  title: 'Welcome to Our School',
  subtitle: 'Learn, Grow, Succeed',
  ctaButtons: [
    { text: 'Get Started', link: '#programs' },
    { text: 'Learn More', link: '#about' }
  ],
  backgroundImage: 'https://example.com/hero.jpg'
};

<HeroSection data={heroData} theme={theme} />
```

---

## 🎨 Customization

### Add New Section Type

1. **Create Section Component:**
```jsx
// client/src/components/landing/NewSection.jsx
import React from 'react';

const NewSection = ({ data, theme }) => {
  return (
    <section
      style={{
        '--primary-color': theme.primaryColor,
        '--secondary-color': theme.secondaryColor
      }}
      className="py-20 bg-gray-50"
    >
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-4xl font-bold mb-8">{data.title}</h2>
        {/* Your content here */}
      </div>
    </section>
  );
};

export default NewSection;
```

2. **Create Editor Component:**
```jsx
// client/src/components/manager/builder/editors/NewSectionEditor.jsx
import React from 'react';

const NewSectionEditor = ({ data, onChange, showMessage }) => {
  return (
    <div className="space-y-4">
      <input
        type="text"
        value={data.title}
        onChange={(e) => onChange({ ...data, title: e.target.value })}
        className="w-full px-3 py-2 border rounded-lg"
      />
      {/* Your editor fields here */}
    </div>
  );
};

export default NewSectionEditor;
```

3. **Register in ContentTab:**
```jsx
// client/src/components/manager/builder/ContentTab.jsx
import NewSectionEditor from './editors/NewSectionEditor';

const editorComponents = {
  // ... existing editors
  newsection: NewSectionEditor
};

const sectionLabels = {
  // ... existing labels
  newsection: 'New Section'
};
```

4. **Register in PublicSchoolLandingPage:**
```jsx
// client/src/pages/PublicSchoolLandingPage.jsx
import NewSection from '../components/landing/NewSection';

const sectionComponents = {
  // ... existing components
  newsection: NewSection
};
```

5. **Add to Default Template:**
```javascript
// server/utils/defaultLandingPageTemplate.js
sections: [
  // ... existing sections
  {
    type: 'newsection',
    enabled: false,
    order: 10,
    data: {
      title: 'Default Title'
    }
  }
]
```

### Customize Theme

Edit the default theme in `server/utils/defaultLandingPageTemplate.js`:

```javascript
theme: {
  primaryColor: '#YOUR_COLOR',
  secondaryColor: '#YOUR_COLOR',
  accentColor: '#YOUR_COLOR',
  textColor: '#YOUR_COLOR',
  fontFamily: 'Your Font',
  buttonStyle: 'rounded' // or 'square'
}
```

### Add New Icon

The system uses Lucide React icons. To add new icons:

1. **Import Icon:**
```jsx
import { YourIcon } from 'lucide-react';
```

2. **Add to Icon Map (for FeaturesSection):**
```jsx
// client/src/components/landing/FeaturesSection.jsx
const iconMap = {
  // ... existing icons
  YourIcon: YourIcon
};
```

3. **Add to Icon Options (for FeaturesEditor):**
```jsx
// client/src/components/manager/builder/editors/FeaturesEditor.jsx
const iconOptions = [
  // ... existing options
  'YourIcon'
];
```

---

## 🔧 Configuration

### Environment Variables

No additional environment variables needed. Uses existing:
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `PORT` - Server port (default: 5000)

### File Upload Settings

Configure in `server/routes/schoolRoutes.js`:

```javascript
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'public/uploads/landing');
    },
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});
```

---

## 🐛 Troubleshooting

### Images Not Displaying
**Problem:** Uploaded images show broken image icon  
**Solution:**
1. Check `server/public/uploads` directory exists
2. Verify file was uploaded successfully
3. Check URL format: `http://localhost:5000/uploads/landing/filename.jpg`
4. Ensure static middleware is configured in `server/app.js`

### Theme Not Applying
**Problem:** Color changes don't show on public page  
**Solution:**
1. Check CSS custom properties syntax in `PublicSchoolLandingPage.jsx`
2. Verify theme object structure matches schema
3. Clear browser cache
4. Inspect element to see if CSS variables are set

### Analytics Not Tracking
**Problem:** No page views or clicks showing  
**Solution:**
1. Check `PublicSchoolLandingPage.jsx` has axios tracking calls
2. Verify `landingPagePublicController.trackAnalyticsEvent` is working
3. Check MongoDB for `landingpageanalytics` collection
4. Look for console errors in browser DevTools

### Publish Fails
**Problem:** "Failed to publish" error  
**Solution:**
1. Check server logs for detailed error
2. Verify user has manager role
3. Check config is valid (not null)
4. Ensure revisions array isn't corrupted

### Contact Form Not Submitting
**Problem:** Form submission shows error  
**Solution:**
1. Check required fields are filled
2. Verify email format is valid
3. Check `ContactInquiry` model is registered
4. Look for server-side validation errors

---

## 📊 Monitoring

### Check System Status

```bash
# Check if server is running
curl http://localhost:5000/api/health

# Test landing page endpoint
curl http://localhost:5000/api/public/landing-page/SCHOOL_ID/full

# Check analytics
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:5000/api/schools/my-school/landing-page/analytics?period=7
```

### MongoDB Queries

```javascript
// Check landing page configs
db.schools.find({ 'landingPage.isEnabled': true }).count()

// Check inquiries
db.contactinquiries.find({ status: 'new' }).count()

// Check analytics
db.landingpageanalytics.find().sort({ date: -1 }).limit(7)
```

---

## 🚀 Deployment

### Production Checklist

- [ ] Run initialization script on production DB
- [ ] Set up file upload directory with proper permissions
- [ ] Configure CORS for public endpoints
- [ ] Enable rate limiting on public contact form
- [ ] Set up image optimization (sharp library)
- [ ] Configure CDN for uploaded images
- [ ] Set up MongoDB backups
- [ ] Add monitoring (PM2, Sentry, etc.)
- [ ] Test all flows on staging environment
- [ ] Create manager training materials

### Performance Optimization

```javascript
// Add caching middleware for public pages
const cache = require('express-redis-cache')();

router.get('/landing-page/:schoolId/full', 
  cache.route({ expire: 300 }), // 5 min cache
  landingPagePublicController.getPublicLandingPageWithTracking
);

// Implement image optimization
const sharp = require('sharp');

// Resize and compress uploaded images
await sharp(imagePath)
  .resize(1200, 630, { fit: 'cover' })
  .jpeg({ quality: 85 })
  .toFile(optimizedPath);
```

---

## 📚 Additional Resources

### Related Documentation
- [Full Implementation Spec](./LANDING_PAGE_BUILDER_SPEC.md)
- [Implementation Summary](./LANDING_PAGE_IMPLEMENTATION_SUMMARY.md)
- [Default Template](./server/utils/defaultLandingPageTemplate.js)

### External Resources
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Lucide React Icons](https://lucide.dev/)
- [React Router](https://reactrouter.com/)
- [Axios](https://axios-http.com/)

---

## 🤝 Support

For issues or questions:
1. Check this guide first
2. Review implementation summary
3. Check server logs for errors
4. Inspect browser console for frontend errors
5. Test with default template to isolate issue

---

*Last Updated: November 14, 2025*
