// client/src/components/manager/builder/editors/FAQEditor.jsx

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

const FAQEditor = ({ data, onChange, showMessage }) => {
  const faqs = data?.faqs || [];

  const handleFAQChange = (index, field, value) => {
    const updatedFAQs = [...faqs];
    updatedFAQs[index] = { ...updatedFAQs[index], [field]: value };
    onChange({ ...data, faqs: updatedFAQs });
  };

  const addFAQ = () => {
    onChange({
      ...data,
      faqs: [
        ...faqs,
        {
          question: 'New Question?',
          answer: 'Answer goes here'
        }
      ]
    });
    showMessage('FAQ added', 'success');
  };

  const removeFAQ = (index) => {
    const updatedFAQs = faqs.filter((_, i) => i !== index);
    onChange({ ...data, faqs: updatedFAQs });
    showMessage('FAQ removed', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">FAQ</h3>
          <p className="text-sm text-gray-600">Manage frequently asked questions</p>
        </div>
        <button
          onClick={addFAQ}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add FAQ
        </button>
      </div>

      {faqs.map((faq, index) => (
        <div key={index} className="border rounded-lg p-6 space-y-4 bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900">FAQ {index + 1}</h4>
            <button
              onClick={() => removeFAQ(index)}
              className="p-2 text-red-600 hover:bg-red-50 rounded"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Question
            </label>
            <input
              type="text"
              value={faq.question}
              onChange={(e) => handleFAQChange(index, 'question', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="What is your question?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Answer
            </label>
            <textarea
              value={faq.answer}
              onChange={(e) => handleFAQChange(index, 'answer', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Answer goes here..."
            />
          </div>
        </div>
      ))}

      {faqs.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
          <p className="text-gray-500">No FAQs yet. Click "Add FAQ" to get started.</p>
        </div>
      )}
    </div>
  );
};

export default FAQEditor;
