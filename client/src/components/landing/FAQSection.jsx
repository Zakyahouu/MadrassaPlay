// client/src/components/landing/FAQSection.jsx

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQSection = ({ data, theme }) => {
  const { title, subtitle, items = [] } = data || {};
  const [openIndex, setOpenIndex] = useState(null);

  const styles = {
    primaryColor: theme?.primaryColor || '#3B82F6',
    textColor: theme?.textColor || '#1F2937'
  };

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2
            className="text-4xl font-bold mb-4"
            style={{ color: styles.textColor }}
          >
            {title || 'Frequently Asked Questions'}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {subtitle || 'Get answers to common questions'}
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {items.map((faq, index) => (
            <div
              key={faq.id || index}
              className="border rounded-lg overflow-hidden transition-all duration-300 hover:shadow-md"
            >
              {/* Question */}
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-center justify-between p-6 text-left bg-white hover:bg-gray-50 transition-colors duration-200"
              >
                <h3
                  className="text-lg font-semibold pr-4"
                  style={{ color: styles.textColor }}
                >
                  {faq.question}
                </h3>
                <ChevronDown
                  className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${
                    openIndex === index ? 'transform rotate-180' : ''
                  }`}
                  style={{ color: styles.primaryColor }}
                />
              </button>

              {/* Answer */}
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <div className="p-6 pt-0 text-gray-600 leading-relaxed">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
