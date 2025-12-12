// client/src/components/manager/builder/editors/TestimonialsEditor.jsx

import React from 'react';
import { Plus, Trash2, Star } from 'lucide-react';

const TestimonialsEditor = ({ data, onChange, showMessage }) => {
  const testimonials = data?.testimonials || [];

  const handleTestimonialChange = (index, field, value) => {
    const updatedTestimonials = [...testimonials];
    updatedTestimonials[index] = { ...updatedTestimonials[index], [field]: value };
    onChange({ ...data, testimonials: updatedTestimonials });
  };

  const addTestimonial = () => {
    onChange({
      ...data,
      testimonials: [
        ...testimonials,
        {
          name: 'Student Name',
          course: 'Course Name',
          rating: 5,
          text: 'Great experience! The teaching was excellent.',
          photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=150&h=150'
        }
      ]
    });
    showMessage('Testimonial added', 'success');
  };

  const removeTestimonial = (index) => {
    const updatedTestimonials = testimonials.filter((_, i) => i !== index);
    onChange({ ...data, testimonials: updatedTestimonials });
    showMessage('Testimonial removed', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Testimonials</h3>
          <p className="text-sm text-gray-600">Manage student testimonials</p>
        </div>
        <button
          onClick={addTestimonial}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Testimonial
        </button>
      </div>

      {testimonials.map((testimonial, index) => (
        <div key={index} className="border rounded-lg p-6 space-y-4 bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900">Testimonial {index + 1}</h4>
            <button
              onClick={() => removeTestimonial(index)}
              className="p-2 text-red-600 hover:bg-red-50 rounded"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student Name
              </label>
              <input
                type="text"
                value={testimonial.name}
                onChange={(e) => handleTestimonialChange(index, 'name', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course/Program
              </label>
              <input
                type="text"
                value={testimonial.course}
                onChange={(e) => handleTestimonialChange(index, 'course', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rating
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleTestimonialChange(index, 'rating', star)}
                  className="p-1"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= testimonial.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-600">{testimonial.rating}/5</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Testimonial Text
            </label>
            <textarea
              value={testimonial.text}
              onChange={(e) => handleTestimonialChange(index, 'text', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Photo URL
            </label>
            <input
              type="text"
              value={testimonial.photo}
              onChange={(e) => handleTestimonialChange(index, 'photo', e.target.value)}
              placeholder="https://example.com/photo.jpg"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Use the Media tab to upload images</p>
          </div>
        </div>
      ))}

      {testimonials.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
          <p className="text-gray-500">No testimonials yet. Click "Add Testimonial" to get started.</p>
        </div>
      )}
    </div>
  );
};

export default TestimonialsEditor;
