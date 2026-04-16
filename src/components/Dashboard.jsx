import React from 'react';
import { Server, Network, UserPlus } from 'lucide-react';
import { BG_CONTAINER } from '../constants';

export default function Dashboard({ selectedUnit, filteredServers, filteredConnections, filteredPermissions }) {
  const envStats = {};
  filteredServers.forEach(s => {
    const key = `${s.unit} - ${s.env}`;
    envStats[key] = (envStats[key] || 0) + 1;
  });

  const countStatus = (arr, statusList) => arr.filter(i => statusList.includes(String(i.status).toLowerCase())).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800">Dashboard Tổng quan {selectedUnit !== 'All' && <span className="text-indigo-600">- {selectedUnit}</span>}</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div style={{ backgroundColor: BG_CONTAINER }} className="rounded-xl shadow-sm p-6 border border-gray-100 md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">Máy chủ</h3>
            <div className="p-2 bg-indigo-50 rounded-lg"><Server className="text-indigo-500 w-5 h-5"/></div>
          </div>
          <div className="space-y-3 max-h-[140px] overflow-y-auto pr-2 custom-scrollbar">
            {Object.entries(envStats).map(([key, count], idx) => (
              <div key={`${key}-${idx}`} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                <span className="text-gray-600 truncate mr-2" title={key}>{key}</span>
                <span className="font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded min-w-[2rem] text-center">{count}</span>
              </div>
            ))}
            {Object.keys(envStats).length === 0 && <div className="text-gray-400 text-sm">Chưa có dữ liệu</div>}
          </div>
        </div>
        <div style={{ backgroundColor: BG_CONTAINER }} className="rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-gray-700">Kết nối</h3><div className="p-2 bg-blue-50 rounded-lg"><Network className="text-blue-500 w-5 h-5"/></div></div>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm"><span className="text-gray-500">Active</span><span className="font-medium text-emerald-600">{countStatus(filteredConnections, ['active'])}</span></div>
            <div className="flex justify-between items-center text-sm"><span className="text-gray-500">Open</span><span className="font-medium text-blue-600">{countStatus(filteredConnections, ['open'])}</span></div>
            <div className="flex justify-between items-center text-sm"><span className="text-gray-500">In progress</span><span className="font-medium text-amber-600">{countStatus(filteredConnections, ['in progress'])}</span></div>
            <div className="flex justify-between items-center text-sm"><span className="text-gray-500">Expired</span><span className="font-medium text-rose-600">{countStatus(filteredConnections, ['expired'])}</span></div>
          </div>
        </div>
        <div style={{ backgroundColor: BG_CONTAINER }} className="rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-gray-700">Cấp Quyền</h3><div className="p-2 bg-purple-50 rounded-lg"><UserPlus className="text-purple-500 w-5 h-5"/></div></div>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm"><span className="text-gray-500">Done</span><span className="font-medium text-emerald-600">{countStatus(filteredPermissions, ['done'])}</span></div>
            <div className="flex justify-between items-center text-sm"><span className="text-gray-500">Open</span><span className="font-medium text-blue-600">{countStatus(filteredPermissions, ['open'])}</span></div>
            <div className="flex justify-between items-center text-sm"><span className="text-gray-500">In progress</span><span className="font-medium text-amber-600">{countStatus(filteredPermissions, ['in progress'])}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
