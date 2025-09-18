import jsPDF from 'jspdf';
import chartCaptureService from './chartCaptureService';

class EnhancedPDFExportService {
  constructor() {
    this.doc = null;
    this.pageWidth = 210; // A4 width in mm
    this.pageHeight = 297; // A4 height in mm
    this.margin = 20;
    this.currentY = 0;
    this.lineHeight = 6;
  }

  // Initialize new PDF document
  initDocument(title, schoolData) {
    this.doc = new jsPDF();
    this.currentY = this.margin;
    
    // Add header
    this.addHeader(title, schoolData);
    this.addPageBreak();
  }

  // Add header with title and school info
  addHeader(title, schoolData) {
    // Add logo
    try {
      // Add logo image (you may need to convert Logo.jpg to base64 or use a different method)
      this.doc.addImage('/Logo.jpg', 'JPEG', this.margin, this.currentY, 30, 20);
      this.currentY += 25;
    } catch (error) {
      console.log('Logo not found, using text fallback');
      // Fallback to text if logo not found
      this.doc.setFontSize(20);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(schoolData?.name || 'Skill Snap', this.margin, this.currentY);
      this.currentY += 8;
    }

    // School Information Section
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(schoolData?.name || 'Skill Snap', this.margin, this.currentY);
    this.currentY += 6;

    // School contact information
    if (schoolData?.contact) {
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      if (schoolData.contact.address) {
        this.doc.text(`Adresse : ${schoolData.contact.address}`, this.margin, this.currentY);
        this.currentY += 4;
      }
      if (schoolData.contact.phone) {
        this.doc.text(`Téléphone : ${schoolData.contact.phone}`, this.margin, this.currentY);
        this.currentY += 4;
      }
      if (schoolData.contact.email) {
        this.doc.text(`E-mail : ${schoolData.contact.email}`, this.margin, this.currentY);
        this.currentY += 4;
      }
    }

    // Report title
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin, this.currentY);
    this.currentY += 8;

