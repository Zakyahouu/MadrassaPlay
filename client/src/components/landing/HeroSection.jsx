// client/src/components/landing/HeroSection.jsx

import React from 'react';
import { ChevronDown } from 'lucide-react';

const HeroSection = ({ data, theme }) => {
  const {
    title,
    subtitle,
    ctaButtons = [],
    backgroundImage,
    overlayOpacity = 0.5,
    showScrollIndicator = true
  } = data || {};

  const handleCtaClick = (link) => {
    if (link.startsWith('#')) {
      const element = document.querySelector(link);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      window.location.href = link;
    }
  };

  const styles = {
    primaryColor: theme?.primaryColor || '#3B82F6',
    secondaryColor: theme?.secondaryColor || '#F97316',
    textColor: theme?.textColor || '#1F2937'
  };

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{
        backgroundColor: backgroundImage ? 'transparent' : styles.primaryColor
      }}
    >
      {/* Background Image */}
      {backgroundImage && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          />
          <div
            className="absolute inset-0 bg-black"
            style={{ opacity: overlayOpacity }}
          />
        </>
      )}

      {/* Animated Background Gradient */}
      {!backgroundImage && (
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute -inset-[10px] opacity-50"
            style={{
              background: `linear-gradient(45deg, ${styles.primaryColor}, ${styles.secondaryColor})`,
              animation: 'gradient 15s ease infinite',
              backgroundSize: '400% 400%'
            }}
          />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Title with animation */}
        <h1
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 animate-fade-in-up"
          style={{ animationDelay: '0.2s' }}
        >
          {title || 'Welcome to Excellence'}
        </h1>

        {/* Subtitle */}
        <p
          className="text-lg sm:text-xl md:text-2xl text-white/90 mb-10 max-w-3xl mx-auto animate-fade-in-up"
          style={{ animationDelay: '0.4s' }}
        >
          {subtitle || 'Transform your future with expert-led courses'}
        </p>

        {/* CTA Buttons */}
        <div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up"
          style={{ animationDelay: '0.6s' }}
        >
          {ctaButtons.map((button, index) => (
            <button
              key={index}
              onClick={() => handleCtaClick(button.link)}
              className={`
                px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl
                ${
                  button.variant === 'primary'
                    ? 'bg-white text-gray-900 hover:bg-gray-100'
                    : 'bg-transparent border-2 border-white text-white hover:bg-white hover:text-gray-900'
                }
              `}
            >
              {button.text}
            </button>
          ))}
        </div>
      </div>

      {/* Scroll Indicator */}
      {showScrollIndicator && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-8 h-8 text-white/70" />
        </div>
      )}

      <style jsx>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </section>
  );
};

export default HeroSection;
