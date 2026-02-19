// client/src/components/landing/AboutSection.jsx

import React from 'react';

import { useLanguage } from '../../context/LanguageContext';

const AboutSection = ({ data, theme }) => {
  const { t } = useLanguage();
  const { title, description, image, stats = [] } = data || {};

  const styles = {
    primaryColor: theme?.primaryColor || '#3B82F6',
    textColor: theme?.textColor || '#1F2937'
  };

  return (
    <section id="about" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Image */}
          <div className="order-2 md:order-1">
            {image ? (
              <img
                src={image}
                alt={t.aboutOurSchool}
                className="rounded-lg shadow-2xl w-full h-auto object-cover"
              />
            ) : (
              <div
                className="rounded-lg shadow-2xl w-full h-96 flex items-center justify-center"
                style={{ backgroundColor: `${styles.primaryColor}20` }}
              >
                <span className="text-gray-400 text-lg">{t.aboutImage}</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="order-1 md:order-2">
            <h2
              className="text-4xl font-bold mb-6"
              style={{ color: styles.textColor }}
            >
              {title || t.aboutOurSchool}
            </h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              {description || t.aboutDefaultDesc}
            </p>

            {/* Stats Grid */}
            {stats.length > 0 && (
              <div className="grid grid-cols-2 gap-6">
                {stats.map((stat, index) => (
                  <div
                    key={index}
                    className="text-center p-4 rounded-lg"
                    style={{ backgroundColor: `${styles.primaryColor}10` }}
                  >
                    <div
                      className="text-3xl font-bold mb-2"
                      style={{ color: styles.primaryColor }}
                    >
                      {stat.number}
                    </div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
