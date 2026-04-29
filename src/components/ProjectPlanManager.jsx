import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Table as TableIcon, LayoutGrid, ClipboardList, 
  Save, Trash2, Plus, AlertCircle, CheckSquare, Square, X, RotateCcw 
} from 'lucide-react';

/**
 * PROJECT PLAN MANAGER - PHIÊN BẢN ĐẦY ĐỦ NHẤT
 * - View mặc định: Gantt Chart
 * - Gantt: Màu Pastel, hiện tên công việc trên thanh Bar
 * - Grid: Sửa trực tiếp, chọn nhiều dòng để xóa
 * - Excel: Dán dữ liệu trực tiếp, tự động format ngày
 * - Logic: Lưu tập trung một lần để tối ưu tốc độ
 */
export default function ProjectPlanManager({ 
  tasks = [], 
  selectedUnit,
  selectedIds = [], 
  setSelectedIds,
  onBatchUpdate, 
  onBulkCreate, 
  onDelete
}) {
  // 1. Khởi tạo trạng thái mặc định
  const [viewMode, setViewMode] = useState('gantt'); 
  const [localTasks, setLocalTasks] = useState([]); // Chứa dữ liệu đang sửa tạm thời
  const [excelGridRows, setExcelGridRows] = useState([{}, {}, {}, {}, {}]);
  
  const HEADER_COLOR = '#006D5B'; // Màu chuẩn từ constants.js

  // Dải màu Pastel dịu mắt gán cho các thanh bar
  const PASTEL_COLORS = [
    '#FFD1DC', '#FFB347', '#B39EB5', '#77DD77', '#AEC6CF', 
    '#F49AC2', '#CB99C9', '#FDFD96', '#836953', '#779ECB'
  ];

  // Đồng bộ dữ liệu từ Server vào Local State khi App tải xong
  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  // Kiểm tra xem dữ liệu local có khác dữ liệu gốc không để hiện nút Lưu
  const hasChanges = useMemo(() => {
    return JSON.stringify(localTasks) !== JSON.stringify(tasks);
  }, [localTasks, tasks]);

  // --- LOGIC QUẢN LÝ LỰA CHỌN (MULTI-SELECT) ---
  const toggleSelectAll = () => {
    if (selectedIds.length === localTasks.length && localTasks.length > 0) setSelectedIds([]);
    else setSelectedIds(localTasks.map(t => t.id));
  };

  const toggleSelectOne = (id) => {
    if (selectedIds.includes(id)) setSelectedIds(selectedIds.filter(i => i !== id));
    else setSelectedIds([...selectedIds, id]);
  };

  // --- LOGIC SỬA TRỰC TIẾP TRÊN GRID (INLINE EDIT) ---
  const handleLocalChange = (id, field, value) => {
    setLocalTasks(localTasks.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const handleReset = () => {
    if (window.confirm("Hủy bỏ tất cả các thay đổi chưa lưu?")) {
      setLocalTasks(tasks);
    }
  };

  const handleSaveAll = () => {
    onBatchUpdate(localTasks);
  };

  // --- LOGIC XỬ LÝ GANTT CHART ---
  const ganttData = useMemo(() => {
    if (!localTasks || localTasks.length === 0) return { months: [], tasksWithPos: [] };
    
    const dates = localTasks.flatMap(t => [new Date(t.start), new Date(t.end)]);
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    // View bắt đầu từ đầu tháng của ngày nhỏ nhất
    const startView = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    
    const months = [];
    let curr = new Date(startView);
    // Luôn hiển thị ít nhất 3 tháng
    while (curr <= maxDate || months.length < 3) {
      months.push(new Date(curr));
      curr.setMonth(curr.getMonth() + 1);
    }

    // Tính toán tổng thời gian hiển thị (mili giây)
    const totalTime = (months[months.length - 1].getTime() + (30 * 24 * 3600 * 1000)) - startView.getTime();

    const tasksWithPos = localTasks.map((t, index) => {
      const s = new Date(t.start);
      const e = new Date(t.end);
      // Tính vị trí % từ bên trái và độ rộng % của thanh bar
      const left = ((s - startView) / totalTime) * 100;
      const width = ((e - s) / totalTime) * 100;
      const color = PASTEL_COLORS[index % PASTEL_COLORS.length];
      return { ...t, left, width, color };
    });

    return { months, tasksWithPos };
  }, [localTasks]);

  // --- LOGIC NHẬP EXCEL ---
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
          // Xử lý chuyển đổi ngày DD/MM/YYYY sang YYYY-MM-DD để input date nhận diện
          if ((cols[targetC] === 'start' || cols[targetC] === 'end') && finalVal.includes('/')) {
            const parts = finalVal.split('/');
            if (parts.length === 3) finalVal = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
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
      setViewMode('gantt'); 
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* THANH CÔNG CỤ (TOOLBAR) */}
      <div className="p-4 border-b flex justify-between items-center bg-slate-50/50 sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-200 p-1 rounded-lg">
            <button onClick={() => setViewMode('gantt')} className={`px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${viewMode === 'gantt' ? 'bg-white shadow text-emerald-700' : 'text-gray-600'}`}><LayoutGrid className="w-4 h-4"/> Gantt View</button>
            <button onClick={() => setViewMode('table')} className={`px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${viewMode === 'table' ? 'bg-white shadow text-emerald-700' : 'text-gray-600'}`}><TableIcon className="w-4 h-4"/> Grid Edit</button>
            <button onClick={() => setViewMode('excel')} className={`px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${viewMode === 'excel' ? 'bg-white shadow text-emerald-700' : 'text-gray-600'}`}><ClipboardList className="w-4 h-4"/> Excel Paste</button>
          </div>

          {/* CHỈ HIỆN NÚT XÓA KHI ĐANG Ở GRID VÀ CÓ CHỌN DÒNG */}
          {selectedIds.length > 0 && viewMode === 'table' && (
            <div className="flex items-center gap-2 pl-4 border-l border-gray-300">
              <span className="text-xs font-black text-red-600 tracking-tighter uppercase">Chọn {selectedIds.length} mục</span>
              <button onClick={() => onDelete(selectedIds)} className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded text-[10px] font-bold hover:bg-red-200 transition-colors uppercase"><Trash2 className="w-3 h-3"/> Xóa đã chọn</button>
            </div>
          )}
        </div>

        {/* KHỐI NÚT LƯU THEO TỪNG CHẾ ĐỘ */}
        <div className="flex items-center gap-2">
          {hasChanges && viewMode === 'table' && (
            <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200">
              <button onClick={handleReset} className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg flex items-center gap-2 text-sm font-bold hover:bg-gray-50"><RotateCcw className="w-4 h-4"/> Hủy bỏ</button>
              <button onClick={handleSaveAll} style={{ backgroundColor: HEADER_COLOR }} className="px-6 py-2 text-white rounded-lg flex items-center gap-2 text-sm font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all"><Save className="w-4 h-4" /> Lưu tất cả</button>
            </div>
          )}
          {viewMode === 'excel' && (
            <button onClick={saveExcelData} style={{ backgroundColor: HEADER_COLOR }} className="px-6 py-2 text-white rounded-lg flex items-center gap-2 text-sm font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all"><Save className="w-4 h-4" /> Lưu dữ liệu Excel</button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 custom-scrollbar">
        {/* VIEW 1: GANTT CHART (HIỂN THỊ MẶC ĐỊNH) */}
        {viewMode === 'gantt' && (
          <div className="min-w-[1200px] select-none">
            <div className="flex border-b border-gray-200 sticky top-0 z-20 bg-white shadow-sm">
              <div className="w-80 shrink-0 p-4 border-r font-black text-[10px] text-gray-400 uppercase tracking-widest bg-gray-50">Danh mục tiến độ dự án</div>
              <div className="flex-1 flex">
                {ganttData.months.map((m, i) => (
                  <div key={i} className="flex-1 text-center py-4 text-[10px] font-black border-r border-gray-100 text-emerald-800 bg-emerald-50/20 uppercase">
                    Tháng {m.getMonth() + 1} / {m.getFullYear()}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 space-y-2 pb-20">
              {ganttData.tasksWithPos.map((task) => (
                <div key={task.id} className="flex group hover:bg-slate-50 items-center border-b border-gray-50">
                  <div className={`w-80 shrink-0 px-4 py-3 border-r text-xs truncate ${task.bold ? 'font-black text-black bg-emerald-50/5' : 'text-gray-500'}`}>
                    {task.name}
                  </div>
                  <div className="flex-1 h-12 relative bg-gray-50/20">
                    <div 
                      className="absolute top-2 h-8 rounded-md shadow-sm transition-all duration-700 flex items-center px-3 text-[10px] text-gray-800 font-bold whitespace-nowrap overflow-hidden border border-black/5" 
                      style={{ 
                        left: `${task.left}%`, 
                        width: `${task.width}%`, 
                        minWidth: '40px', 
                        backgroundColor: task.color // Màu pastel dịu mắt
                      }}
                      title={`${task.name}: ${task.start} đến ${task.end}`}
                    >
                      {/* Hiển thị tên công việc trực tiếp trên bar */}
                      {task.width > 2 && <span className="truncate">{task.name}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 2: GRID TABLE (INLINE EDIT) */}
        {viewMode === 'table' && (
          <table className="w-full text-xs border-collapse">
            <thead className="bg-gray-100 sticky top-0 z-20 shadow-sm">
              <tr className="text-gray-500 uppercase text-[10px] tracking-widest">
                <th className="p-3 border-b text-center w-12">
                  <button onClick={toggleSelectAll}>{selectedIds.length === localTasks.length && localTasks.length > 0 ? <CheckSquare className="w-5 h-5 text-emerald-600"/> : <Square className="w-5 h-5"/>}</button>
                </th>
                <th className="p-3 border-b font-black w-32 text-left">Đơn vị</th>
                <th className="p-3 border-b font-black text-left">Nội dung công việc</th>
                <th className="p-3 border-b font-black text-center w-44">Bắt đầu</th>
                <th className="p-3 border-b font-black text-center w-44">Kết thúc</th>
                <th className="p-3 border-b font-black text-center w-20">Đậm</th>
              </tr>
            </thead>
            <tbody>
              {localTasks.map((task) => (
                <tr key={task.id} className={`group border-b border-gray-50 transition-colors ${selectedIds.includes(task.id) ? 'bg-red-50/30' : 'hover:bg-slate-50'}`}>
                  <td className="p-2 text-center">
                    <button onClick={() => toggleSelectOne(task.id)}>{selectedIds.includes(task.id) ? <CheckSquare className="w-4 h-4 text-red-600"/> : <Square className="w-4 h-4 text-gray-300"/>}</button>
                  </td>
                  <td className="p-1"><input className="w-full p-2 bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-emerald-300 rounded font-bold text-indigo-700" value={task.unit || ''} onChange={(e) => handleLocalChange(task.id, 'unit', e.target.value)} /></td>
                  <td className="p-1"><input className={`w-full p-2 bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-emerald-300 rounded ${task.bold ? 'font-black text-black' : 'text-gray-700'}`} value={task.name || ''} onChange={(e) => handleLocalChange(task.id, 'name', e.target.value)} /></td>
                  <td className="p-1"><input type="date" className="w-full p-2 bg-transparent outline-none focus:bg-white text-center" value={task.start || ''} onChange={(e) => handleLocalChange(task.id, 'start', e.target.value)} /></td>
                  <td className="p-1"><input type="date" className="w-full p-2 bg-transparent outline-none focus:bg-white text-center" value={task.end || ''} onChange={(e) => handleLocalChange(task.id, 'end', e.target.value)} /></td>
                  <td className="p-1 text-center"><input type="checkbox" checked={task.bold || false} onChange={(e) => handleLocalChange(task.id, 'bold', e.target.checked)} className="w-4 h-4 accent-emerald-600 cursor-pointer" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* VIEW 3: EXCEL PASTE MODE */}
        {viewMode === 'excel' && (
          <div className="max-w-6xl mx-auto flex flex-col gap-4 pt-4">
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div><p className="text-sm font-bold text-amber-800 tracking-tight">Quy trình nhập liệu Excel</p><p className="text-xs text-amber-700 mt-1 italic">Dán dữ liệu trực tiếp vào lưới bên dưới. Cột hỗ trợ: Đơn vị, Nội dung, Ngày bắt đầu, Ngày kết thúc, In đậm (x).</p></div>
            </div>
            <div className="border rounded-lg bg-white p-2 shadow-inner">
              <table className="w-full text-xs border-collapse">
                <thead><tr className="bg-gray-100 text-gray-500 uppercase tracking-tighter text-[10px]"><th className="border p-2 w-10">#</th><th className="border p-2">Đơn vị</th><th className="border p-2 text-left">Tên công việc</th><th className="border p-2 w-40">Bắt đầu</th><th className="border p-2 w-40">Kết thúc</th><th className="border p-2 w-20">Đậm (x)</th></tr></thead>
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
