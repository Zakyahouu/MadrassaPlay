class FallbackPDFExportService {
  constructor() {
    this.pageWidth = 210; // A4 width in mm
    this.pageHeight = 297; // A4 height in mm
    this.margin = 20;
  }

  // Generate a simple HTML report that can be printed as PDF
  generateHTMLReport(data, filename) {
    const {
      monthData,
      teacherPayouts = [],
      debtData,
      expenseCategories = [],
      employeeSalaries = {},
      schoolData = { name: 'Skill Snap' },
      schoolName = schoolData?.name || 'Skill Snap'
    } = data;

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Rapport d'Analyses Financières</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .report-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .school-name {
            font-size: 24px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 5px;
          }
          .school-info {
            font-size: 12px;
            color: #6b7280;
            margin-bottom: 10px;
            line-height: 1.4;
          }
          .school-info div {
            margin-bottom: 2px;
          }
          .report-title {
            font-size: 18px;
            color: #6b7280;
            margin-bottom: 10px;
          }
          .report-date {
            font-size: 14px;
            color: #9ca3af;
          }
          .section {
            margin-bottom: 30px;
          }
          .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 15px;
            padding-bottom: 5px;
            border-bottom: 1px solid #e5e7eb;
          }
          .metric-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
          }
          .metric-card {
            background: #f9fafb;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #3b82f6;
          }
          .metric-label {
            font-size: 12px;
            color: #6b7280;
            margin-bottom: 5px;
          }
          .metric-value {
            font-size: 18px;
            font-weight: bold;
            color: #1f2937;
          }
          .table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            border: 2px solid #374151;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .table th,
          .table td {
            padding: 12px 10px;
            text-align: left;
            border: 1px solid #6b7280;
            vertical-align: top;
          }
          .table th {
            background-color: #f9fafb;
            font-weight: bold;
            color: #374151;
            border-bottom: 2px solid #374151;
            text-transform: uppercase;
            font-size: 12px;
            letter-spacing: 0.5px;
          }
          .table tr:nth-child(even) {
            background-color: #f8fafc;
          }
          .table tr:hover {
            background-color: #e0f2fe;
          }
          .table tr:last-child td {
            border-bottom: 2px solid #374151;
          }
          .text-right {
            text-align: right;
          }
          .text-center {
            text-align: center;
          }
          .positive {
            color: #059669;
            font-weight: bold;
          }
          .negative {
            color: #dc2626;
            font-weight: bold;
          }
          .warning {
            color: #d97706;
            font-weight: bold;
          }
          .table-section {
            margin-bottom: 30px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .table-section .section-title {
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white;
            padding: 15px 20px;
            margin: 0;
            font-size: 16px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .table-section .table {
            margin: 0;
            border: none;
            box-shadow: none;
          }
          .table-section .table th {
            background: linear-gradient(135deg, #f8fafc, #e2e8f0);
            color: #1e293b;
            border-bottom: 3px solid #3b82f6;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }
          @media print {
            body {
              background-color: white;
            }
            .report-container {
              box-shadow: none;
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="report-container">
          <div class="header">
            <div class="logo-container">
              <img src="/Logo.jpg" alt="Skill Snap Logo" style="height: 40px; margin-bottom: 10px;" />
            </div>
            <div class="school-name">${schoolData?.name || schoolName}</div>
            ${schoolData?.contact ? `
              <div class="school-info">
                ${schoolData.contact.address ? `<div>Adresse : ${schoolData.contact.address}</div>` : ''}
                ${schoolData.contact.phone ? `<div>Téléphone : ${schoolData.contact.phone}</div>` : ''}
                ${schoolData.contact.email ? `<div>E-mail : ${schoolData.contact.email}</div>` : ''}
              </div>
            ` : ''}
            <div class="report-title">Rapport d'Analyses Financières</div>
            <div class="report-title">${monthData?.monthName || 'Inconnu'} ${monthData?.year || new Date().getFullYear()}</div>
            <div class="report-date">Généré le : ${schoolData?.reportDate || new Date().toLocaleDateString()} à ${schoolData?.reportTime || new Date().toLocaleTimeString()}</div>
            <div class="report-date">Généré par : ${schoolData?.generatedBy || 'Utilisateur'} (${schoolData?.userRole || 'Utilisateur'})</div>
          </div>

          ${this.generateFinancialSummarySection(monthData)}
          ${this.generateDetailedFinancialSummarySection(monthData)}
          ${this.generateMonthlyTrendsSection(monthData)}
          ${this.generateStudentPaymentDetailsSection(monthData)}
          ${this.generateIncomeBreakdownSection(monthData?.breakdown)}
          ${this.generateExpenseBreakdownSection(monthData?.breakdown)}
          ${this.generateTeacherPayoutsSection(teacherPayouts)}
          ${this.generateExpenseCategoriesSection(expenseCategories)}
          ${this.generateDebtAnalysisSection(debtData)}
          ${this.generateEmployeeSalariesSection(employeeSalaries)}

          <div class="footer">
            <p>This report was generated automatically by Skill Snap.</p>
            <p>For questions or support, please contact your system administrator.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Open in new window for printing
    const newWindow = window.open('', '_blank');
    newWindow.document.write(html);
    newWindow.document.close();
    
    // Trigger print dialog
    setTimeout(() => {
      newWindow.print();
    }, 500);

    return true;
  }

  generateFinancialSummarySection(monthData) {
    if (!monthData) return '';

    return `
      <div class="section">
        <div class="section-title">Financial Summary</div>
        <div class="metric-grid">
          <div class="metric-card">
            <div class="metric-label">Total Income</div>
            <div class="metric-value positive">${this.formatCurrency(monthData.income || 0)}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Total Expenses</div>
            <div class="metric-value negative">${this.formatCurrency(monthData.expenses || 0)}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Net Balance</div>
            <div class="metric-value ${(monthData.net || 0) >= 0 ? 'positive' : 'negative'}">${this.formatCurrency(monthData.net || 0)}</div>
          </div>
        </div>
      </div>
    `;
  }

  generateDetailedFinancialSummarySection(monthData) {
    if (!monthData) return '';

    const totalIncome = monthData.income || 0;
    const totalExpenses = monthData.expenses || 0;
    const netBalance = monthData.net || 0;

    return `
      <div class="table-section">
        <div class="section-title">Detailed Financial Summary</div>
        <table class="table">
          <tr>
            <th>Financial Metrics</th>
            <th class="text-right">Amount (DZD)</th>
            <th class="text-center">Percentage</th>
            <th class="text-center">Status</th>
          </tr>
          ${monthData.breakdown ? `
            <tr>
              <td>Student Income</td>
              <td class="text-right positive">${this.formatCurrency(monthData.breakdown.studentIncome || 0)}</td>
              <td class="text-center">${totalIncome > 0 ? ((monthData.breakdown.studentIncome / totalIncome) * 100).toFixed(1) : 0}%</td>
              <td class="text-center">Primary</td>
            </tr>
            <tr>
              <td>Manual Income</td>
              <td class="text-right positive">${this.formatCurrency(monthData.breakdown.manualIncome || 0)}</td>
              <td class="text-center">${totalIncome > 0 ? ((monthData.breakdown.manualIncome / totalIncome) * 100).toFixed(1) : 0}%</td>
              <td class="text-center">Secondary</td>
            </tr>
            <tr><td colspan="4" style="height: 10px;"></td></tr>
            <tr>
              <td>Manual Expenses</td>
              <td class="text-right negative">${this.formatCurrency(monthData.breakdown.manualExpenses || 0)}</td>
              <td class="text-center">${totalExpenses > 0 ? ((monthData.breakdown.manualExpenses / totalExpenses) * 100).toFixed(1) : 0}%</td>
              <td class="text-center">Fixed</td>
            </tr>
            <tr>
              <td>Teacher Earnings</td>
              <td class="text-right negative">${this.formatCurrency(monthData.breakdown.teacherEarnings || 0)}</td>
              <td class="text-center">${totalExpenses > 0 ? ((monthData.breakdown.teacherEarnings / totalExpenses) * 100).toFixed(1) : 0}%</td>
              <td class="text-center">Variable</td>
            </tr>
            <tr>
              <td>Employee Salaries</td>
              <td class="text-right negative">${this.formatCurrency(monthData.breakdown.employeeSalaries || 0)}</td>
              <td class="text-center">${totalExpenses > 0 ? ((monthData.breakdown.employeeSalaries / totalExpenses) * 100).toFixed(1) : 0}%</td>
              <td class="text-center">Fixed</td>
            </tr>
            <tr><td colspan="4" style="height: 10px;"></td></tr>
          ` : ''}
          <tr style="background-color: #f0f9ff; font-weight: bold;">
            <td>TOTAL INCOME</td>
            <td class="text-right positive">${this.formatCurrency(totalIncome)}</td>
            <td class="text-center">100%</td>
            <td class="text-center">Revenue</td>
          </tr>
          <tr style="background-color: #fef2f2; font-weight: bold;">
            <td>TOTAL EXPENSES</td>
            <td class="text-right negative">${this.formatCurrency(totalExpenses)}</td>
            <td class="text-center">100%</td>
            <td class="text-center">Costs</td>
          </tr>
          <tr style="background-color: ${netBalance >= 0 ? '#f0fdf4' : '#fef2f2'}; font-weight: bold;">
            <td>NET BALANCE</td>
            <td class="text-right ${netBalance >= 0 ? 'positive' : 'negative'}">${this.formatCurrency(netBalance)}</td>
            <td class="text-center">${totalIncome > 0 ? ((netBalance / totalIncome) * 100).toFixed(1) : 0}%</td>
            <td class="text-center">${netBalance >= 0 ? 'Profit' : 'Loss'}</td>
          </tr>
        </table>
      </div>
    `;
  }

  generateMonthlyTrendsSection(monthData) {
    if (!monthData) return '';

    const income = monthData.income || 0;
    const expenses = monthData.expenses || 0;
    const net = monthData.net || 0;

    // Calculate targets
    const targetProfitMargin = 0.20;
    const targetIncome = expenses / (1 - targetProfitMargin);
    const targetNet = targetIncome - expenses;
    const profitMargin = income > 0 ? (net / income) * 100 : 0;

    return `
      <div class="table-section">
        <div class="section-title">Monthly Performance Analysis</div>
        <table class="table">
          <tr>
            <th>Performance Indicator</th>
            <th class="text-right">Current Month</th>
            <th class="text-right">Target</th>
            <th class="text-right">Variance</th>
            <th class="text-center">Status</th>
          </tr>
          <tr>
            <td>Monthly Income</td>
            <td class="text-right">${this.formatCurrency(income)}</td>
            <td class="text-right">${this.formatCurrency(targetIncome)}</td>
            <td class="text-right ${income >= targetIncome ? 'positive' : 'negative'}">${this.formatCurrency(income - targetIncome)}</td>
            <td class="text-center">${income >= targetIncome ? 'Above Target' : 'Below Target'}</td>
          </tr>
          <tr>
            <td>Monthly Expenses</td>
            <td class="text-right">${this.formatCurrency(expenses)}</td>
            <td class="text-right">${this.formatCurrency(expenses * 0.9)}</td>
            <td class="text-right ${expenses <= (expenses * 0.9) ? 'positive' : 'negative'}">${this.formatCurrency(expenses - (expenses * 0.9))}</td>
            <td class="text-center">${expenses <= (expenses * 0.9) ? 'Within Budget' : 'Over Budget'}</td>
          </tr>
          <tr>
            <td>Net Profit</td>
            <td class="text-right">${this.formatCurrency(net)}</td>
            <td class="text-right">${this.formatCurrency(targetNet)}</td>
            <td class="text-right ${net >= targetNet ? 'positive' : 'negative'}">${this.formatCurrency(net - targetNet)}</td>
            <td class="text-center">${net >= targetNet ? 'Target Met' : 'Below Target'}</td>
          </tr>
          <tr>
            <td>Profit Margin</td>
            <td class="text-right">${profitMargin.toFixed(1)}%</td>
            <td class="text-right">${(targetProfitMargin * 100).toFixed(1)}%</td>
            <td class="text-right ${profitMargin >= (targetProfitMargin * 100) ? 'positive' : 'negative'}">${(profitMargin - (targetProfitMargin * 100)).toFixed(1)}%</td>
            <td class="text-center">${profitMargin >= (targetProfitMargin * 100) ? 'Target Met' : 'Below Target'}</td>
          </tr>
        </table>
      </div>
    `;
  }

  generateStudentPaymentDetailsSection(monthData) {
    if (!monthData || !monthData.breakdown) return '';

    const studentIncome = monthData.breakdown.studentIncome || 0;
    const manualIncome = monthData.breakdown.manualIncome || 0;
    const totalIncome = studentIncome + manualIncome;

    // Estimate counts
    const estimatedStudentPayments = Math.max(1, Math.floor(studentIncome / 2500));
    const estimatedManualPayments = Math.max(1, Math.floor(manualIncome / 1000));

    return `
      <div class="table-section">
        <div class="section-title">Student Payment Analysis</div>
        <table class="table">
          <tr>
            <th>Payment Type</th>
            <th class="text-center">Count</th>
            <th class="text-right">Total Amount</th>
            <th class="text-right">Average</th>
            <th class="text-center">Percentage</th>
          </tr>
          <tr>
            <td>Student Payments</td>
            <td class="text-center">${estimatedStudentPayments}</td>
            <td class="text-right positive">${this.formatCurrency(studentIncome)}</td>
            <td class="text-right">${this.formatCurrency(studentIncome / estimatedStudentPayments)}</td>
            <td class="text-center">${totalIncome > 0 ? ((studentIncome / totalIncome) * 100).toFixed(1) : 0}%</td>
          </tr>
          <tr>
            <td>Manual Payments</td>
            <td class="text-center">${estimatedManualPayments}</td>
            <td class="text-right positive">${this.formatCurrency(manualIncome)}</td>
            <td class="text-right">${this.formatCurrency(manualIncome / estimatedManualPayments)}</td>
            <td class="text-center">${totalIncome > 0 ? ((manualIncome / totalIncome) * 100).toFixed(1) : 0}%</td>
          </tr>
          <tr style="background-color: #f0f9ff; font-weight: bold;">
            <td>TOTAL PAYMENTS</td>
            <td class="text-center">${estimatedStudentPayments + estimatedManualPayments}</td>
            <td class="text-right positive">${this.formatCurrency(totalIncome)}</td>
            <td class="text-right">${this.formatCurrency(totalIncome / (estimatedStudentPayments + estimatedManualPayments))}</td>
            <td class="text-center">100%</td>
          </tr>
        </table>
      </div>
    `;
  }

  generateIncomeBreakdownSection(breakdown) {
    if (!breakdown) return '';

    return `
      <div class="table-section">
        <div class="section-title">Income Breakdown</div>
        <table class="table">
          <tr>
            <th>Source</th>
            <th class="text-right">Amount (DZD)</th>
          </tr>
          <tr>
            <td>Student Payments</td>
            <td class="text-right positive">${this.formatCurrency(breakdown.studentIncome || 0)}</td>
          </tr>
          <tr>
            <td>Manual Income</td>
            <td class="text-right positive">${this.formatCurrency(breakdown.manualIncome || 0)}</td>
          </tr>
        </table>
      </div>
    `;
  }

  generateExpenseBreakdownSection(breakdown) {
    if (!breakdown) return '';

    return `
      <div class="table-section">
        <div class="section-title">Expense Breakdown</div>
        <table class="table">
          <tr>
            <th>Category</th>
            <th class="text-right">Amount (DZD)</th>
          </tr>
          <tr>
            <td>Manual Expenses</td>
            <td class="text-right negative">${this.formatCurrency(breakdown.manualExpenses || 0)}</td>
          </tr>
          <tr>
            <td>Teacher Earnings</td>
            <td class="text-right negative">${this.formatCurrency(breakdown.teacherEarnings || 0)}</td>
          </tr>
          <tr>
            <td>Employee Salaries</td>
            <td class="text-right negative">${this.formatCurrency(breakdown.employeeSalaries || 0)}</td>
          </tr>
        </table>
      </div>
    `;
  }

  generateTeacherPayoutsSection(teacherPayouts) {
    if (!teacherPayouts || teacherPayouts.length === 0) return '';

    return `
      <div class="table-section">
        <div class="section-title">Teacher Payouts</div>
        <table class="table">
          <tr>
            <th>Teacher</th>
            <th class="text-center">Classes</th>
            <th class="text-center">Students</th>
            <th class="text-right">Calculated</th>
            <th class="text-right">Paid</th>
            <th class="text-right">Remaining</th>
          </tr>
          ${teacherPayouts.map(teacher => `
            <tr>
              <td>${teacher.teacherName}</td>
              <td class="text-center">${teacher.classCount}</td>
              <td class="text-center">${teacher.totalStudents}</td>
              <td class="text-right">${this.formatCurrency(teacher.totalCalculated)}</td>
              <td class="text-right positive">${this.formatCurrency(teacher.totalPaid)}</td>
              <td class="text-right ${teacher.totalRemaining > 0 ? 'warning' : 'positive'}">${this.formatCurrency(teacher.totalRemaining)}</td>
            </tr>
          `).join('')}
        </table>
      </div>
    `;
  }

  generateExpenseCategoriesSection(expenseCategories) {
    if (!expenseCategories || expenseCategories.length === 0) return '';

    const totalExpenses = expenseCategories.reduce((sum, cat) => sum + cat.totalAmount, 0);

    return `
      <div class="table-section">
        <div class="section-title">Expense Categories</div>
        <table class="table">
          <tr>
            <th>Category</th>
            <th class="text-right">Amount (DZD)</th>
            <th class="text-center">Transactions</th>
            <th class="text-center">Percentage</th>
          </tr>
          ${expenseCategories.map(category => {
            const percentage = totalExpenses > 0 ? ((category.totalAmount / totalExpenses) * 100).toFixed(1) : 0;
            return `
              <tr>
                <td>${category._id}</td>
                <td class="text-right negative">${this.formatCurrency(category.totalAmount)}</td>
                <td class="text-center">${category.transactionCount}</td>
                <td class="text-center">${percentage}%</td>
              </tr>
            `;
          }).join('')}
        </table>
      </div>
    `;
  }

  generateDebtAnalysisSection(debtData) {
    if (!debtData) return '';

    return `
      <div class="table-section">
        <div class="section-title">Debt Analysis</div>
        <div class="metric-grid">
          <div class="metric-card">
            <div class="metric-label">Total Debt</div>
            <div class="metric-value warning">${this.formatCurrency(debtData.totalDebt || 0)}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">New Debt This Month</div>
            <div class="metric-value negative">${this.formatCurrency(debtData.newDebt || 0)}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Students with Debt</div>
            <div class="metric-value">${debtData.studentCount || 0}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Average Debt per Student</div>
            <div class="metric-value warning">${this.formatCurrency(debtData.avgDebtPerStudent || 0)}</div>
          </div>
        </div>
      </div>
    `;
  }

  generateEmployeeSalariesSection(employeeSalaries) {
    if (!employeeSalaries || (!employeeSalaries.summary && (!employeeSalaries.byRole || employeeSalaries.byRole.length === 0))) {
      return '';
    }

    let html = '<div class="table-section"><div class="section-title">Employee Salary Analysis</div>';

    if (employeeSalaries.summary) {
      html += `
        <div class="metric-grid">
          <div class="metric-card">
            <div class="metric-label">Total Employees</div>
            <div class="metric-value">${employeeSalaries.summary.employeeCount}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Total Calculated</div>
            <div class="metric-value">${this.formatCurrency(employeeSalaries.summary.totalCalculated)}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Total Paid</div>
            <div class="metric-value positive">${this.formatCurrency(employeeSalaries.summary.totalPaid)}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Total Remaining</div>
            <div class="metric-value ${employeeSalaries.summary.totalRemaining > 0 ? 'warning' : 'positive'}">${this.formatCurrency(employeeSalaries.summary.totalRemaining)}</div>
          </div>
        </div>
      `;
    }

    if (employeeSalaries.byRole && employeeSalaries.byRole.length > 0) {
      html += `
        <h4 style="margin-top: 20px; margin-bottom: 10px; color: #374151;">Salaries by Role</h4>
        <table class="table">
          <tr>
            <th>Role</th>
            <th class="text-center">Count</th>
            <th class="text-right">Total Calculated</th>
            <th class="text-right">Total Paid</th>
            <th class="text-right">Remaining</th>
          </tr>
          ${employeeSalaries.byRole.map(role => `
            <tr>
              <td>${role._id}</td>
              <td class="text-center">${role.employeeCount}</td>
              <td class="text-right">${this.formatCurrency(role.totalCalculated)}</td>
              <td class="text-right positive">${this.formatCurrency(role.totalPaid)}</td>
              <td class="text-right ${role.totalRemaining > 0 ? 'warning' : 'positive'}">${this.formatCurrency(role.totalRemaining)}</td>
            </tr>
          `).join('')}
        </table>
      `;
    }

    html += '</div>';
    return html;
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

  // Export analytics data to PDF (fallback method)
  async exportAnalyticsToPDF(data, chartIds = [], filename) {
    try {
      this.generateHTMLReport(data, filename);
      return true;
    } catch (error) {
      console.error('Error generating fallback PDF:', error);
      throw error;
    }
  }
}

export default new FallbackPDFExportService();
