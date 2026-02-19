// client/src/components/manager/builder/ContentTab.jsx

import React, { useState } from 'react';
import {
  Eye, EyeOff, GripVertical, ChevronDown, ChevronUp,
  Edit2, Trash2, Plus
} from 'lucide-react';

// Section editors
import HeroEditor from './editors/HeroEditor';
import AboutEditor from './editors/AboutEditor';
import ProgramsEditor from './editors/ProgramsEditor';
import TeachersEditor from './editors/TeachersEditor';
import TestimonialsEditor from './editors/TestimonialsEditor';
import FeaturesEditor from './editors/FeaturesEditor';
import PricingEditor from './editors/PricingEditor';
import FAQEditor from './editors/FAQEditor';
import ContactEditor from './editors/ContactEditor';
import FooterEditor from './editors/FooterEditor';
import { useLanguage } from '../../../context/LanguageContext';

const editorComponents = {
  hero: HeroEditor,
  about: AboutEditor,
  programs: ProgramsEditor,
  teachers: TeachersEditor,
  testimonials: TestimonialsEditor,
  features: FeaturesEditor,
  pricing: PricingEditor,
  faq: FAQEditor,
  contact: ContactEditor,
  footer: FooterEditor
};

const ContentTab = ({ config, updateConfig, showMessage, onRestoreDefaults, restoringDefaults }) => {
  const { t } = useLanguage();
  const [expandedSection, setExpandedSection] = useState(null);
  const [editingSection, setEditingSection] = useState(null);

  const sectionLabels = {
    hero: t.heroSection,
    about: t.aboutSection,
    programs: t.programsCourses,
    teachers: t.teachersSection,
    testimonials: t.testimonialsSection,
    features: t.featuresSection,
    pricing: t.pricingPlans,
    faq: t.faqSection,
    contact: t.contactSection,
    footer: t.footerSection
  };

  const sections = config?.sections || [];

  if (!sections.length) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-10 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">{t.noSectionsFound}</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          {t.landingPageNotInitialized}
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={onRestoreDefaults}
            disabled={!onRestoreDefaults || restoringDefaults}
            className="px-5 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            {restoringDefaults ? t.restoringTemplate : t.restoreDefaultTemplate}
          </button>
        </div>
        <p className="mt-4 text-sm text-gray-500">{t.restoreTemplateHelp}</p>
      </div>
    );
  }

  const toggleSectionEnabled = (index) => {
    const updated = [...sections];
    updated[index].enabled = !updated[index].enabled;
    updateConfig({ sections: updated });
  };

  const toggleExpand = (index) => {
    setExpandedSection(expandedSection === index ? null : index);
    setEditingSection(null);
  };

  const startEditing = (index) => {
    setEditingSection(index);
    setExpandedSection(index);
  };

  const updateSection = (index, data) => {
    const updated = [...sections];
    updated[index].data = { ...updated[index].data, ...data };
    updateConfig({ sections: updated });
  };

  const moveSection = (index, direction) => {
    const updated = [...sections];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= updated.length) return;

    // Swap
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];

    // Update order
    updated.forEach((section, idx) => {
      section.order = idx + 1;
    });

    updateConfig({ sections: updated });
    showMessage(t.sectionReordered, 'success');
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.pageContentTitle}</h2>
        <p className="text-gray-600 mb-6">
          {t.manageSectionsDescription}
        </p>

        {/* Sections List */}
        <div className="space-y-3">
          {sections.map((section, index) => {
            const EditorComponent = editorComponents[section.type];
            const isExpanded = expandedSection === index;
            const isEditing = editingSection === index;

            return (
              <div
                key={`${section.type}-${index}`}
                className={`
                  border rounded-lg transition-all
                  ${section.enabled ? 'bg-white' : 'bg-gray-50'}
                  ${isExpanded ? 'ring-2 ring-blue-500' : ''}
                `}
              >
                {/* Section Header */}
                <div className="flex items-center gap-3 p-4">
                  {/* Drag Handle */}
                  <div className="cursor-move text-gray-400 hover:text-gray-600">
                    <GripVertical className="w-5 h-5" />
                  </div>

                  {/* Enable/Disable Toggle */}
                  <button
                    onClick={() => toggleSectionEnabled(index)}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    {section.enabled ? (
                      <Eye className="w-5 h-5 text-blue-600" />
                    ) : (
                      <EyeOff className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {/* Section Info */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {sectionLabels[section.type] || section.type}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {section.enabled ? t.visibleStatus : t.hiddenStatus}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {/* Move Up/Down */}
                    <button
                      onClick={() => moveSection(index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveSection(index, 'down')}
                      disabled={index === sections.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={() => startEditing(index)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />{t.edit}</button>

                    {/* Expand/Collapse */}
                    <button
                      onClick={() => toggleExpand(index)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Content - Editor */}
                {isEditing && EditorComponent && (
                  <div className="border-t p-6 bg-gray-50">
                    <EditorComponent
                      data={section.data}
                      onChange={(data) => updateSection(index, data)}
                      showMessage={showMessage}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ContentTab;
