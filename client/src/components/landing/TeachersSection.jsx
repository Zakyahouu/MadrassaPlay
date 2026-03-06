// client/src/components/landing/TeachersSection.jsx

import React from 'react';
import { Star, Users } from 'lucide-react';

const TeachersSection = ({ data, theme }) => {
  const { title, subtitle, cards = [] } = data || {};

  const styles = {
    primaryColor: theme?.primaryColor || '#3B82F6',
    textColor: theme?.textColor || '#1F2937'
  };

  return (
    <section id="teachers" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2
            className="text-4xl font-bold mb-4"
            style={{ color: styles.textColor }}
          >
            {title || 'Meet Our Expert Teachers'}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {subtitle || 'Learn from the best in the industry'}
          </p>
        </div>

        {/* Teachers Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {cards.map((teacher, index) => (
            <div
              key={teacher.id || index}
              className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
            >
              {/* Teacher Photo */}
              {teacher.photo ? (
                <img
                  src={teacher.photo}
                  alt={teacher.name}
                  className="w-full h-64 object-cover"
                />
              ) : (
                <div
                  className="w-full h-64 flex items-center justify-center"
                  style={{ backgroundColor: `${styles.primaryColor}20` }}
                >
                  <div
                    className="w-32 h-32 rounded-full flex items-center justify-center text-4xl font-bold text-white"
                    style={{ backgroundColor: styles.primaryColor }}
                  >
                    {teacher.name ? teacher.name.charAt(0).toUpperCase() : 'T'}
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="p-6">
                <h3
                  className="text-xl font-bold mb-1"
                  style={{ color: styles.textColor }}
                >
                  {teacher.name}
                </h3>
                <p
                  className="text-sm font-semibold mb-3"
                  style={{ color: styles.primaryColor }}
                >
                  {teacher.title}
                </p>
                <p className="text-sm text-gray-600 mb-4">{teacher.bio}</p>

                {/* Subjects */}
                {teacher.subjects && teacher.subjects.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {teacher.subjects.map((subject, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: `${styles.primaryColor}15`,
                          color: styles.primaryColor
                        }}
                      >
                        {subject}
                      </span>
                    ))}
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center justify-between pt-4 border-t text-sm text-gray-600">
                  {teacher.rating && (
                    <div className="flex items-center gap-1">
                      <Star
                        className="w-4 h-4 fill-current"
                        style={{ color: '#F59E0B' }}
                      />
                      <span className="font-semibold">{teacher.rating}</span>
                    </div>
                  )}
                  {teacher.studentsCount && (
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{teacher.studentsCount} students</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeachersSection;
