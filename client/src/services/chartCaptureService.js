import html2canvas from 'html2canvas';

class ChartCaptureService {
  constructor() {
    this.chartElements = new Map();
  }

  // Register a chart element for capture
  registerChart(chartId, element) {
    this.chartElements.set(chartId, element);
  }

  // Capture a specific chart as image
  async captureChart(chartId, options = {}) {
    const element = this.chartElements.get(chartId);
    if (!element) {
      throw new Error(`Chart with ID ${chartId} not found`);
    }

    const defaultOptions = {
      backgroundColor: '#ffffff',
      scale: 2, // Higher resolution
      useCORS: true,
      allowTaint: true,
      width: element.offsetWidth,
      height: element.offsetHeight,
      ...options
    };

    try {
      const canvas = await html2canvas(element, defaultOptions);
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error(`Error capturing chart ${chartId}:`, error);
      throw error;
    }
  }

  // Capture multiple charts
  async captureMultipleCharts(chartIds, options = {}) {
    const results = {};
    
    for (const chartId of chartIds) {
      try {
        results[chartId] = await this.captureChart(chartId, options);
      } catch (error) {
        console.error(`Failed to capture chart ${chartId}:`, error);
        results[chartId] = null;
      }
    }

    return results;
  }

  // Capture all registered charts
  async captureAllCharts(options = {}) {
    const chartIds = Array.from(this.chartElements.keys());
    return await this.captureMultipleCharts(chartIds, options);
  }

  // Unregister a chart
  unregisterChart(chartId) {
    this.chartElements.delete(chartId);
  }

  // Clear all registered charts
  clearAllCharts() {
    this.chartElements.clear();
  }
}

export default new ChartCaptureService();
