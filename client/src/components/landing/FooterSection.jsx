// client/src/components/landing/FooterSection.jsx

import React from 'react';
import { Facebook, Twitter, Instagram, Linkedin, Youtube, Mail } from 'lucide-react';

const socialIconMap = {
  facebook: Facebook,
  twitter: Twitter,
  instagram: Instagram,
  linkedin: Linkedin,
  youtube: Youtube
};

const FooterSection = ({ data, theme, schoolName }) => {
  const {
    description,
    socialLinks = [],
    quickLinks = [],
    legalLinks = [],
    copyrightText,
    showNewsletterSignup = false,
    newsletterTitle,
    newsletterDescription
  } = data || {};

  const styles = {
    primaryColor: theme?.primaryColor || '#3B82F6',
    textColor: theme?.textColor || '#1F2937'
  };

  const handleLinkClick = (url) => {
    if (url.startsWith('#')) {
      const element = document.querySelector(url);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <h3 className="text-2xl font-bold mb-4">{schoolName || 'Our School'}</h3>
            <p className="text-gray-400 mb-6">
              {description || 'Empowering students through online education'}
            </p>

            {/* Social Links */}
            {socialLinks.length > 0 && (
              <div className="flex gap-3">
                {socialLinks.map((social, index) => {
                  const IconComponent = socialIconMap[social.platform] || Mail;
                  return (
                    <a
                      key={index}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors duration-300"
                      style={{ '&:hover': { backgroundColor: styles.primaryColor } }}
                    >
                      <IconComponent className="w-5 h-5" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Links */}
          {quickLinks.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                {quickLinks.map((link, index) => (
                  <li key={index}>
                    <button
                      onClick={() => handleLinkClick(link.url)}
                      className="text-gray-400 hover:text-white transition-colors duration-200"
                    >
                      {link.text}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Legal Links */}
          {legalLinks.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                {legalLinks.map((link, index) => (
                  <li key={index}>
                    <button
                      onClick={() => handleLinkClick(link.url)}
                      className="text-gray-400 hover:text-white transition-colors duration-200"
                    >
                      {link.text}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Newsletter Signup */}
          {showNewsletterSignup && (
            <div>
              <h4 className="text-lg font-semibold mb-4">
                {newsletterTitle || 'Stay Updated'}
              </h4>
              <p className="text-gray-400 text-sm mb-4">
                {newsletterDescription || 'Subscribe to our newsletter'}
              </p>
              <form className="flex gap-2">
                <input
                  type="email"
                  placeholder="Your email"
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-gray-600 focus:outline-none text-white placeholder-gray-500"
                />
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg font-semibold text-white transition-all duration-300 hover:shadow-lg"
                  style={{ backgroundColor: styles.primaryColor }}
                >
                  Subscribe
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-gray-800 text-center text-gray-400 text-sm">
          <p>{copyrightText || `© ${new Date().getFullYear()} All rights reserved.`}</p>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
