import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Calculator,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';

const FinancialCards = ({ data, formatCurrency }) => {
  const { t } = useLanguage();
  if (!data) return null;

  const cards = [
    {
      title: t.totalIncome,
      value: data.totalIncome,
      icon: DollarSign,
      color: 'green',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200',
      textColor: 'text-green-700',
      description: t.studentPaymentsThisMonth
    },
    {
      title: t.totalExpenses,
      value: data.totalExpenses,
      icon: TrendingUp,
      color: 'red',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      borderColor: 'border-red-200',
      textColor: 'text-red-700',
      description: t.manualExpenses
    },
    {
      title: t.staffSalariesPaid,
      value: data.totalStaffSalariesPaid || 0,
      icon: DollarSign,
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-700',
      description: `${t.onlyPaidAmounts} - ${data.employeeCount || 0} ${t.employees}, ${data.teacherCount || 0} ${t.teachers}`
    },
    {
      title: t.totalDebts,
      value: data.totalDebts,
      icon: AlertTriangle,
      color: 'orange',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-700',
      description: t.outstandingStudentDebts
    },
    {
      title: t.netBalance,
      value: data.netBalance,
      icon: Calculator,
      color: data.netBalance >= 0 ? 'blue' : 'red',
      bgColor: data.netBalance >= 0 ? 'bg-blue-50' : 'bg-red-50',
      iconColor: data.netBalance >= 0 ? 'text-blue-600' : 'text-red-600',
      borderColor: data.netBalance >= 0 ? 'border-blue-200' : 'border-red-200',
      textColor: data.netBalance >= 0 ? 'text-blue-700' : 'text-red-700',
      description: t.incomeExpensesCalculation
    }
  ];

  const getTrendIcon = (value) => {
    const { t } = useLanguage();
    if (value > 0) return <ArrowUpRight className="w-4 h-4" />;
    if (value < 0) return <ArrowDownRight className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendColor = (value) => {
    const { t } = useLanguage();
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const isPositive = card.value >= 0;
        const isDebt = card.title === t.totalDebts;

        return (
          <div
            key={index}
            className={`${card.bgColor} ${card.borderColor} border rounded-xl p-6 hover:shadow-md transition-shadow`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${card.bgColor} ${card.borderColor} border`}>
                <Icon className={`w-6 h-6 ${card.iconColor}`} />
              </div>
              <div className={`flex items-center ${getTrendColor(card.value)}`}>
                {getTrendIcon(card.value)}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className={`text-sm font-medium ${card.textColor} opacity-80`}>
                {card.title}
              </h3>
              <p className={`text-2xl font-bold ${card.textColor}`}>
                {formatCurrency(card.value)}
              </p>
              <p className={`text-xs ${card.textColor} opacity-70`}>
                {card.description}
              </p>
            </div>

            {/* Additional info for specific cards */}
            {card.title === t.totalIncome && data.paymentCount && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-600">
                  {t.paymentReceived.replace('{count}', data.paymentCount).replace('{s}', data.paymentCount !== 1 ? 's' : '')}
                </p>
              </div>
            )}

            {card.title === t.totalDebts && data.totalDebts !== 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-orange-600">
                  {data.totalDebts > 0 ? t.studentsOweSchool : t.schoolOwesStudents}
                </p>
              </div>
            )}

            {card.title === t.netBalance && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className={`text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {isPositive ? t.positiveBalance : t.negativeBalance}
                </p>
              </div>
            )}

            {card.title === t.totalExpenses && data.totalExpenses === 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  {t.manualExpensesPhase2}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default FinancialCards;
