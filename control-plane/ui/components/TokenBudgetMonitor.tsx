'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

interface TokenBudgetMonitorProps {
  dailyBudget?: number;
  monthlyBudget?: number;
  currentDailyUsage: number;
  currentMonthlyUsage: number;
}

export function TokenBudgetMonitor({
  dailyBudget = 50,
  monthlyBudget = 1000,
  currentDailyUsage,
  currentMonthlyUsage
}: TokenBudgetMonitorProps) {
  const [showDetails, setShowDetails] = useState(false);

  const dailyPercent = (currentDailyUsage / dailyBudget) * 100;
  const monthlyPercent = (currentMonthlyUsage / monthlyBudget) * 100;

  const getStatusColor = (percent: number) => {
    if (percent < 50) return 'bg-emerald-500';
    if (percent < 80) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getStatusIcon = (percent: number) => {
    if (percent < 80) return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    return <AlertCircle className="w-4 h-4 text-red-500" />;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Budget Monitor</h3>
        </div>
        {getStatusIcon(Math.max(dailyPercent, monthlyPercent))}
      </div>

      {/* Daily Budget */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-600">Daily</span>
          <span className="font-medium">
            ${currentDailyUsage.toFixed(2)} / ${dailyBudget}
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${getStatusColor(dailyPercent)}`}
            style={{ width: `${Math.min(dailyPercent, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {dailyPercent.toFixed(1)}% of daily budget
        </p>
      </div>

      {/* Monthly Budget */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-600">Monthly</span>
          <span className="font-medium">
            ${currentMonthlyUsage.toFixed(2)} / ${monthlyBudget}
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${getStatusColor(monthlyPercent)}`}
            style={{ width: `${Math.min(monthlyPercent, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {monthlyPercent.toFixed(1)}% of monthly budget
        </p>
      </div>

      {/* Projection */}
      {showDetails && (
        <div className="pt-4 border-t border-gray-100 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span className="text-gray-600">Projected monthly:</span>
            <span className="font-medium">
              ${((currentDailyUsage * 30)).toFixed(2)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <TrendingDown className="w-4 h-4 text-emerald-500" />
            <span className="text-gray-600">Remaining today:</span>
            <span className="font-medium text-emerald-600">
              ${Math.max(0, dailyBudget - currentDailyUsage).toFixed(2)}
            </span>
          </div>
        </div>
      )}

      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full mt-3 text-sm text-blue-600 hover:text-blue-700"
      >
        {showDetails ? 'Hide details' : 'Show details'}
      </button>
    </div>
  );
}
