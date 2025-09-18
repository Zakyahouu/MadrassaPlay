import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

class PDFExportService {
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
      this.addSectionTitle('Salaires par Rôle');

      const tableData = [
        ['Rôle', 'Nombre', 'Total Calculé', 'Total Payé', 'Restant']
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

  // Add chart as image (placeholder for now)
  addChartPlaceholder(title, description) {
    if (this.currentY > this.pageHeight - 60) {
      this.addPageBreak();
    }

    this.addSectionTitle(title);

    // Add a placeholder rectangle for the chart
    this.doc.setDrawColor(200, 200, 200);
    this.doc.setFillColor(245, 245, 245);
    this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 40, 'FD');
    
    // Add text in the center
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(100, 100, 100);
    this.doc.text(description, this.pageWidth / 2, this.currentY + 25, { align: 'center' });
    
    this.currentY += 50;
  }

  // Add table
  addTable(data, columnWidths) {
    const startX = this.margin;
    const startY = this.currentY;
    const rowHeight = 6;
    const tableWidth = this.pageWidth - 2 * this.margin;

    // Calculate column positions
    const columnPositions = [startX];
    let currentX = startX;
    for (let i = 0; i < columnWidths.length - 1; i++) {
      currentX += (tableWidth * columnWidths[i] / 100);
      columnPositions.push(currentX);
    }

    // Draw table
    data.forEach((row, rowIndex) => {
      if (this.currentY > this.pageHeight - 20) {
        this.addPageBreak();
        this.currentY = this.margin;
      }

      row.forEach((cell, colIndex) => {
        const x = columnPositions[colIndex];
        const y = this.currentY;
        const width = colIndex < columnWidths.length - 1 
          ? columnPositions[colIndex + 1] - x 
          : this.pageWidth - this.margin - x;

        // Draw cell border
        this.doc.setDrawColor(200, 200, 200);
        this.doc.rect(x, y - 4, width, rowHeight);

        // Add cell content
        this.doc.setFontSize(8);
        this.doc.setFont('helvetica', rowIndex === 0 ? 'bold' : 'normal');
        this.doc.text(cell.toString(), x + 2, y + 1);
      });

      this.currentY += rowHeight;
    });

    this.currentY += 5;
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

  // Export analytics data to PDF
  async exportAnalyticsToPDF(data, filename) {
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
        `Rapport d'Analyses Financières - ${monthData?.monthName || 'Inconnu'} ${monthData?.year || new Date().getFullYear()}`,
        schoolData
      );

      // Add financial summary
      if (monthData) {
        this.addFinancialSummary(monthData);
        
        if (monthData.breakdown) {
          this.addIncomeBreakdown(monthData.breakdown);
          this.addExpenseBreakdown(monthData.breakdown);
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

      // Add chart placeholders
      this.addChartPlaceholder('Income vs Expenses Chart', 'Visual representation of income and expense distribution');
      this.addChartPlaceholder('Teacher Payouts Chart', 'Visual representation of teacher payout distribution');
      this.addChartPlaceholder('Expense Categories Chart', 'Visual representation of expense categories');

      // Generate and download PDF
      this.generatePDF(filename);

      return true;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }
}

export default new PDFExportService();
