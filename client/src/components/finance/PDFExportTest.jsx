import React, { useState } from 'react';
import { FileText, Download } from 'lucide-react';

const PDFExportTest = () => {
  const [isExporting, setIsExporting] = useState(false);

  const testPDFExport = async () => {
    try {
      setIsExporting(true);
      
      // Test data
      const testData = {
        monthData: {
          monthName: 'December',
          year: 2024,
          income: 50000,
          expenses: 30000,
          net: 20000,
          breakdown: {
            studentIncome: 45000,
            manualIncome: 5000,
            manualExpenses: 10000,
            teacherEarnings: 15000,
            employeeSalaries: 5000
          }
        },
        teacherPayouts: [
          {
            teacherName: 'John Doe',
            classCount: 3,
            totalStudents: 45,
            totalCalculated: 15000,
            totalPaid: 10000,
            totalRemaining: 5000
          },
          {
            teacherName: 'Jane Smith',
            classCount: 2,
            totalStudents: 30,
            totalCalculated: 10000,
            totalPaid: 10000,
            totalRemaining: 0
          }
        ],
        debtData: {
          totalDebt: 5000,
          newDebt: 2000,
          studentCount: 10,
          avgDebtPerStudent: 500
        },
        expenseCategories: [
          { _id: 'Utilities', totalAmount: 5000, transactionCount: 3 },
          { _id: 'Supplies', totalAmount: 2000, transactionCount: 5 },
          { _id: 'Maintenance', totalAmount: 3000, transactionCount: 2 }
        ],
        employeeSalaries: {
          summary: {
            employeeCount: 5,
            totalCalculated: 25000,
            totalPaid: 20000,
            totalRemaining: 5000
          },
          byRole: [
            { _id: 'Manager', employeeCount: 1, totalCalculated: 10000, totalPaid: 10000, totalRemaining: 0 },
            { _id: 'Staff', employeeCount: 4, totalCalculated: 15000, totalPaid: 10000, totalRemaining: 5000 }
          ]
        },
        schoolName: 'Test School'
      };

      // Try enhanced PDF export first, fallback to HTML if it fails
      try {
        const { default: enhancedPdfExportService } = await import('../../services/enhancedPdfExportService');
        await enhancedPdfExportService.exportAnalyticsToPDF(testData, [], 'test-financial-report.pdf');
      } catch (enhancedError) {
        console.warn('Enhanced PDF export failed, using fallback:', enhancedError);
        const { default: fallbackPdfExportService } = await import('../../services/fallbackPdfExportService');
        await fallbackPdfExportService.exportAnalyticsToPDF(testData, [], 'test-financial-report.pdf');
      }
      
    } catch (error) {
      console.error('Error generating test PDF:', error);
      alert('Error generating test PDF: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">PDF Export Test</h3>
      <p className="text-gray-600 mb-4">
        Click the button below to test the PDF export functionality with sample data.
      </p>
      <button
        onClick={testPDFExport}
        disabled={isExporting}
        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isExporting ? (
          <Download className="w-4 h-4 animate-spin" />
        ) : (
          <FileText className="w-4 h-4" />
        )}
        <span>{isExporting ? 'Generating Test PDF...' : 'Generate Test PDF'}</span>
      </button>
    </div>
  );
};

export default PDFExportTest;
