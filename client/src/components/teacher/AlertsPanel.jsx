import React from 'react';
import { X, Bell } from 'lucide-react';

const AlertsPanel = ({ onClose, alerts = [] }) => {
    const items = Array.isArray(alerts) ? alerts : [];
    const hasAlerts = items.length > 0;

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-indigo-600" />
                    Active Alerts
                </h3>
                {onClose && (
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            <div className="p-4 space-y-3 overflow-y-auto">
                {!hasAlerts && (
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm text-gray-600">
                        No alerts yet.
                    </div>
                )}

                {items.map(alert => (
                    <div key={alert.id} className="p-3 rounded-xl border border-gray-100 bg-gray-50 flex gap-3 items-start">
                        <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${alert.type === 'urgent' ? 'bg-red-500' :
                                alert.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                            }`} />
                        <div className="flex-1">
                            <p className="text-sm text-gray-800 leading-snug">{alert.message}</p>
                            <span className="text-xs text-gray-400 mt-1 block">{alert.time}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AlertsPanel;
