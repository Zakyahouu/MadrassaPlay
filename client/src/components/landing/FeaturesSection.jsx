// client/src/components/landing/FeaturesSection.jsx

import React from 'react';
import { 
  Video, Clock, Award, Headphones, BookOpen, 
  Trophy, Users, Shield, CheckCircle, Star 
} from 'lucide-react';

const iconMap = {
  video: Video,
  clock: Clock,
  certificate: Award,
  support: Headphones,
  assignment: BookOpen,
  trophy: Trophy,
  users: Users,
  shield: Shield,
  check: CheckCircle,
  star: Star
};

const FeaturesSection = ({ data, theme }) => {
  const { title, subtitle, items = [] } = data || {};

  const styles = {
    primaryColor: theme?.primaryColor || '#3B82F6',
    textColor: theme?.textColor || '#1F2937'
  };

  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2
            className="text-4xl font-bold mb-4"
            style={{ color: styles.textColor }}
          >
            {title || 'Why Choose Us'}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {subtitle || 'Everything you need for online learning success'}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {items.map((feature, index) => {
            const IconComponent = iconMap[feature.icon] || CheckCircle;
            
            return (
              <div
                key={index}
                className="group p-6 rounded-xl transition-all duration-300 hover:shadow-xl hover:-translate-y-2"
                style={{ backgroundColor: `${styles.primaryColor}05` }}
              >
                {/* Icon */}
                <div
                  className="w-14 h-14 rounded-lg flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
                  style={{ backgroundColor: `${styles.primaryColor}20` }}
                >
                  <IconComponent
                    className="w-7 h-7"
                    style={{ color: styles.primaryColor }}
                  />
                </div>

                {/* Title */}
                <h3
                  className="text-xl font-bold mb-3"
                  style={{ color: styles.textColor }}
                >
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
