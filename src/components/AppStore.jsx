import React, { useState } from 'react';
import { Plus, Building2, AppWindow, Edit, Globe, ExternalLink, Database, Copy, Check, X, Trash2, AlertTriangle } from 'lucide-react';

// Khai báo trực tiếp các hằng số để tránh lỗi không tìm thấy module
const HEADER_COLOR = '#059669'; 
const BG_CONTAINER = '#ffffff';

// Thêm prop onDeleteApp để component cha xử lý việc gọi API xóa
export default function AppStore({ isPublic, filteredApps, hasAddPermission, openAddModal, openEditModal, onDeleteApp }) {
  const [selectedApp, setSelectedApp] = useState(null);
  const [copyToast, setCopyToast] = useState(false);
  const [appToDelete, setAppToDelete] = useState(null); // State quản lý popup xác nhận xóa

  const handleCopy = (text) => {
    const el = document.createElement('textarea'); el.value = text;
    document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el);
    setCopyToast(true); setTimeout(() => setCopyToast(false), 2000);
  };

  // Nhóm theo Đơn vị -> Môi trường -> Phân loại (Web/DB/Khác)
  const groupedApps = filteredApps.reduce((acc, app) => {
    if (!acc[app.unit]) acc[app.unit] = {};
    if (!acc[app.unit][app.env]) acc[app.unit][app.env] = { Web: [], DB: [], Khác: [] }; // Khởi tạo sẵn 3 hàng theo thứ tự ưu tiên
    
    const t = String(app.type || '').toLowerCase();
    const typeKey = t === 'web' ? 'Web' : t === 'db' ? 'DB' : 'Khác';
    
    acc[app.unit][app.env][typeKey].push(app);
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Kho Ứng dụng {isPublic && '(Public)'}</h2>
        {!isPublic && hasAddPermission && (
          <button onClick={openAddModal} style={{ backgroundColor: HEADER_COLOR }} className="flex items-center gap-2 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" /> Khai báo Ứng dụng
          </button>
        )}
      </div>
      
      {Object.keys(groupedApps).length === 0 ? (
        <div style={{ backgroundColor: BG_CONTAINER }} className="text-center text-gray-400 py-10 rounded-xl shadow-sm border">Không có ứng dụng nào</div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedApps).map(([unit, envs]) => (
            <div key={unit} style={{ backgroundColor: BG_CONTAINER }} className="space-y-4 p-5 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"><Building2 className="w-5 h-5" /></div>
                <h3 className="text-lg font-bold text-gray-800">{unit}</h3>
              </div>
              <div className="space-y-6 pt-1">
                {Object.entries(envs).map(([env, typesInEnv]) => (
                  <div key={env} className="space-y-3">
                    <h4 className="text-sm font-semibold text-indigo-600 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Môi trường {env}
                    </h4>
                    
                    {/* Các hàng ứng dụng */}
                    <div className="pl-3 space-y-3 border-l-2 border-indigo-50">
                      {['Web', 'DB', 'Khác'].map(typeKey => {
                        const appsInType = typesInEnv[typeKey];
                        if (!appsInType || appsInType.length === 0) return null; 
                        
                        return (
                          <div key={typeKey} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {/* Render các App với thiết kế Component ngang (Horizontal) siêu gọn */}
                            {appsInType.sort((a, b) => (a.name || '').localeCompare(b.name || '')).map(app => (
                              <div key={app.id} onClick={() => setSelectedApp(app)} className="bg-gray-50 hover:bg-white p-3 rounded-xl hover:shadow-md transition-all cursor-pointer border border-gray-100 group flex items-start gap-3 relative overflow-hidden">
                                
                                {!isPublic && hasAddPermission && (
                                  <div className="absolute top-1 right-1 flex items-center opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm rounded shadow-sm border border-gray-100">
                                    <button onClick={(e) => { e.stopPropagation(); openEditModal(app); }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Sửa">
                                      <Edit className="w-3.5 h-3.5"/>
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); setAppToDelete(app); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded" title="Xóa">
                                      <Trash2 className="w-3.5 h-3.5"/>
                                    </button>
                                  </div>
                                )}

                                <div className={`shrink-0 w-11 h-11 rounded-lg flex items-center justify-center text-white shadow-sm bg-gradient-to-tr ${app.type === 'DB' ? 'from-amber-500 to-orange-500' : app.type === 'Web' ? 'from-emerald-500 to-teal-500' : 'from-slate-400 to-slate-500'}`}>
                                  {app.type === 'DB' ? <Database className="w-5 h-5" /> : <AppWindow className="w-5 h-5" />}
                                </div>
                                
                                <div className="flex-1 min-w-0 text-left pt-0.5">
                                  <h3 className="font-bold text-gray-800 text-sm truncate pr-8">{app.name}</h3>
                                  <p className="text-[11px] text-gray-500 line-clamp-2 leading-snug mt-0.5">{app.desc || 'Không có mô tả'}</p>
                                  <span className={`inline-block mt-1 text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${app.type === 'DB' ? 'bg-amber-100 text-amber-700' : app.type === 'Web' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                    {app.type ? `APP ${app.type}` : 'KHÁC'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal chi tiết ứng dụng */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div style={{ backgroundColor: BG_CONTAINER }} className="rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative animate-fade-in">
            <button onClick={() => setSelectedApp(null)} className="absolute top-3 right-3 text-gray-400 hover:bg-gray-100 rounded-full p-1.5 transition-colors"><X className="w-5 h-5"/></button>
            
            <div className="p-5 text-center border-b bg-slate-50/80">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white mx-auto mb-3 shadow-md bg-gradient-to-tr ${selectedApp.type === 'DB' ? 'from-amber-500 to-orange-500' : selectedApp.type === 'Web' ? 'from-emerald-500 to-teal-500' : 'from-slate-400 to-slate-500'}`}>
                 {selectedApp.type === 'DB' ? <Database className="w-7 h-7" /> : <AppWindow className="w-7 h-7" />}
              </div>
              <h3 className="text-xl font-bold flex justify-center items-center gap-2 text-gray-800">
                {selectedApp.name}
              </h3>
              <p className="text-sm text-gray-500 mt-1">{selectedApp.desc}</p>
            </div>
            
            <div className="p-5 space-y-4">
              {/* Chỉ hiển thị Link Web nếu KHÔNG PHẢI là DB */}
              {selectedApp.type !== 'DB' && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold mb-2 text-gray-700"><Globe className="w-4 h-4 text-emerald-600"/> Link Truy cập Web</label>
                  <a href={selectedApp.webLink} target="_blank" rel="noreferrer" className="flex items-center justify-between w-full bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 border border-emerald-100 hover:border-emerald-200 transition-colors rounded-lg p-3 group">
                    <span className="truncate mr-2 font-medium text-sm">{selectedApp.webLink || 'Chưa khai báo'}</span>
                    <ExternalLink className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform"/>
                  </a>
                </div>
              )}
              
              {/* Chỉ hiển thị Chuỗi kết nối nếu KHÔNG PHẢI là Web */}
              {selectedApp.type !== 'Web' && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold mb-2 text-gray-700"><Database className="w-4 h-4 text-amber-600"/> Chuỗi kết nối DB</label>
                  <div className="flex bg-gray-50 border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-amber-500/20 transition-all">
                    <input type="text" readOnly value={selectedApp.dbString || 'Chưa khai báo'} className="flex-1 bg-transparent px-3 py-2 text-sm outline-none text-gray-700" />
                    <button onClick={() => handleCopy(selectedApp.dbString)} className="px-3 bg-white hover:bg-gray-100 text-gray-600 border-l flex items-center gap-1.5 text-sm transition-colors font-medium">
                      {copyToast ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      {copyToast ? 'Đã copy' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal xác nhận Xóa */}
      {appToDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[70] p-4 backdrop-blur-sm">
          <div style={{ backgroundColor: BG_CONTAINER }} className="rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center animate-fade-in border border-gray-100">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center text-red-500 mx-auto mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Xác nhận xóa</h3>
            <p className="text-gray-500 text-sm mb-6">
              Bạn có chắc chắn muốn xóa ứng dụng <strong className="text-gray-800">{appToDelete.name}</strong>?<br/> Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setAppToDelete(null)} 
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors text-sm"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={() => { 
                  if (onDeleteApp) onDeleteApp(appToDelete.id); 
                  setAppToDelete(null); 
                }} 
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors flex justify-center items-center gap-2 text-sm"
              >
                <Trash2 className="w-4 h-4"/> Xóa ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
