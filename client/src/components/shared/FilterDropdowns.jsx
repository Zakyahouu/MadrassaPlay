// client/src/components/shared/FilterDropdowns.jsx
import React from 'react';
import { Filter, X } from 'lucide-react';

const FilterDropdowns = ({ 
  categories = [], 
  tags = [], 
  selectedCategory, 
  selectedTag, 
  onCategoryChange, 
  onTagChange, 
  onClearFilters 
}) => {
  const hasActiveFilters = selectedCategory || selectedTag;

  return (
    <div className="bg-white p-4 rounded-lg border border-slate-200 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-slate-500" />
          <h3 className="text-lg font-medium text-slate-900">Filters</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center space-x-1 text-sm text-slate-500 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
            <span>Clear all</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Category Filter */}
        <div>
          <label htmlFor="category-filter" className="block text-sm font-medium text-slate-700 mb-1">
            Filter by Category
          </label>
          <select
            id="category-filter"
            value={selectedCategory || ''}
            onChange={(e) => onCategoryChange(e.target.value || null)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tag Filter */}
        <div>
          <label htmlFor="tag-filter" className="block text-sm font-medium text-slate-700 mb-1">
            Filter by Tag
          </label>
          <select
            id="tag-filter"
            value={selectedTag || ''}
            onChange={(e) => onTagChange(e.target.value || null)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
          >
            <option value="">All Tags</option>
            {tags.map((tag) => (
              <option key={tag._id} value={tag._id}>
                {tag.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="flex flex-wrap gap-2">
            {selectedCategory && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700">
                Category: {categories.find(c => c._id === selectedCategory)?.name}
                <button
                  onClick={() => onCategoryChange(null)}
                  className="ml-2 text-slate-500 hover:text-slate-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedTag && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700">
                Tag: {tags.find(t => t._id === selectedTag)?.name}
                <button
                  onClick={() => onTagChange(null)}
                  className="ml-2 text-slate-500 hover:text-slate-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterDropdowns;

