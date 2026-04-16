import React, { useState } from 'react';
import { Plus, Building2, AppWindow, Edit, Globe, ExternalLink, Database, Copy, Check, X } from 'lucide-react';
import { HEADER_COLOR, BG_CONTAINER } from '../constants';

export default function AppStore({ isPublic, filteredApps, hasAddPermission, openAddModal, openEditModal }) {
  const [selectedApp, setSelectedApp] = useState(null);
  const [copyToast, setCopyToast] = useState(false);

  const handleCopy = (text) => {
    const el = document.createElement('textarea'); el.value = text;
    document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el);
    setCopyToast(true); setTimeout(() => setCopyToast(false), 2000);
  };

  const groupedApps = filteredApps.reduce((acc, app) => {
    if (!acc[app.unit]) acc[app.unit] = {};
    if (!acc[app.unit][app.env]) acc[app.unit][app.env] = [];
    acc[app.unit][app.env].push(app);
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Kho Ứng dụng {isPublic && '(Public)'}</h2>
        {!isPublic && hasAddPermission && (
          <button onClick={openAddModal} style={{ backgroundColor: HEADER_COLOR }} className="flex items-center gap-2 text-white px-4 py-2 rounded-lg hover:opacity-90">
            <Plus className="w-4 h-4" /> Khai báo Ứng dụng
          </button>
        )}
      </div>
      
      {Object.keys(groupedApps).length === 0 ? (
        <div style={{ backgroundColor: BG_CONTAINER }} className="text-center text-gray-400 py-10 rounded-xl shadow-sm border">Không có ứng dụng nào</div>
      ) : (
        <div className="space-y-10">
          {Object.entries(groupedApps).map(([unit, envs]) => (
            <div key={unit} style={{ backgroundColor: BG_CONTAINER }} className="space-y-5 p-6 rounded-2xl shadow-sm border">
              <div className="flex items-center gap-3 pb-3 border-b-2 border-gray-100"><div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Building2 className="w-5 h-5" /></div><h3 className="text-xl font-bold">{unit}</h3></div>
              <div className="space-y-8 pt-2">
                {Object.entries(envs).map(([env, appsInEnv]) => (
                  <div key={env} className="space-y-4">
                    <h4 className="text-md font-semibold text-indigo-600 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-indigo-500"></span> Môi trường {env}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pl-4 border-l-2 border-indigo-50">
                      {appsInEnv.map(app => (
                        <div key={app.id} onClick={() => setSelectedApp(app)} className="bg-gray-50/50 p-5 rounded-2xl hover:bg-white hover:shadow-xl transition-all cursor-pointer border group flex flex-col items-center text-center relative">
                          {!isPublic && hasAddPermission && <button onClick={(e) => { e.stopPropagation(); openEditModal(app); }} className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"><Edit className="w-4 h-4"/></button>}
                          <div className="w-14 h-14 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white mb-4 shadow-md"><AppWindow className="w-6 h-6" /></div>
                          <h3 className="font-bold text-gray-800 text-base mb-1">{app.name}</h3><p className="text-xs text-gray-500 line-clamp-2 h-8">{app.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedApp && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div style={{ backgroundColor: BG_CONTAINER }} className="rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
            <button onClick={() => setSelectedApp(null)} className="absolute top-4 right-4 text-gray-400 hover:bg-gray-100 rounded-full p-1"><X className="w-5 h-5"/></button>
            <div className="p-6 text-center border-b bg-slate-50/50"><div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-md"><AppWindow className="w-8 h-8" /></div><h3 className="text-xl font-bold">{selectedApp.name}</h3><p className="text-sm text-gray-500 mt-1">{selectedApp.desc}</p></div>
            <div className="p-6 space-y-5">
              <div><label className="flex items-center gap-2 text-sm font-semibold mb-2"><Globe className="w-4 h-4 text-emerald-600"/> Link Truy cập Web</label><a href={selectedApp.webLink} target="_blank" className="flex items-center justify-between w-full bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg p-3 group"><span className="truncate mr-2 font-medium">{selectedApp.webLink || 'Chưa khai báo'}</span><ExternalLink className="w-4 h-4 shrink-0 group-hover:scale-110"/></a></div>
              <div><label className="flex items-center gap-2 text-sm font-semibold mb-2"><Database className="w-4 h-4 text-teal-600"/> Chuỗi kết nối DB</label><div className="flex bg-gray-50 border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2"><input type="text" readOnly value={selectedApp.dbString || 'Chưa khai báo'} className="flex-1 bg-transparent px-3 py-2 text-sm outline-none" /><button onClick={() => handleCopy(selectedApp.dbString)} className="px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 border-l flex items-center gap-2 text-sm">{copyToast ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}{copyToast ? 'Đã copy' : 'Copy'}</button></div></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
