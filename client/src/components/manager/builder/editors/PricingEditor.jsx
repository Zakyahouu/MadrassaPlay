// client/src/components/manager/builder/editors/PricingEditor.jsx

import React from 'react';
import { Plus, Trash2, CheckCircle } from 'lucide-react';

const PricingEditor = ({ data, onChange, showMessage }) => {
  const plans = data?.plans || [];

  const handlePlanChange = (index, field, value) => {
    const updatedPlans = [...plans];
    updatedPlans[index] = { ...updatedPlans[index], [field]: value };
    onChange({ ...data, plans: updatedPlans });
  };

  const handleFeatureChange = (planIndex, featureIndex, value) => {
    const updatedPlans = [...plans];
    updatedPlans[planIndex].features[featureIndex] = value;
    onChange({ ...data, plans: updatedPlans });
  };

  const addPlan = () => {
    onChange({
      ...data,
      plans: [
        ...plans,
        {
          name: 'New Plan',
          price: '99',
          period: 'month',
          description: 'Plan description',
          features: ['Feature 1', 'Feature 2', 'Feature 3'],
          recommended: false
        }
      ]
    });
    showMessage('Plan added', 'success');
  };

  const removePlan = (index) => {
    const updatedPlans = plans.filter((_, i) => i !== index);
    onChange({ ...data, plans: updatedPlans });
    showMessage('Plan removed', 'success');
  };

  const addFeature = (planIndex) => {
    const updatedPlans = [...plans];
    updatedPlans[planIndex].features.push('New Feature');
    onChange({ ...data, plans: updatedPlans });
  };

  const removeFeature = (planIndex, featureIndex) => {
    const updatedPlans = [...plans];
    updatedPlans[planIndex].features = updatedPlans[planIndex].features.filter((_, i) => i !== featureIndex);
    onChange({ ...data, plans: updatedPlans });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Pricing Plans</h3>
          <p className="text-sm text-gray-600">Manage your pricing tiers</p>
        </div>
        <button
          onClick={addPlan}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Plan
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan, planIndex) => (
          <div key={planIndex} className="border rounded-lg p-6 space-y-4 bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900">Plan {planIndex + 1}</h4>
              <button
                onClick={() => removePlan(planIndex)}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm mb-3">
                <input
                  type="checkbox"
                  checked={plan.recommended || false}
                  onChange={(e) => handlePlanChange(planIndex, 'recommended', e.target.checked)}
                  className="rounded"
                />
                <CheckCircle className="w-4 h-4" />
                Mark as Recommended
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plan Name
              </label>
              <input
                type="text"
                value={plan.name}
                onChange={(e) => handlePlanChange(planIndex, 'name', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price ($)
                </label>
                <input
                  type="text"
                  value={plan.price}
                  onChange={(e) => handlePlanChange(planIndex, 'price', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Period
                </label>
                <select
                  value={plan.period}
                  onChange={(e) => handlePlanChange(planIndex, 'period', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="month">month</option>
                  <option value="year">year</option>
                  <option value="week">week</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={plan.description}
                onChange={(e) => handlePlanChange(planIndex, 'description', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Features
                </label>
                <button
                  onClick={() => addFeature(planIndex)}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  + Add
                </button>
              </div>
              <div className="space-y-2">
                {plan.features?.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => handleFeatureChange(planIndex, featureIndex, e.target.value)}
                      className="flex-1 px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => removeFeature(planIndex, featureIndex)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {plans.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
          <p className="text-gray-500">No pricing plans yet. Click "Add Plan" to get started.</p>
        </div>
      )}
    </div>
  );
};

export default PricingEditor;
