import React from 'react';
import { Plus, Edit, Trash2, CheckSquare } from 'lucide-react';
import { HEADER_COLOR, BG_CONTAINER } from '../constants';
import { getStatusStyle } from '../helpers';

export function GenericTable({ title, type, data, config, selectedItems, setSelectedItems, hasAddPermission, setBulkEditData, setShowBulkEditModal, handleDeleteSelected, openAddModal, openEditModal }) {
  const selected = selectedItems[type] || [];
  const isAllSelected = data.length > 0 && selected.length === data.length;
  const toggleSelectAll = () => setSelectedItems({...selectedItems, [type]: isAllSelected ? [] : data.map(d => d.id)});
  const toggleSelect = (id) => setSelectedItems({...selectedItems, [type]: selected.includes(id) ? selected.filter(i => i !== id) : [...selected, id]});

  return (
    <div className="space-y-4 animate-fade-in relative">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        <div className="flex items-center gap-3">
          {selected.length > 0 && hasAddPermission && (
            <div className="flex bg-indigo-50 border border-indigo-100 rounded-lg overflow-hidden shadow-sm">
              <span className="px-3 py-2 text-sm font-medium text-indigo-800 border-r border-indigo-100">Đã chọn {selected.length}</span>
              <button onClick={() => { setBulkEditData({ type, field: config[0].key, value: '' }); setShowBulkEditModal(true); }} className="flex items-center gap-1.5 px-3 py-2 text-sm text-indigo-700 hover:bg-indigo-100"><CheckSquare className="w-4 h-4" /> Sửa loạt</button>
              <button onClick={() => handleDeleteSelected(type, selected)} className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 hover:bg-red-100 border-l border-indigo-100"><Trash2 className="w-4 h-4" /> Xóa</button>
            </div>
          )}
          {hasAddPermission && <button onClick={() => openAddModal(type)} style={{ backgroundColor: HEADER_COLOR }} className="flex items-center gap-2 text-white px-4 py-2 rounded-lg hover:opacity-90 shadow-sm"><Plus className="w-4 h-4" /> Thêm mới</button>}
        </div>
      </div>
      <div style={{ backgroundColor: BG_CONTAINER }} className="rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar relative">
          <table className="w-full text-sm text-left text-gray-600 whitespace-nowrap">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
              <tr>
                {hasAddPermission && <th className="px-4 py-3 w-10 text-center"><input type="checkbox" checked={isAllSelected} onChange={toggleSelectAll} className="w-4 h-4 text-indigo-600 rounded cursor-pointer" /></th>}
                {config.map((col, idx) => <th key={idx} className="px-4 py-3">{col.label}</th>)}
                {hasAddPermission && <th className="px-4 py-3 text-center sticky right-0 bg-gray-50 z-20 shadow-[-4px_0_10px_rgba(0,0,0,0.05)] border-l">Thao tác</th>}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? <tr><td colSpan={config.length + (hasAddPermission ? 2 : 0)} className="px-4 py-8 text-center text-gray-400">Không có dữ liệu phù hợp</td></tr> : data.map((item, idx) => (
                <tr key={idx} className={`border-b transition-colors ${selected.includes(item.id) ? 'bg-indigo-50' : 'bg-white hover:bg-gray-50'}`}>
                  {hasAddPermission && <td className="px-4 py-3 text-center"><input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggleSelect(item.id)} className="w-4 h-4 text-indigo-600 rounded" /></td>}
                  {config.map((col, colIdx) => (
                    <td key={colIdx} className="px-4 py-3">
                      {col.key === 'status' ? <span className={`px-2 py-1 rounded border text-xs font-bold ${getStatusStyle(item[col.key])}`}>{item[col.key] || '-'}</span> : col.key === 'env' ? <span className="bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded font-medium text-xs">{item[col.key]}</span> : item[col.key] || '-'}
                    </td>
                  ))}
                  {hasAddPermission && (
                    <td className="px-4 py-3 text-center sticky right-0 bg-inherit z-10 shadow-[-4px_0_10px_rgba(0,0,0,0.03)] border-l">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openEditModal(type, item)} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded" title="Sửa"><Edit className="w-4 h-4"/></button>
                        <button onClick={() => handleDeleteSelected(type, [item.id])} className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded" title="Xóa"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function UserGroupsTable({ data, selectedItems, setSelectedItems, handleDeleteSelected, openAddModal, openEditModal }) {
  const selected = selectedItems['userGroup'] || [];
  const isAllSelected = data.length > 0 && selected.length === data.length;
  const toggleSelectAll = () => setSelectedItems({...selectedItems, userGroup: isAllSelected ? [] : data.map(d => d.id)});
  const toggleSelect = (id) => setSelectedItems({...selectedItems, userGroup: selected.includes(id) ? selected.filter(i => i !== id) : [...selected, id]});

  return (
    <div className="space-y-4 animate-fade-in relative">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Quản lý Nhóm Quyền</h2>
        <div className="flex items-center gap-3">
          {selected.length > 0 && <button onClick={() => handleDeleteSelected('userGroup', selected)} className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg"><Trash2 className="w-4 h-4" /> Xóa Nhóm</button>}
          <button onClick={() => openAddModal('userGroup')} style={{ backgroundColor: HEADER_COLOR }} className="flex items-center gap-2 text-white px-4 py-2 rounded-lg hover:opacity-90"><Plus className="w-4 h-4" /> Tạo Nhóm</button>
        </div>
      </div>
      <div style={{ backgroundColor: BG_CONTAINER }} className="rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm text-left text-gray-600">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
            <tr><th className="px-4 py-3 w-10 text-center"><input type="checkbox" checked={isAllSelected} onChange={toggleSelectAll} className="w-4 h-4 text-indigo-600 rounded" /></th><th className="px-4 py-3">Tên Nhóm</th><th className="px-4 py-3">Quyền thao tác</th><th className="px-4 py-3 text-center">Thao tác</th></tr>
          </thead>
          <tbody>
            {data.map((g, idx) => (
              <tr key={idx} className={`border-b transition-colors ${selected.includes(g.id) ? 'bg-indigo-50' : 'bg-white hover:bg-gray-50'}`}>
                <td className="px-4 py-3 text-center"><input type="checkbox" checked={selected.includes(g.id)} onChange={() => toggleSelect(g.id)} className="w-4 h-4 text-indigo-600 rounded" /></td>
                <td className="px-4 py-3 font-bold text-indigo-800">{g.groupName}</td>
                <td className="px-4 py-3"><div className="flex gap-2"><span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">Xem: {Object.values(g.permissions || {}).filter(p => p.view).length}</span><span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs">Sửa: {Object.values(g.permissions || {}).filter(p => p.add).length}</span></div></td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => openEditModal('userGroup', g)} className="p-1.5 text-blue-600 bg-blue-50 rounded"><Edit className="w-4 h-4"/></button>
                    <button onClick={() => handleDeleteSelected('userGroup', [g.id])} className="p-1.5 text-red-600 bg-red-50 rounded"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SystemUsersTable({ data, userGroups, selectedItems, setSelectedItems, handleDeleteSelected, openAddModal, openEditModal }) {
  const selected = selectedItems['systemUser'] || [];
  const isAllSelected = data.length > 0 && selected.length === data.length;
  const toggleSelectAll = () => setSelectedItems({...selectedItems, systemUser: isAllSelected ? [] : data.map(d => d.id)});
  const toggleSelect = (id) => setSelectedItems({...selectedItems, systemUser: selected.includes(id) ? selected.filter(i => i !== id) : [...selected, id]});

  return (
    <div className="space-y-4 animate-fade-in relative">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Quản trị Người dùng</h2>
        <div className="flex items-center gap-3">
          {selected.length > 0 && <button onClick={() => handleDeleteSelected('systemUser', selected)} className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg"><Trash2 className="w-4 h-4" /> Xóa TK</button>}
          <button onClick={() => openAddModal('systemUser')} style={{ backgroundColor: HEADER_COLOR }} className="flex items-center gap-2 text-white px-4 py-2 rounded-lg hover:opacity-90"><Plus className="w-4 h-4" /> Tạo TK</button>
        </div>
      </div>
      <div style={{ backgroundColor: BG_CONTAINER }} className="rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm text-left text-gray-600">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
            <tr><th className="px-4 py-3 w-10 text-center"><input type="checkbox" checked={isAllSelected} onChange={toggleSelectAll} className="w-4 h-4 text-indigo-600 rounded" /></th><th className="px-4 py-3">Tài khoản</th><th className="px-4 py-3">Họ Tên</th><th className="px-4 py-3">Nhóm Quyền</th><th className="px-4 py-3 text-center">Thao tác</th></tr>
          </thead>
          <tbody>
            {data.map((u, idx) => (
              <tr key={idx} className={`border-b transition-colors ${selected.includes(u.id) ? 'bg-indigo-50' : 'bg-white hover:bg-gray-50'}`}>
                <td className="px-4 py-3 text-center"><input type="checkbox" checked={selected.includes(u.id)} onChange={() => toggleSelect(u.id)} className="w-4 h-4 text-indigo-600 rounded" /></td>
                <td className="px-4 py-3 font-medium text-indigo-700">{u.username}</td>
                <td className="px-4 py-3">{u.fullName}</td>
                <td className="px-4 py-3"><span className="bg-gray-100 text-gray-700 px-2 py-1 rounded font-medium text-xs">{userGroups.find(g => g.id === u.groupId)?.groupName || 'Chưa gán'}</span></td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => openEditModal('systemUser', u)} className="p-1.5 text-blue-600 bg-blue-50 rounded"><Edit className="w-4 h-4"/></button>
                    <button onClick={() => handleDeleteSelected('systemUser', [u.id])} className="p-1.5 text-red-600 bg-red-50 rounded"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
