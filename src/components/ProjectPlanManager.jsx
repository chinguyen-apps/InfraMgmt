import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Table as TableIcon, LayoutGrid, ClipboardList, 
  Save, Trash2, Plus, AlertCircle, CheckSquare, Square, X, RotateCcw, Star 
} from 'lucide-react';

export default function ProjectPlanManager({ 
  tasks = [], 
  selectedUnit,
  selectedIds = [], 
  setSelectedIds,
  onBatchUpdate, 
  onBulkCreate, 
  onDelete
}) {
  const [viewMode, setViewMode] = useState('gantt'); 
  const [localTasks, setLocalTasks] = useState([]);
  const [excelGridRows, setExcelGridRows] = useState([{}, {}, {}, {}, {}]);
  const HEADER_COLOR = '#006D5B';

  const PASTEL_COLORS = ['#FFD1DC', '#AEC6CF', '#FDFD96', '#77DD77', '#FFB347', '#B39EB5'];

  useEffect(() => { setLocalTasks(tasks); }, [tasks]);

  const hasChanges = useMemo(() => JSON.stringify(localTasks) !== JSON.stringify(tasks), [localTasks, tasks]);

  // --- LOGIC STYLE THEO LEVEL ---
  const getLevelStyle = (level) => {
    switch (level) {
      case 1: return "font-black text-base text-gray-900"; // Đậm nhất, to nhất
      case 2: return "font-bold italic text-[14px] text-gray-800 pl-4"; // Đậm nghiêng, to nhì, thụt vào
      case 3: return "italic underline text-[13px] text-gray-700 pl-8"; // Nghiêng gạch chân, thụt thêm
      default: return "text-[13px] text-gray-600 pl-12"; // Cấp thấp nhất, thụt sâu nhất
    }
  };

  // --- LOGIC GANTT & TODAY MARKER ---
  const ganttCalculations = useMemo(() => {
    if (!localTasks || localTasks.length === 0) return { months: [], tasksWithPos: [], todayPos: null };
    
    const dates = localTasks.flatMap(t => [new Date(t.start), new Date(t.end)]);
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    const startView = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    
    const months = [];
    let curr = new Date(startView);
    while (curr <= maxDate || months.length < 4) {
      months.push(new Date(curr));
      curr.setMonth(curr.getMonth() + 1);
    }

    const totalTime = (months[months.length - 1].getTime() + (30 * 24 * 3600 * 1000)) - startView.getTime();

    // Tính vị trí đường Today
    const today = new Date();
    const todayPos = ((today - startView) / totalTime) * 100;

    const tasksWithPos = localTasks.map((t, index) => {
      const s = new Date(t.start);
      const e = new Date(t.end);
      const left = ((s - startView) / totalTime) * 100;
      const width = ((e - s) / totalTime) * 100;
      return { ...t, left, width, color: PASTEL_COLORS[index % PASTEL_COLORS.length] };
    });

    return { months, tasksWithPos, todayPos };
  }, [localTasks]);

  // --- EXCEL PASTE LOGIC (Cập nhật cột level) ---
  const handleExcelPaste = (e, rIdx, cIdx) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text');
    if (!pasteData) return;
    const rows = pasteData.split(/\r?\n/).filter(row => row.trim() !== '');
    const newGrid = [...excelGridRows];
    const cols = ['unit', 'name', 'start', 'end', 'level'];
    rows.forEach((rowStr, i) => {
      const cells = rowStr.split('\t');
      const targetR = rIdx + i;
      if (!newGrid[targetR]) newGrid[targetR] = {};
      cells.forEach((val, j) => {
        const targetC = cIdx + j;
        if (targetC < cols.length) {
          let v = val.trim();
          if ((cols[targetC] === 'start' || cols[targetC] === 'end') && v.includes('/')) {
            const p = v.split('/');
            v = `${p[2]}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}`;
          }
          newGrid[targetR][cols[targetC]] = v;
        }
      });
    });
    setExcelGridRows(newGrid);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* TOOLBAR */}
      <div className="p-4 border-b flex justify-between items-center bg-slate-50/50 sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-200 p-1 rounded-lg">
            <button onClick={() => setViewMode('gantt')} className={`px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 ${viewMode === 'gantt' ? 'bg-white shadow text-emerald-700' : 'text-gray-600'}`}><LayoutGrid className="w-4 h-4"/> Gantt View</button>
            <button onClick={() => setViewMode('table')} className={`px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 ${viewMode === 'table' ? 'bg-white shadow text-emerald-700' : 'text-gray-600'}`}><TableIcon className="w-4 h-4"/> Grid Edit</button>
            <button onClick={() => setViewMode('excel')} className={`px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 ${viewMode === 'excel' ? 'bg-white shadow text-emerald-700' : 'text-gray-600'}`}><ClipboardList className="w-4 h-4"/> Excel Paste</button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && viewMode === 'table' && (
            <button onClick={() => onBatchUpdate(localTasks)} style={{ backgroundColor: HEADER_COLOR }} className="px-6 py-2 text-white rounded-lg flex items-center gap-2 text-sm font-bold shadow-lg hover:brightness-110"><Save className="w-4 h-4" /> Lưu thay đổi</button>
          )}
          {viewMode === 'excel' && (
            <button onClick={() => onBulkCreate(excelGridRows.filter(r => r.name).map(r => ({...r, unit: r.unit || selectedUnit})))} style={{ backgroundColor: HEADER_COLOR }} className="px-6 py-2 text-white rounded-lg flex items-center gap-2 text-sm font-bold shadow-lg hover:brightness-110"><Save className="w-4 h-4" /> Lưu Excel</button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 custom-scrollbar">
        {/* VIEW 1: GANTT CHART VỚI TODAY MARKER */}
        {viewMode === 'gantt' && (
          <div className="min-w-[1200px] relative">
            <div className="flex border-b border-gray-200 sticky top-0 z-20 bg-white shadow-sm">
              <div className="w-80 shrink-0 p-4 border-r font-black text-[10px] text-gray-400 uppercase tracking-widest bg-gray-50">Danh mục tiến độ</div>
              <div className="flex-1 flex relative">
                {ganttCalculations.months.map((m, i) => (
                  <div key={i} className="flex-1 text-center py-4 text-[10px] font-black border-r border-gray-100 text-emerald-800 bg-emerald-50/20 uppercase">
                    Tháng {m.getMonth() + 1} / {m.getFullYear()}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 space-y-2 pb-20 relative">
              {/* ĐƯỜNG CURRENT DATE */}
              {ganttCalculations.todayPos !== null && (
                <div 
                  className="absolute top-0 bottom-0 z-10 w-px bg-red-500 pointer-events-none"
                  style={{ left: `calc(320px + ${ganttCalculations.todayPos}%)` }}
                >
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 absolute -top-4 -left-2 drop-shadow-sm" />
                </div>
              )}

              {ganttCalculations.tasksWithPos.map((task) => (
                <div key={task.id} className="flex group hover:bg-slate-50 items-center border-b border-gray-50">
                  <div className={`w-80 shrink-0 px-4 py-3 border-r truncate ${getLevelStyle(task.level)}`}>
                    {task.name}
                  </div>
                  <div className="flex-1 h-12 relative bg-gray-50/10">
                    <div 
                      className="absolute top-2 h-8 rounded-md shadow-sm transition-all duration-700 flex items-center px-3 text-[10px] text-gray-800 font-bold whitespace-nowrap overflow-hidden border border-black/5" 
                      style={{ left: `${task.left}%`, width: `${task.width}%`, minWidth: '40px', backgroundColor: task.color }}
                    >
                      {task.width > 2 && <span className="truncate">{task.name}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 2: GRID EDIT (Thay cột Bold bằng Level) */}
        {viewMode === 'table' && (
          <table className="w-full text-xs border-collapse">
            <thead className="bg-gray-100 sticky top-0 z-20 shadow-sm text-gray-500 uppercase text-[10px] tracking-widest">
              <tr>
                <th className="p-3 border-b text-center w-12"><Square className="w-5 h-5 text-gray-300 mx-auto"/></th>
                <th className="p-3 border-b font-black w-32 text-left">Đơn vị</th>
                <th className="p-3 border-b font-black text-left">Nội dung công việc</th>
                <th className="p-3 border-b font-black text-center w-40">Bắt đầu</th>
                <th className="p-3 border-b font-black text-center w-40">Kết thúc</th>
                <th className="p-3 border-b font-black text-center w-24">Cấp độ</th>
              </tr>
            </thead>
            <tbody>
              {localTasks.map((task) => (
                <tr key={task.id} className="group border-b border-gray-50 hover:bg-slate-50">
                  <td className="p-2 text-center text-gray-300">{tasks.indexOf(tasks.find(t=>t.id===task.id))+1}</td>
                  <td className="p-1"><input className="w-full p-2 bg-transparent outline-none focus:bg-white rounded font-bold text-indigo-700" value={task.unit || ''} onChange={(e) => handleLocalChange(task.id, 'unit', e.target.value)} /></td>
                  <td className="p-1"><input className={`w-full p-2 bg-transparent outline-none focus:bg-white rounded ${getLevelStyle(task.level)}`} value={task.name || ''} onChange={(e) => handleLocalChange(task.id, 'name', e.target.value)} /></td>
                  <td className="p-1"><input type="date" className="w-full p-2 bg-transparent outline-none focus:bg-white text-center" value={task.start || ''} onChange={(e) => handleLocalChange(task.id, 'start', e.target.value)} /></td>
                  <td className="p-1"><input type="date" className="w-full p-2 bg-transparent outline-none focus:bg-white text-center" value={task.end || ''} onChange={(e) => handleLocalChange(task.id, 'end', e.target.value)} /></td>
                  <td className="p-1 text-center">
                    <select className="w-full p-2 bg-transparent outline-none text-center font-bold" value={task.level || ''} onChange={(e) => handleLocalChange(task.id, 'level', e.target.value ? parseInt(e.target.value) : null)}>
                      <option value="">Null</option><option value="1">Lvl 1</option><option value="2">Lvl 2</option><option value="3">Lvl 3</option>
                    </select>
                  </td>
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
