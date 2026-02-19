// client/src/pages/PublicSchoolLandingPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';

// Import all section components
import LandingNavigation from '../components/landing/LandingNavigation';
import HeroSection from '../components/landing/HeroSection';
import AboutSection from '../components/landing/AboutSection';
import ProgramsSection from '../components/landing/ProgramsSection';
import TeachersSection from '../components/landing/TeachersSection';
import TestimonialsSection from '../components/landing/TestimonialsSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import PricingSection from '../components/landing/PricingSection';
import FAQSection from '../components/landing/FAQSection';
import ContactSection from '../components/landing/ContactSection';
import FooterSection from '../components/landing/FooterSection';

const sectionComponents = {
  hero: HeroSection,
  about: AboutSection,
  programs: ProgramsSection,
  teachers: TeachersSection,
  testimonials: TestimonialsSection,
  features: FeaturesSection,
  pricing: PricingSection,
  faq: FAQSection,
  contact: ContactSection,
  footer: FooterSection
};

const PublicSchoolLandingPage = () => {
  const { schoolId } = useParams();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchLandingPage = async () => {
      try {
        const response = await axios.get(`/api/public/landing-page/${schoolId}/full`);
        setData(response.data);

        // Track page view
        const visitorId = localStorage.getItem('visitorId') || `visitor_${Date.now()}_${Math.random()}`;
        localStorage.setItem('visitorId', visitorId);

        axios.post(`/api/public/landing-page/${schoolId}/track`, {
          eventType: 'page_view',
          data: { visitorId }
        }).catch(() => { });

        // Track time on page when user leaves
        const startTime = Date.now();
        const handleBeforeUnload = () => {
          const timeSpent = Math.floor((Date.now() - startTime) / 1000);
          if (timeSpent > 5) {
            navigator.sendBeacon(
              `/api/public/landing-page/${schoolId}/track`,
              JSON.stringify({ eventType: 'time_on_page', data: { timeSpent } })
            );
          }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
      } catch (err) {
        setError(err.response?.data?.message || 'Landing page not found');
      } finally {
        setLoading(false);
      }
    };

    if (schoolId) {
      fetchLandingPage();
    }
  }, [schoolId]);

  // Apply theme to document
  useEffect(() => {
    if (data?.config?.theme) {
      const theme = data.config.theme;
      document.documentElement.style.setProperty('--primary-color', theme.primaryColor);
      document.documentElement.style.setProperty('--secondary-color', theme.secondaryColor);
      document.documentElement.style.setProperty('--accent-color', theme.accentColor);
      document.documentElement.style.setProperty('--text-color', theme.textColor);

      // Apply font family
      if (theme.fontFamily) {
        document.body.style.fontFamily = `${theme.fontFamily}, sans-serif`;
      }
    }

    return () => {
      // Cleanup
      document.documentElement.style.removeProperty('--primary-color');
      document.documentElement.style.removeProperty('--secondary-color');
      document.documentElement.style.removeProperty('--accent-color');
      document.documentElement.style.removeProperty('--text-color');
    };
  }, [data]);

  // Set SEO meta tags
  useEffect(() => {
    if (data?.config?.seo) {
      const seo = data.config.seo;

      document.title = seo.metaTitle || `${data.name} - Online Learning`;

      // Meta description
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.name = 'description';
        document.head.appendChild(metaDescription);
      }
      metaDescription.content = seo.metaDescription || '';

      // Open Graph tags
      const setOGTag = (property, content) => {
        if (!content) return;
        let tag = document.querySelector(`meta[property="${property}"]`);
        if (!tag) {
          tag = document.createElement('meta');
          tag.setAttribute('property', property);
          document.head.appendChild(tag);
        }
        tag.content = content;
      };

      setOGTag('og:title', seo.ogTitle || seo.metaTitle);
      setOGTag('og:description', seo.ogDescription || seo.metaDescription);
      if (seo.ogImage) setOGTag('og:image', seo.ogImage);

      // Twitter Card tags
      if (seo.twitterCard) {
        let twitterCard = document.querySelector('meta[name="twitter:card"]');
        if (!twitterCard) {
          twitterCard = document.createElement('meta');
          twitterCard.name = 'twitter:card';
          document.head.appendChild(twitterCard);
        }
        twitterCard.content = seo.twitterCard;
      }
    }
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.pageNotFound}</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t.goToHomepage}
          </a>
        </div>
      </div>
    );
  }

  if (!data?.config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">{t.noLandingPageConfigured}</p>
        </div>
      </div>
    );
  }

  const { config, name, logo } = data;
  const { theme, sections = [] } = config;

  // Sort sections by order
  const sortedSections = [...sections]
    .filter(section => section.enabled !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="landing-page">
      {/* Sticky Navigation */}
      <LandingNavigation
        sections={sortedSections}
        theme={theme}
        schoolName={name}
        logo={logo}
      />

      {/* Render each section dynamically */}
      {sortedSections.map((section, index) => {
        const SectionComponent = sectionComponents[section.type];

        if (!SectionComponent) {
          console.warn(`Unknown section type: ${section.type}`);
          return null;
        }

        return (
          <SectionComponent
            key={`${section.type}-${index}`}
            data={section.data}
            theme={theme}
            schoolId={schoolId}
            schoolName={name}
          />
        );
      })}

      {/* Global Styles */}
      <style jsx global>{`
        * {
          scroll-behavior: smooth;
        }
        
        .landing-page {
          min-height: 100vh;
        }
      `}</style>
    </div>
  );
};

export default PublicSchoolLandingPage;
