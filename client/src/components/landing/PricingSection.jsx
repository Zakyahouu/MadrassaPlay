// client/src/components/landing/PricingSection.jsx

import React from 'react';
import { Check } from 'lucide-react';

const PricingSection = ({ data, theme }) => {
  const { title, subtitle, plans = [] } = data || {};

  const styles = {
    primaryColor: theme?.primaryColor || '#3B82F6',
    secondaryColor: theme?.secondaryColor || '#F97316',
    textColor: theme?.textColor || '#1F2937'
  };

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

  return (
    <section id="pricing" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2
            className="text-4xl font-bold mb-4"
            style={{ color: styles.textColor }}
          >
            {title || 'Choose Your Plan'}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {subtitle || 'Flexible pricing for every student'}
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={plan.id || index}
              className={`
                bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300
                ${plan.highlighted 
                  ? 'ring-2 transform scale-105 md:scale-110 z-10' 
                  : 'hover:shadow-xl hover:-translate-y-2'
                }
              `}
              style={{
                ringColor: plan.highlighted ? styles.secondaryColor : 'transparent'
              }}
            >
              {/* Highlight Badge */}
              {plan.highlighted && (
                <div
                  className="py-2 text-center text-white font-semibold text-sm"
                  style={{ backgroundColor: styles.secondaryColor }}
                >
                  Most Popular
                </div>
              )}

              {/* Content */}
              <div className="p-8">
                {/* Plan Name */}
                <h3
                  className="text-2xl font-bold mb-2"
                  style={{ color: styles.textColor }}
                >
                  {plan.name}
                </h3>

                {/* Description */}
                {plan.description && (
                  <p className="text-gray-600 text-sm mb-6">{plan.description}</p>
                )}

                {/* Price */}
                <div className="mb-6">
                  <span
                    className="text-5xl font-bold"
                    style={{ color: styles.primaryColor }}
                  >
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-gray-500 text-lg">/{plan.period}</span>
                  )}
                </div>

                {/* Features List */}
                <ul className="space-y-4 mb-8">
                  {plan.features && plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check
                        className="w-5 h-5 flex-shrink-0 mt-0.5"
                        style={{ color: styles.primaryColor }}
                      />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => handleCtaClick(plan.ctaLink || '#contact')}
                  className={`
                    w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 hover:shadow-lg
                    ${plan.highlighted 
                      ? 'text-white' 
                      : 'border-2'
                    }
                  `}
                  style={{
                    backgroundColor: plan.highlighted ? styles.primaryColor : 'transparent',
                    borderColor: plan.highlighted ? 'transparent' : styles.primaryColor,
                    color: plan.highlighted ? 'white' : styles.primaryColor
                  }}
                >
                  {plan.ctaText || 'Get Started'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
