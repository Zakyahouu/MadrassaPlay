// client/src/components/landing/ProgramsSection.jsx

import React from 'react';
import { CheckCircle, Clock, TrendingUp, DollarSign } from 'lucide-react';

const ProgramsSection = ({ data, theme }) => {
  const { title, subtitle, cards = [] } = data || {};

  const styles = {
    primaryColor: theme?.primaryColor || '#3B82F6',
    secondaryColor: theme?.secondaryColor || '#F97316',
    textColor: theme?.textColor || '#1F2937'
  };

  return (
    <section id="programs" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2
            className="text-4xl font-bold mb-4"
            style={{ color: styles.textColor }}
          >
            {title || 'Our Programs'}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {subtitle || 'Explore our comprehensive course offerings'}
          </p>
        </div>

        {/* Programs Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cards.map((program, index) => (
            <div
              key={program.id || index}
              className={`
                bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2
                ${program.highlight ? 'ring-2' : ''}
              `}
              style={{
                ringColor: program.highlight ? styles.secondaryColor : 'transparent'
              }}
            >
              {/* Program Image */}
              {program.image ? (
                <img
                  src={program.image}
                  alt={program.title}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div
                  className="w-full h-48 flex items-center justify-center"
                  style={{ backgroundColor: `${styles.primaryColor}20` }}
                >
                  <span className="text-gray-400">Program Image</span>
                </div>
              )}

              {/* Highlight Badge */}
              {program.highlight && (
                <div
                  className="absolute top-4 right-4 px-3 py-1 rounded-full text-white text-xs font-semibold"
                  style={{ backgroundColor: styles.secondaryColor }}
                >
                  Popular
                </div>
              )}

              {/* Content */}
              <div className="p-6">
                <h3
                  className="text-2xl font-bold mb-2"
                  style={{ color: styles.textColor }}
                >
                  {program.title}
                </h3>
                <p className="text-gray-600 mb-4">{program.description}</p>

                {/* Meta Info */}
                <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                  {program.duration && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{program.duration}</span>
                    </div>
                  )}
                  {program.level && (
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      <span>{program.level}</span>
                    </div>
                  )}
                </div>

                {/* Features List */}
                {program.features && program.features.length > 0 && (
                  <ul className="space-y-2 mb-6">
                    {program.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                        <CheckCircle
                          className="w-4 h-4 mt-0.5 flex-shrink-0"
                          style={{ color: styles.primaryColor }}
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Price & CTA */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    {program.price && (
                      <div
                        className="text-2xl font-bold"
                        style={{ color: styles.primaryColor }}
                      >
                        {program.price}
                      </div>
                    )}
                  </div>
                  <button
                    className="px-6 py-2 rounded-lg font-semibold text-white transition-all duration-300 hover:shadow-lg"
                    style={{ backgroundColor: styles.primaryColor }}
                  >
                    Enroll Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProgramsSection;
