import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Table as TableIcon, 
  LayoutGrid, 
  ClipboardList, 
  Save, 
  Trash2, 
  Plus, 
  AlertCircle, 
  CheckSquare, 
  Square, 
  Edit3,
  X
} from 'lucide-react';

/**
 * PROJECT PLAN MANAGER - FULL VERSION
 * Chế độ: Grid Edit, Gantt Chart, Excel Import
 */
export default function ProjectPlanManager({ 
  tasks = [],        // Dữ liệu đã lọc từ App.jsx
  selectedUnit,      // Đơn vị hiện tại
  selectedIds = [],  // Danh sách ID đang chọn
  setSelectedIds,    // Hàm cập nhật danh sách chọn
  onUpdateRow,       // Hàm cập nhật từng dòng (Inline Edit)
  onBulkCreate,      // Hàm lưu nhiều dòng từ Excel
  onDelete,          // Hàm xóa (nhận mảng IDs)
  onOpenBulkEdit     // Hàm mở Modal sửa hàng loạt
}) {
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'gantt' | 'excel'
  const [excelGridRows, setExcelGridRows] = useState([{}, {}, {}, {}, {}]); 
  
  const HEADER_COLOR = '#006D5B'; // Đồng bộ với constants.js

  // --- HELPER LOGIC ---
  const formatDateDisplay = (dateStr) => {
    if (!dateStr || !dateStr.includes('-')) return dateStr;
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  // --- MULTI-SELECT LOGIC ---
  const toggleSelectAll = () => {
    if (selectedIds.length === tasks.length && tasks.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(tasks.map(t => t.id));
    }
  };

  const toggleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // --- INLINE EDIT LOGIC ---
  const handleInlineChange = (id, field, value) => {
    const originalRow = tasks.find(t => t.id === id);
    if (originalRow) {
      onUpdateRow(id, { ...originalRow, [field]: value });
    }
  };

  // --- GANTT CALCULATION ---
  const ganttData = useMemo(() => {
    if (!tasks || tasks.length === 0) return { months: [], tasksWithPos: [] };
    
    const dates = tasks.flatMap(t => [new Date(t.start), new Date(t.end)]);
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    // Set về đầu tháng của ngày nhỏ nhất
    const startView = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    
    const months = [];
    let curr = new Date(startView);
    while (curr <= maxDate || months.length < 3) {
      months.push(new Date(curr));
      curr.setMonth(curr.getMonth() + 1);
    }

    const totalTime = months[months.length - 1].getTime() + (30 * 24 * 3600 * 1000) - startView.getTime();

    const tasksWithPos = tasks.map(t => {
      const s = new Date(t.start);
      const e = new Date(t.end);
      const left = ((s - startView) / totalTime) * 100;
      const width = ((e - s) / totalTime) * 100;
      return { ...t, left, width };
    });

    return { months, tasksWithPos };
  }, [tasks]);

  // --- EXCEL PASTE LOGIC ---
  const handleExcelPaste = (e, rIdx, cIdx) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text');
    if (!pasteData) return;

    const rows = pasteData.split(/\r?\n/).filter(row => row.trim() !== '');
    const newGrid = [...excelGridRows];
    const cols = ['unit', 'name', 'start', 'end', 'bold'];

    rows.forEach((rowStr, i) => {
      const cells = rowStr.split('\t');
      const targetR = rIdx + i;
      if (!newGrid[targetR]) newGrid[targetR] = {};
      cells.forEach((val, j) => {
        const targetC = cIdx + j;
        if (targetC < cols.length) {
          let finalVal = val.trim();
          // Chuyển date DD/MM/YYYY sang YYYY-MM-DD
          if ((cols[targetC] === 'start' || cols[targetC] === 'end') && finalVal.includes('/')) {
            const [d, m, y] = finalVal.split('/');
            finalVal = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
          }
          newGrid[targetR][cols[targetC]] = finalVal;
        }
      });
    });
    setExcelGridRows(newGrid);
  };

  const saveExcelData = () => {
    const toSave = excelGridRows
      .filter(r => r.name && r.start && r.end)
      .map(r => ({
        ...r,
        unit: r.unit || selectedUnit,
        bold: r.bold?.toLowerCase() === 'x' || r.bold === 'true'
      }));
    if (toSave.length > 0) {
      onBulkCreate(toSave);
      setExcelGridRows([{}, {}, {}, {}, {}]);
      setViewMode('table');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* TOOLBAR */}
      <div className="p-4 border-b flex justify-between items-center bg-slate-50/50 sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-200 p-1 rounded-lg">
            <button onClick={() => setViewMode('table')} className={`px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${viewMode === 'table' ? 'bg-white shadow text-emerald-700' : 'text-gray-600'}`}><TableIcon className="w-4 h-4"/> Grid View</button>
            <button onClick={() => setViewMode('gantt')} className={`px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${viewMode === 'gantt' ? 'bg-white shadow text-emerald-700' : 'text-gray-600'}`}><LayoutGrid className="w-4 h-4"/> Gantt View</button>
            <button onClick={() => setViewMode('excel')} className={`px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${viewMode === 'excel' ? 'bg-white shadow text-emerald-700' : 'text-gray-600'}`}><ClipboardList className="w-4 h-4"/> Excel Paste</button>
          </div>

          {selectedIds.length > 0 && viewMode === 'table' && (
            <div className="flex items-center gap-2 pl-4 border-l border-gray-300 animate-in fade-in slide-in-from-left-2">
              <span className="text-xs font-black text-emerald-700">Đã chọn {selectedIds.length} dòng</span>
              <button onClick={onOpenBulkEdit} className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded text-[10px] font-bold hover:bg-amber-200 uppercase tracking-tight"><Edit3 className="w-3 h-3"/> Sửa nhanh</button>
              <button onClick={() => onDelete(selectedIds)} className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded text-[10px] font-bold hover:bg-red-200 uppercase tracking-tight"><Trash2 className="w-3 h-3"/> Xóa mục chọn</button>
            </div>
          )}
        </div>

        {viewMode === 'excel' && (
          <button onClick={saveExcelData} style={{ backgroundColor: HEADER_COLOR }} className="px-6 py-2 text-white rounded-lg flex items-center gap-2 text-sm font-bold shadow-md hover:brightness-110 active:scale-95 transition-all"><Save className="w-4 h-4" /> Lưu dữ liệu Excel</button>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4 custom-scrollbar">
        {/* VIEW 1: TABLE GRID (INLINE EDIT) */}
        {viewMode === 'table' && (
          <table className="w-full text-xs border-collapse">
            <thead className="bg-gray-100 sticky top-0 z-20">
              <tr className="text-gray-500 uppercase text-[10px] tracking-widest">
                <th className="p-3 border-b text-center w-12">
                  <button onClick={toggleSelectAll} className="hover:text-emerald-600 transition-colors">
                    {selectedIds.length === tasks.length && tasks.length > 0 ? <CheckSquare className="w-5 h-5 text-emerald-600"/> : <Square className="w-5 h-5"/>}
                  </button>
                </th>
                <th className="p-3 border-b font-black w-32 text-left">Đơn vị</th>
                <th className="p-3 border-b font-black text-left">Nội dung công việc</th>
                <th className="p-3 border-b font-black text-center w-40">Ngày bắt đầu</th>
                <th className="p-3 border-b font-black text-center w-40">Ngày kết thúc</th>
                <th className="p-3 border-b font-black text-center w-20">Đậm</th>
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 ? (
                <tr><td colSpan="6" className="p-10 text-center text-gray-400 italic">Không có dữ liệu hiển thị. Hãy chọn "Excel Paste" để nhập nhanh.</td></tr>
              ) : (
                tasks.map((task) => (
                  <tr key={task.id} className={`group border-b border-gray-50 transition-colors ${selectedIds.includes(task.id) ? 'bg-emerald-50/50' : 'hover:bg-slate-50'}`}>
                    <td className="p-2 text-center">
                      <button onClick={() => toggleSelectOne(task.id)}>
                        {selectedIds.includes(task.id) ? <CheckSquare className="w-4 h-4 text-emerald-600"/> : <Square className="w-4 h-4 text-gray-300 group-hover:text-gray-400"/>}
                      </button>
                    </td>
                    <td className="p-1">
                      <input className="w-full p-2 bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-emerald-300 rounded font-bold text-indigo-700" value={task.unit || ''} onChange={(e) => handleInlineChange(task.id, 'unit', e.target.value)} />
                    </td>
                    <td className="p-1">
                      <input className={`w-full p-2 bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-emerald-300 rounded ${task.bold ? 'font-black text-black' : 'text-gray-700'}`} value={task.name || ''} onChange={(e) => handleInlineChange(task.id, 'name', e.target.value)} />
                    </td>
                    <td className="p-1">
                      <input type="date" className="w-full p-2 bg-transparent outline-none focus:bg-white text-center" value={task.start || ''} onChange={(e) => handleInlineChange(task.id, 'start', e.target.value)} />
                    </td>
                    <td className="p-1">
                      <input type="date" className="w-full p-2 bg-transparent outline-none focus:bg-white text-center" value={task.end || ''} onChange={(e) => handleInlineChange(task.id, 'end', e.target.value)} />
                    </td>
                    <td className="p-1 text-center">
                      <input type="checkbox" checked={task.bold || false} onChange={(e) => handleInlineChange(task.id, 'bold', e.target.checked)} className="w-4 h-4 accent-emerald-600 cursor-pointer" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {/* VIEW 2: GANTT CHART */}
        {viewMode === 'gantt' && (
          <div className="min-w-[1200px] select-none">
            {/* Timeline Headers */}
            <div className="flex border-b border-gray-200 sticky top-0 z-20 bg-white">
              <div className="w-80 shrink-0 p-4 border-r font-black text-[10px] text-gray-400 uppercase tracking-widest bg-gray-50">Danh mục tiến độ</div>
              <div className="flex-1 flex">
                {ganttData.months.map((m, i) => (
                  <div key={i} className="flex-1 text-center py-4 text-[10px] font-black border-r border-gray-100 text-emerald-800 bg-emerald-50/20">
                    THÁNG {m.getMonth() + 1} / {m.getFullYear()}
                  </div>
                ))}
              </div>
            </div>
            {/* Gantt Bars */}
            <div className="mt-2 space-y-1.5 pb-20">
              {ganttData.tasksWithPos.map((task) => (
                <div key={task.id} className="flex group hover:bg-slate-50 items-center">
                  <div className={`w-80 shrink-0 px-4 py-2 border-r text-xs truncate ${task.bold ? 'font-black text-black' : 'text-gray-500'}`}>
                    {task.name}
                  </div>
                  <div className="flex-1 h-10 relative bg-gray-50/30">
                    <div 
                      className={`absolute top-2 h-6 rounded shadow-sm transition-all duration-700 flex items-center px-2 text-[8px] text-white font-bold whitespace-nowrap overflow-hidden
                        ${task.bold ? 'bg-emerald-600 z-10 shadow-emerald-200' : 'bg-amber-400 opacity-80 group-hover:opacity-100'}`}
                      style={{ left: `${task.left}%`, width: `${task.width}%`, minWidth: '4px' }}
                    >
                      {task.width > 5 && formatDateDisplay(task.start)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 3: EXCEL PASTE MODE */}
        {viewMode === 'excel' && (
          <div className="max-w-6xl mx-auto flex flex-col gap-4">
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-800 tracking-tight">Quy trình nhập dữ liệu hàng loạt</p>
                <p className="text-xs text-amber-700 mt-1">1. Copy vùng dữ liệu từ Excel (Cột: Đơn vị, Nội dung, Bắt đầu, Kết thúc, Đậm). | 2. Chọn ô đầu tiên dưới đây. | 3. Nhấn Ctrl+V.</p>
              </div>
            </div>
            <div className="border rounded-lg bg-white p-2 shadow-inner">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-500">
                    <th className="border p-2 w-10">#</th>
                    <th className="border p-2">Đơn vị</th>
                    <th className="border p-2 text-left">Tên công việc</th>
                    <th className="border p-2 w-40">Bắt đầu</th>
                    <th className="border p-2 w-40">Kết thúc</th>
                    <th className="border p-2 w-20">Đậm (x)</th>
                  </tr>
                </thead>
                <tbody>
                  {excelGridRows.map((row, rIdx) => (
                    <tr key={rIdx}>
                      <td className="border p-2 text-center bg-gray-50 text-gray-400 font-mono">{rIdx + 1}</td>
                      <td className="border p-0"><input className="w-full p-2 outline-none focus:bg-blue-50" value={row.unit || ''} onPaste={(e) => handleExcelPaste(e, rIdx, 0)} onChange={(e) => { const n = [...excelGridRows]; n[rIdx].unit = e.target.value; setExcelGridRows(n); }} /></td>
                      <td className="border p-0"><input className="w-full p-2 outline-none focus:bg-blue-50" value={row.name || ''} onPaste={(e) => handleExcelPaste(e, rIdx, 1)} onChange={(e) => { const n = [...excelGridRows]; n[rIdx].name = e.target.value; setExcelGridRows(n); }} /></td>
                      <td className="border p-0"><input className="w-full p-2 outline-none focus:bg-blue-50 text-center" value={row.start || ''} onPaste={(e) => handleExcelPaste(e, rIdx, 2)} onChange={(e) => { const n = [...excelGridRows]; n[rIdx].start = e.target.value; setExcelGridRows(n); }} /></td>
                      <td className="border p-0"><input className="w-full p-2 outline-none focus:bg-blue-50 text-center" value={row.end || ''} onPaste={(e) => handleExcelPaste(e, rIdx, 3)} onChange={(e) => { const n = [...excelGridRows]; n[rIdx].end = e.target.value; setExcelGridRows(n); }} /></td>
                      <td className="border p-0"><input className="w-full p-2 outline-none focus:bg-blue-50 text-center" value={row.bold || ''} onPaste={(e) => handleExcelPaste(e, rIdx, 4)} onChange={(e) => { const n = [...excelGridRows]; n[rIdx].bold = e.target.value; setExcelGridRows(n); }} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button onClick={() => setExcelGridRows([...excelGridRows, {}])} className="mt-4 flex items-center gap-2 text-xs font-black text-emerald-700 hover:opacity-70 px-2 uppercase"><Plus className="w-4 h-4"/> Thêm dòng mới</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