    // Report details
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Généré le : ${schoolData?.reportDate || new Date().toLocaleDateString()} à ${schoolData?.reportTime || new Date().toLocaleTimeString()}`, this.margin, this.currentY);
    this.currentY += 4;
    this.doc.text(`Généré par : ${schoolData?.generatedBy || 'Utilisateur'} (${schoolData?.userRole || 'Utilisateur'})`, this.margin, this.currentY);
    this.currentY += 8;

    // Add line separator
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 5;
  }

  // Add page break
  addPageBreak() {
    this.doc.addPage();
    this.currentY = this.margin;
  }

  // Add section title
  addSectionTitle(title) {
    if (this.currentY > this.pageHeight - 30) {
      this.addPageBreak();
    }

    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin, this.currentY);
    this.currentY += 8;
  }

  // Add image (chart)
  async addImage(imageDataUrl, title, width = 170, height = 100) {
    if (this.currentY + height > this.pageHeight - 20) {
      this.addPageBreak();
    }

    if (title) {
      this.addSectionTitle(title);
    }

    try {
      // Add image
      this.doc.addImage(imageDataUrl, 'PNG', this.margin, this.currentY, width, height);
      this.currentY += height + 10;
    } catch (error) {
      console.error('Error adding image to PDF:', error);
      // Add placeholder if image fails
      this.addImagePlaceholder(title || 'Chart', width, height);
    }
  }

  // Add image placeholder
  addImagePlaceholder(title, width = 170, height = 100) {
    if (this.currentY + height > this.pageHeight - 20) {
      this.addPageBreak();
    }

    // Add a placeholder rectangle for the chart
    this.doc.setDrawColor(200, 200, 200);
    this.doc.setFillColor(245, 245, 245);
    this.doc.rect(this.margin, this.currentY, width, height, 'FD');
    
    // Add text in the center
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(100, 100, 100);
    this.doc.text(title, this.pageWidth / 2, this.currentY + height / 2, { align: 'center' });
    
    this.currentY += height + 10;
  }

  // Add financial summary table
  addFinancialSummary(data) {
    if (this.currentY > this.pageHeight - 50) {
      this.addPageBreak();
    }

    this.addSectionTitle('Financial Summary');

    const tableData = [
      ['Metric', 'Amount (DZD)'],
      ['Total Income', this.formatCurrency(data.income || 0)],
      ['Total Expenses', this.formatCurrency(data.expenses || 0)],
      ['Net Balance', this.formatCurrency(data.net || 0)],
      ['Total Debt', this.formatCurrency(data.debt || 0)]
    ];

    this.addTable(tableData, [60, 40]);
  }

  // Add income breakdown
  addIncomeBreakdown(breakdown) {
    if (this.currentY > this.pageHeight - 50) {
      this.addPageBreak();
    }

    this.addSectionTitle('Income Breakdown');

    const tableData = [
      ['Source', 'Amount (DZD)'],
      ['Student Payments', this.formatCurrency(breakdown?.studentIncome || 0)],
      ['Manual Income', this.formatCurrency(breakdown?.manualIncome || 0)]
    ];

    this.addTable(tableData, [60, 40]);
  }

  // Add expense breakdown
  addExpenseBreakdown(breakdown) {
    if (this.currentY > this.pageHeight - 50) {
      this.addPageBreak();
    }

    this.addSectionTitle('Expense Breakdown');

    const tableData = [
      ['Category', 'Amount (DZD)'],
      ['Manual Expenses', this.formatCurrency(breakdown?.manualExpenses || 0)],
      ['Teacher Earnings', this.formatCurrency(breakdown?.teacherEarnings || 0)],
      ['Employee Salaries', this.formatCurrency(breakdown?.employeeSalaries || 0)]
    ];

    this.addTable(tableData, [60, 40]);
  }

  // Add teacher payouts table
  addTeacherPayouts(teachers) {
    if (this.currentY > this.pageHeight - 80) {
      this.addPageBreak();
    }

    this.addSectionTitle('Teacher Payouts');

    const tableData = [
      ['Teacher', 'Classes', 'Students', 'Calculated', 'Paid', 'Remaining']
    ];

    teachers.forEach(teacher => {
      tableData.push([
        teacher.teacherName,
        teacher.classCount.toString(),
        teacher.totalStudents.toString(),
        this.formatCurrency(teacher.totalCalculated),
        this.formatCurrency(teacher.totalPaid),
        this.formatCurrency(teacher.totalRemaining)
      ]);
    });

    this.addTable(tableData, [30, 12, 12, 18, 18, 18]);
  }

  // Add expense categories table
  addExpenseCategories(categories) {
    if (this.currentY > this.pageHeight - 80) {
      this.addPageBreak();
    }

    this.addSectionTitle('Expense Categories');

    const tableData = [
      ['Category', 'Amount (DZD)', 'Transactions', 'Percentage']
    ];

    const totalExpenses = categories.reduce((sum, cat) => sum + cat.totalAmount, 0);

    categories.forEach(category => {
      const percentage = totalExpenses > 0 ? ((category.totalAmount / totalExpenses) * 100).toFixed(1) : 0;
      tableData.push([
        category._id,
        this.formatCurrency(category.totalAmount),
        category.transactionCount.toString(),
        `${percentage}%`
      ]);
    });

    this.addTable(tableData, [40, 25, 15, 20]);
  }

  // Add debt analysis
  addDebtAnalysis(debtData) {
    if (this.currentY > this.pageHeight - 50) {
      this.addPageBreak();
    }

    this.addSectionTitle('Debt Analysis');

    const tableData = [
      ['Metric', 'Value'],
      ['Total Debt', this.formatCurrency(debtData?.totalDebt || 0)],
      ['New Debt This Month', this.formatCurrency(debtData?.newDebt || 0)],
      ['Students with Debt', (debtData?.studentCount || 0).toString()],
      ['Average Debt per Student', this.formatCurrency(debtData?.avgDebtPerStudent || 0)]
    ];

    this.addTable(tableData, [60, 40]);
  }

  // Add employee salary analysis
  addEmployeeSalaries(employeeData) {
    if (this.currentY > this.pageHeight - 80) {
      this.addPageBreak();
    }

    this.addSectionTitle('Employee Salary Analysis');

    // Summary
    if (employeeData.summary) {
      const summaryData = [
        ['Metric', 'Value'],
        ['Total Employees', employeeData.summary.employeeCount.toString()],
        ['Total Calculated', this.formatCurrency(employeeData.summary.totalCalculated)],
        ['Total Paid', this.formatCurrency(employeeData.summary.totalPaid)],
        ['Total Remaining', this.formatCurrency(employeeData.summary.totalRemaining)]
      ];

      this.addTable(summaryData, [60, 40]);
      this.currentY += 10;
    }

    // By role
    if (employeeData.byRole && employeeData.byRole.length > 0) {
      this.addSectionTitle('Salaries by Role');

      const tableData = [
        ['Role', 'Count', 'Total Calculated', 'Total Paid', 'Remaining']
      ];

      employeeData.byRole.forEach(role => {
        tableData.push([
          role._id,
          role.employeeCount.toString(),
          this.formatCurrency(role.totalCalculated),
          this.formatCurrency(role.totalPaid),
          this.formatCurrency(role.totalRemaining)
        ]);
      });

      this.addTable(tableData, [25, 12, 20, 20, 20]);
    }
  }

  // Add table with enhanced formatting and borders
  addTable(data, columnWidths, options = {}) {
    const {
      headerBackground = [240, 240, 240],
      borderColor = [100, 100, 100],
      headerTextColor = [0, 0, 0],
      textColor = [0, 0, 0],
      fontSize = 8,
      rowHeight = 6,
      padding = 2,
      showBorders = true
    } = options;

    const startX = this.margin;
    const tableWidth = this.pageWidth - 2 * this.margin;

    // Calculate column positions
    const columnPositions = [startX];
    let currentX = startX;
    for (let i = 0; i < columnWidths.length - 1; i++) {
      currentX += (tableWidth * columnWidths[i] / 100);
      columnPositions.push(currentX);
    }

    // Draw outer table border
    if (showBorders) {
      this.doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      this.doc.setLineWidth(1.5);
      this.doc.rect(startX, this.currentY - 4, tableWidth, (data.length * (rowHeight + 2)) + 4);
    }

    // Draw table
    data.forEach((row, rowIndex) => {
      if (this.currentY > this.pageHeight - 30) {
        this.addPageBreak();
        this.currentY = this.margin;
      }

      const isHeader = rowIndex === 0;
      const currentRowHeight = isHeader ? rowHeight + 2 : rowHeight;

      row.forEach((cell, colIndex) => {
        const x = columnPositions[colIndex];
        const y = this.currentY;
        const width = colIndex < columnWidths.length - 1 
          ? columnPositions[colIndex + 1] - x 
          : this.pageWidth - this.margin - x;

        // Draw cell background for header
        if (isHeader) {
          this.doc.setFillColor(headerBackground[0], headerBackground[1], headerBackground[2]);
          this.doc.rect(x, y - 4, width, currentRowHeight, 'F');
        }

        // Draw cell borders
        if (showBorders) {
          this.doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
          this.doc.setLineWidth(0.5);
          
          // Draw cell border
          this.doc.rect(x, y - 4, width, currentRowHeight);
          
          // Draw vertical lines between columns
          if (colIndex < columnWidths.length - 1) {
            this.doc.line(x + width, y - 4, x + width, y - 4 + currentRowHeight);
          }
          
          // Draw horizontal lines between rows
          if (rowIndex < data.length - 1) {
            this.doc.line(x, y - 4 + currentRowHeight, x + width, y - 4 + currentRowHeight);
          }
        }

        // Add cell content
        this.doc.setFontSize(fontSize);
        this.doc.setFont('helvetica', isHeader ? 'bold' : 'normal');
        
        const textColorToUse = isHeader ? headerTextColor : textColor;
        this.doc.setTextColor(textColorToUse[0], textColorToUse[1], textColorToUse[2]);
        
        // Handle text alignment
        const textX = x + padding;
        const textY = y + 1;
        
        // Truncate text if too long
        let cellText = cell.toString();
        const maxWidth = width - (padding * 2);
        const charWidth = fontSize * 0.6; // Approximate character width
        const maxChars = Math.floor(maxWidth / charWidth);
        
        if (cellText.length > maxChars) {
          cellText = cellText.substring(0, maxChars - 3) + '...';
        }
        
        this.doc.text(cellText, textX, textY);
      });

      this.currentY += currentRowHeight;
    });

    this.currentY += 8;
  }

  // Add detailed financial summary table
  addDetailedFinancialSummary(monthData) {
    if (this.currentY > this.pageHeight - 80) {
      this.addPageBreak();
    }

    this.addSectionTitle('Detailed Financial Summary');

    const tableData = [
      ['Financial Metrics', 'Amount (DZD)', 'Percentage', 'Status']
    ];

    const totalIncome = monthData?.income || 0;
    const totalExpenses = monthData?.expenses || 0;
    const netBalance = monthData?.net || 0;

    // Income breakdown
    if (monthData?.breakdown) {
      const studentIncome = monthData.breakdown.studentIncome || 0;
      const manualIncome = monthData.breakdown.manualIncome || 0;
      
      tableData.push([
        'Student Income',
        this.formatCurrency(studentIncome),
        totalIncome > 0 ? `${((studentIncome / totalIncome) * 100).toFixed(1)}%` : '0%',
        'Primary'
      ]);
      
      tableData.push([
        'Manual Income',
        this.formatCurrency(manualIncome),
        totalIncome > 0 ? `${((manualIncome / totalIncome) * 100).toFixed(1)}%` : '0%',
        'Secondary'
      ]);
    }

    tableData.push(['', '', '', '']); // Empty row

    // Expense breakdown
    if (monthData?.breakdown) {
      const manualExpenses = monthData.breakdown.manualExpenses || 0;
      const teacherEarnings = monthData.breakdown.teacherEarnings || 0;
      const employeeSalaries = monthData.breakdown.employeeSalaries || 0;
      
      tableData.push([
        'Manual Expenses',
        this.formatCurrency(manualExpenses),
        totalExpenses > 0 ? `${((manualExpenses / totalExpenses) * 100).toFixed(1)}%` : '0%',
        'Fixed'
      ]);
      
      tableData.push([
        'Teacher Earnings',
        this.formatCurrency(teacherEarnings),
        totalExpenses > 0 ? `${((teacherEarnings / totalExpenses) * 100).toFixed(1)}%` : '0%',
        'Variable'
      ]);
      
      tableData.push([
        'Employee Salaries',
        this.formatCurrency(employeeSalaries),
        totalExpenses > 0 ? `${((employeeSalaries / totalExpenses) * 100).toFixed(1)}%` : '0%',
        'Fixed'
      ]);
    }

    tableData.push(['', '', '', '']); // Empty row

    // Summary rows
    tableData.push([
      'TOTAL INCOME',
      this.formatCurrency(totalIncome),
      '100%',
      'Revenue'
    ]);
    
    tableData.push([
      'TOTAL EXPENSES',
      this.formatCurrency(totalExpenses),
      '100%',
      'Costs'
    ]);
    
    tableData.push([
      'NET BALANCE',
      this.formatCurrency(netBalance),
      totalIncome > 0 ? `${((netBalance / totalIncome) * 100).toFixed(1)}%` : '0%',
      netBalance >= 0 ? 'Profit' : 'Loss'
    ]);

    this.addTable(tableData, [35, 25, 15, 25], {
      headerBackground: [59, 130, 246], // Blue header
      headerTextColor: [255, 255, 255], // White text
      fontSize: 7
    });
  }

  // Add monthly trends table
  addMonthlyTrendsTable(monthData) {
    if (this.currentY > this.pageHeight - 60) {
      this.addPageBreak();
    }

    this.addSectionTitle('Monthly Performance Analysis');

    const tableData = [
      ['Performance Indicator', 'Current Month', 'Target', 'Variance', 'Status']
    ];

    const income = monthData?.income || 0;
    const expenses = monthData?.expenses || 0;
    const net = monthData?.net || 0;

    // Calculate targets (example: 20% profit margin target)
    const targetProfitMargin = 0.20;
    const targetIncome = expenses / (1 - targetProfitMargin);
    const targetNet = targetIncome - expenses;

    tableData.push([
      'Monthly Income',
      this.formatCurrency(income),
      this.formatCurrency(targetIncome),
      this.formatCurrency(income - targetIncome),
      income >= targetIncome ? 'Above Target' : 'Below Target'
    ]);

    tableData.push([
      'Monthly Expenses',
      this.formatCurrency(expenses),
      this.formatCurrency(expenses * 0.9), // 10% reduction target
      this.formatCurrency(expenses - (expenses * 0.9)),
      expenses <= (expenses * 0.9) ? 'Within Budget' : 'Over Budget'
    ]);

    tableData.push([
      'Net Profit',
      this.formatCurrency(net),
      this.formatCurrency(targetNet),
      this.formatCurrency(net - targetNet),
      net >= targetNet ? 'Target Met' : 'Below Target'
    ]);

    const profitMargin = income > 0 ? (net / income) * 100 : 0;
    tableData.push([
      'Profit Margin',
      `${profitMargin.toFixed(1)}%`,
      `${(targetProfitMargin * 100).toFixed(1)}%`,
      `${(profitMargin - (targetProfitMargin * 100)).toFixed(1)}%`,
      profitMargin >= (targetProfitMargin * 100) ? 'Target Met' : 'Below Target'
    ]);

    this.addTable(tableData, [30, 20, 20, 15, 15], {
      headerBackground: [16, 185, 129], // Green header
      headerTextColor: [255, 255, 255], // White text
      fontSize: 7
    });
  }

  // Add student payment details table
  addStudentPaymentDetails(monthData) {
    if (this.currentY > this.pageHeight - 60) {
      this.addPageBreak();
    }

    this.addSectionTitle('Student Payment Analysis');

    const tableData = [
      ['Payment Type', 'Count', 'Total Amount', 'Average', 'Percentage']
    ];

    if (monthData?.breakdown) {
      const studentIncome = monthData.breakdown.studentIncome || 0;
      const manualIncome = monthData.breakdown.manualIncome || 0;
      const totalIncome = studentIncome + manualIncome;

      // Estimate counts (you can get real data from API)
      const estimatedStudentPayments = Math.max(1, Math.floor(studentIncome / 2500)); // Assuming average payment of 2500 DZD
      const estimatedManualPayments = Math.max(1, Math.floor(manualIncome / 1000)); // Assuming average manual payment of 1000 DZD

      tableData.push([
        'Student Payments',
        estimatedStudentPayments.toString(),
        this.formatCurrency(studentIncome),
        this.formatCurrency(studentIncome / estimatedStudentPayments),
        totalIncome > 0 ? `${((studentIncome / totalIncome) * 100).toFixed(1)}%` : '0%'
      ]);

      tableData.push([
        'Manual Payments',
        estimatedManualPayments.toString(),
        this.formatCurrency(manualIncome),
        this.formatCurrency(manualIncome / estimatedManualPayments),
        totalIncome > 0 ? `${((manualIncome / totalIncome) * 100).toFixed(1)}%` : '0%'
      ]);

      tableData.push(['', '', '', '', '']); // Empty row

      tableData.push([
        'TOTAL PAYMENTS',
        (estimatedStudentPayments + estimatedManualPayments).toString(),
        this.formatCurrency(totalIncome),
        this.formatCurrency(totalIncome / (estimatedStudentPayments + estimatedManualPayments)),
        '100%'
      ]);
    }

    this.addTable(tableData, [25, 15, 20, 20, 20], {
      headerBackground: [139, 92, 246], // Purple header
      headerTextColor: [255, 255, 255], // White text
      fontSize: 7
    });
  }

  // Add footer
  addFooter() {
    const pageCount = this.doc.internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(
        `Page ${i} of ${pageCount}`,
        this.pageWidth / 2,
        this.pageHeight - 10,
        { align: 'center' }
      );
    }
  }

  // Format currency
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  }

  // Generate and download PDF
  generatePDF(filename) {
    this.addFooter();
    this.doc.save(filename);
  }

  // Export analytics data to PDF with charts
  async exportAnalyticsToPDF(data, chartIds = [], filename) {
    try {
      const {
        monthData,
        teacherPayouts = [],
        debtData,
        expenseCategories = [],
        employeeSalaries = {},
        schoolData = { name: 'Skill Snap' }
      } = data;

      this.initDocument(
        `Financial Analytics Report - ${monthData?.monthName || 'Unknown'} ${monthData?.year || new Date().getFullYear()}`,
        schoolData
      );

      // Add financial summary
      if (monthData) {
        this.addFinancialSummary(monthData);
        this.addDetailedFinancialSummary(monthData);
        this.addMonthlyTrendsTable(monthData);
        this.addStudentPaymentDetails(monthData);
        
        if (monthData.breakdown) {
          this.addIncomeBreakdown(monthData.breakdown);
          this.addExpenseBreakdown(monthData.breakdown);
        }
      }

      // Try to capture and add charts
      if (chartIds.length > 0) {
        try {
          const chartImages = await chartCaptureService.captureMultipleCharts(chartIds);
          
          // Add income vs expenses chart
          if (chartImages['income-expenses-chart']) {
            await this.addImage(chartImages['income-expenses-chart'], 'Income vs Expenses Chart');
          } else {
            this.addImagePlaceholder('Income vs Expenses Chart');
          }

          // Add teacher payouts chart
          if (chartImages['teacher-payouts-chart']) {
            await this.addImage(chartImages['teacher-payouts-chart'], 'Teacher Payouts Chart');
          } else {
            this.addImagePlaceholder('Teacher Payouts Chart');
          }

          // Add expense categories chart
          if (chartImages['expense-categories-chart']) {
            await this.addImage(chartImages['expense-categories-chart'], 'Expense Categories Chart');
          } else {
            this.addImagePlaceholder('Expense Categories Chart');
          }
        } catch (error) {
          console.error('Error capturing charts:', error);
          // Add placeholders if chart capture fails
          this.addImagePlaceholder('Income vs Expenses Chart');
          this.addImagePlaceholder('Teacher Payouts Chart');
          this.addImagePlaceholder('Expense Categories Chart');
        }
      }

      // Add teacher payouts
      if (teacherPayouts.length > 0) {
        this.addTeacherPayouts(teacherPayouts);
      }

      // Add expense categories
      if (expenseCategories.length > 0) {
        this.addExpenseCategories(expenseCategories);
      }

      // Add debt analysis
      if (debtData) {
        this.addDebtAnalysis(debtData);
      }

      // Add employee salaries
      if (employeeSalaries && (employeeSalaries.summary || employeeSalaries.byRole?.length > 0)) {
        this.addEmployeeSalaries(employeeSalaries);
      }

      // Generate and download PDF
      this.generatePDF(filename);

      return true;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }
}

export default new EnhancedPDFExportService();
