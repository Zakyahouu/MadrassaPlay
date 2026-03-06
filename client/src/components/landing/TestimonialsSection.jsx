// client/src/components/landing/TestimonialsSection.jsx

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react';

const TestimonialsSection = ({ data, theme }) => {
  const { title, subtitle, cards = [] } = data || {};
  const [currentIndex, setCurrentIndex] = useState(0);

  const styles = {
    primaryColor: theme?.primaryColor || '#3B82F6',
    secondaryColor: theme?.secondaryColor || '#F97316',
    textColor: theme?.textColor || '#1F2937'
  };

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  if (!cards || cards.length === 0) {
    return null;
  }

  const currentTestimonial = cards[currentIndex];

  return (
    <section id="testimonials" className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2
            className="text-4xl font-bold mb-4"
            style={{ color: styles.textColor }}
          >
            {title || 'What Our Students Say'}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {subtitle || 'Real feedback from real students'}
          </p>
        </div>

        {/* Carousel */}
        <div className="relative">
          {/* Main Testimonial Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 relative overflow-hidden">
            {/* Quote Icon */}
            <Quote
              className="absolute top-4 right-4 w-16 h-16 opacity-10"
              style={{ color: styles.primaryColor }}
            />

            <div className="relative z-10">
              {/* Student Info */}
              <div className="flex items-center gap-4 mb-6">
                {currentTestimonial.photo ? (
                  <img
                    src={currentTestimonial.photo}
                    alt={currentTestimonial.studentName}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                    style={{ backgroundColor: styles.primaryColor }}
                  >
                    {currentTestimonial.studentName?.charAt(0).toUpperCase() || 'S'}
                  </div>
                )}

                <div>
                  <h3
                    className="text-xl font-bold"
                    style={{ color: styles.textColor }}
                  >
                    {currentTestimonial.studentName}
                  </h3>
                  {currentTestimonial.course && (
                    <p className="text-sm text-gray-500">{currentTestimonial.course}</p>
                  )}
                  {/* Rating */}
                  {currentTestimonial.rating && (
                    <div className="flex items-center gap-1 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < currentTestimonial.rating
                              ? 'fill-current text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Quote */}
              <p className="text-lg md:text-xl text-gray-700 leading-relaxed italic">
                "{currentTestimonial.quote}"
              </p>
            </div>
          </div>

          {/* Navigation Arrows */}
          {cards.length > 1 && (
            <>
              <button
                onClick={prevTestimonial}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
                style={{ color: styles.primaryColor }}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextTestimonial}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
                style={{ color: styles.primaryColor }}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Dots Indicator */}
          {cards.length > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {cards.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentIndex ? 'w-8' : ''
                  }`}
                  style={{
                    backgroundColor:
                      index === currentIndex ? styles.primaryColor : '#D1D5DB'
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Thumbnail Grid (optional - shows all testimonials) */}
        {cards.length > 3 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
            {cards.map((testimonial, index) => (
              <div
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`
                  cursor-pointer p-4 rounded-lg transition-all duration-300
                  ${index === currentIndex ? 'ring-2 shadow-lg' : 'hover:shadow-md'}
                `}
                style={{
                  backgroundColor: index === currentIndex ? `${styles.primaryColor}10` : 'white',
                  ringColor: styles.primaryColor
                }}
              >
                <div className="flex items-center gap-2">
                  {testimonial.photo ? (
                    <img
                      src={testimonial.photo}
                      alt={testimonial.studentName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                      style={{ backgroundColor: styles.primaryColor }}
                    >
                      {testimonial.studentName?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{testimonial.studentName}</p>
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < testimonial.rating
                              ? 'fill-current text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default TestimonialsSection;
