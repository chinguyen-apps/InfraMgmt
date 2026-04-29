import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Table as TableIcon, LayoutGrid, ClipboardList, 
  Save, Trash2, Plus, AlertCircle, CheckSquare, Square, X, RotateCcw, Star, Loader2 
} from 'lucide-react';

export default function ProjectPlanManager({ 
  tasks = [], selectedUnit, selectedIds = [], setSelectedIds,
  onBatchUpdate, onBulkCreate, onDelete
}) {
  const [viewMode, setViewMode] = useState('gantt'); 
  const [localTasks, setLocalTasks] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [excelGridRows, setExcelGridRows] = useState([{}, {}, {}, {}, {}]);
  
  const HEADER_COLOR = '#006D5B';
  const PASTEL_COLORS = ['#FFD1DC', '#AEC6CF', '#FDFD96', '#77DD77', '#FFB347', '#B39EB5'];

  useEffect(() => {
    // Đảm bảo localTasks luôn là mảng để tránh crash
    setLocalTasks(Array.isArray(tasks) ? tasks : []);
    setSelectedIds([]);
  }, [tasks]);

  const hasChanges = useMemo(() => JSON.stringify(localTasks) !== JSON.stringify(tasks), [localTasks, tasks]);

  const getLevelStyle = (level) => {
    const lvl = parseInt(level);
    if (lvl === 1) return "font-black text-base text-gray-900";
    if (lvl === 2) return "font-bold italic text-[14px] text-gray-800 pl-4";
    if (lvl === 3) return "italic underline text-[13px] text-gray-700 pl-8";
    return "text-[13px] text-gray-600 pl-12";
  };

  const ganttCalculations = useMemo(() => {
    // Chốt chặn 1: Nếu không có dữ liệu, trả về mảng rỗng thay vì tính toán lỗi
    if (!localTasks || localTasks.length === 0) return { months: [], tasksWithPos: [], todayPos: null };
    
    try {
      const validTasks = localTasks.filter(t => t.start && t.end && !isNaN(new Date(t.start).getTime()));
      if (validTasks.length === 0) return { months: [], tasksWithPos: [], todayPos: null };

      const dates = validTasks.flatMap(t => [new Date(t.start), new Date(t.end)]);
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
      const todayPos = ((new Date() - startView) / totalTime) * 100;

      const tasksWithPos = localTasks.map((t, index) => {
        const s = new Date(t.start);
        const e = new Date(t.end);
        // Chốt chặn 2: Nếu ngày sai, ẩn thanh bar thay vì làm crash CSS
        if (isNaN(s.getTime()) || isNaN(e.getTime())) return { ...t, left: 0, width: 0, color: 'transparent' };
        
        const left = ((s - startView) / totalTime) * 100;
        const width = ((e - s) / totalTime) * 100;
        return { ...t, left, width, color: PASTEL_COLORS[index % PASTEL_COLORS.length] };
      });

      return { months, tasksWithPos, todayPos };
    } catch (err) {
      return { months: [], tasksWithPos: [], todayPos: null };
    }
  }, [localTasks]);

  const handleSaveAll = async () => {
    setIsSaving(true);
    await onBatchUpdate(localTasks);
    setIsSaving(false);
  };

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
            if (p.length === 3) v = `${p[2]}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}`;
          }
          newGrid[targetR][cols[targetC]] = v;
        }
      });
    });
    setExcelGridRows(newGrid);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b flex justify-between items-center bg-slate-50/50 sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-200 p-1 rounded-lg">
            <button onClick={() => setViewMode('gantt')} className={`px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${viewMode === 'gantt' ? 'bg-white shadow text-emerald-700' : 'text-gray-600'}`}><LayoutGrid className="w-4 h-4"/> Gantt View</button>
            <button onClick={() => setViewMode('table')} className={`px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${viewMode === 'table' ? 'bg-white shadow text-emerald-700' : 'text-gray-600'}`}><TableIcon className="w-4 h-4"/> Grid Edit</button>
            <button onClick={() => setViewMode('excel')} className={`px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${viewMode === 'excel' ? 'bg-white shadow text-emerald-700' : 'text-gray-600'}`}><ClipboardList className="w-4 h-4"/> Excel Paste</button>
          </div>
          {selectedIds.length > 0 && viewMode === 'table' && (
            <button onClick={() => onDelete(selectedIds)} className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded text-[10px] font-bold hover:bg-red-200 uppercase"><Trash2 className="w-3 h-3"/> Xóa đã chọn</button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasChanges && viewMode === 'table' && (
            <>
              <button disabled={isSaving} onClick={() => setLocalTasks(tasks)} className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-50">Hủy</button>
              <button 
                disabled={isSaving} 
                onClick={handleSaveAll} 
                style={{ backgroundColor: HEADER_COLOR }} 
                className="px-6 py-2 text-white rounded-lg text-sm font-bold shadow-lg hover:brightness-110 flex items-center gap-2"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </>
          )}
          {viewMode === 'excel' && (
            <button onClick={() => onBulkCreate(excelGridRows.filter(r => r.name).map(r => ({...r, unit: r.unit || selectedUnit})))} style={{ backgroundColor: HEADER_COLOR }} className="px-6 py-2 text-white rounded-lg text-sm font-bold shadow-lg hover:brightness-110"><Save className="w-4 h-4 mr-1 inline" /> Lưu dữ liệu Excel</button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 custom-scrollbar relative">
        {viewMode === 'gantt' && (
          <div className="min-w-[1200px] relative">
            <div className="flex border-b border-gray-200 sticky top-0 z-20 bg-white shadow-sm">
              <div className="w-80 shrink-0 p-4 border-r font-black text-[10px] text-gray-400 uppercase tracking-widest bg-gray-50 text-center">Danh mục tiến độ</div>
              <div className="flex-1 flex">
                {ganttCalculations.months.map((m, i) => (
                  <div key={i} className="flex-1 text-center py-4 text-[10px] font-black border-r border-gray-100 text-emerald-800 bg-emerald-50/20 uppercase">
                    Tháng {m.getMonth() + 1} / {m.getFullYear()}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 space-y-2 pb-20 relative">
              {ganttCalculations.todayPos !== null && (
                <div className="absolute top-0 bottom-0 z-10 w-px bg-red-500 pointer-events-none" style={{ left: `calc(320px + ${ganttCalculations.todayPos}%)` }}>
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 absolute -top-4 -left-2" />
                </div>
              )}

              {ganttCalculations.tasksWithPos.map((task) => (
                <div key={task.id} className="flex group hover:bg-slate-50 items-center border-b border-gray-50">
                  <div className={`w-80 shrink-0 px-4 py-3 border-r truncate ${getLevelStyle(task.level)}`}>{task.name}</div>
                  <div className="flex-1 h-12 relative bg-gray-50/10">
                    {task.width > 0 && (
                      <div className="absolute top-2 h-8 rounded-md shadow-sm flex items-center px-3 text-[10px] text-gray-800 font-bold whitespace-nowrap overflow-hidden border border-black/5" style={{ left: `${task.left}%`, width: `${task.width}%`, minWidth: '10px', backgroundColor: task.color }}>
                         <span className="truncate">{task.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {viewMode === 'table' && (
          <table className="w-full text-xs border-collapse">
            <thead className="bg-gray-100 sticky top-0 z-20 shadow-sm text-gray-500 uppercase text-[10px] tracking-widest">
              <tr>
                <th className="p-3 border-b text-center w-12"><button onClick={() => setSelectedIds(selectedIds.length === localTasks.length ? [] : localTasks.map(t=>t.id))}><CheckSquare className="w-5 h-5 mx-auto"/></button></th>
                <th className="p-3 border-b font-black w-32 text-left">Đơn vị</th>
                <th className="p-3 border-b font-black text-left">Nội dung công việc</th>
                <th className="p-3 border-b font-black text-center w-44">Bắt đầu</th>
                <th className="p-3 border-b font-black text-center w-44">Kết thúc</th>
                <th className="p-3 border-b font-black text-center w-24">Cấp độ</th>
              </tr>
            </thead>
            <tbody>
              {localTasks.map((task) => (
                <tr key={task.id} className={`group border-b border-gray-50 ${selectedIds.includes(task.id) ? 'bg-red-50/20' : 'hover:bg-slate-50'}`}>
                  <td className="p-2 text-center"><input type="checkbox" checked={selectedIds.includes(task.id)} onChange={() => setSelectedIds(selectedIds.includes(task.id) ? selectedIds.filter(i=>i!==task.id) : [...selectedIds, task.id])} className="w-4 h-4 accent-red-600" /></td>
                  <td className="p-1"><input className="w-full p-2 bg-transparent outline-none focus:bg-white rounded font-bold text-indigo-700" value={task.unit || ''} onChange={(e) => setLocalTasks(localTasks.map(t=>t.id===task.id?{...t, unit:e.target.value}:t))} /></td>
                  <td className="p-1"><input className={`w-full p-2 bg-transparent outline-none focus:bg-white rounded ${getLevelStyle(task.level)}`} value={task.name || ''} onChange={(e) => setLocalTasks(localTasks.map(t=>t.id===task.id?{...t, name:e.target.value}:t))} /></td>
                  <td className="p-1"><input type="date" className="w-full p-2 bg-transparent outline-none focus:bg-white text-center" value={task.start || ''} onChange={(e) => setLocalTasks(localTasks.map(t=>t.id===task.id?{...t, start:e.target.value}:t))} /></td>
                  <td className="p-1"><input type="date" className="w-full p-2 bg-transparent outline-none focus:bg-white text-center" value={task.end || ''} onChange={(e) => setLocalTasks(localTasks.map(t=>t.id===task.id?{...t, end:e.target.value}:t))} /></td>
                  <td className="p-1 text-center">
                    <select className="w-full p-2 bg-transparent outline-none text-center font-bold" value={task.level || ''} onChange={(e) => setLocalTasks(localTasks.map(t=>t.id===task.id?{...t, level: e.target.value ? parseInt(e.target.value) : null}:t))}>
                      <option value="">Null</option><option value="1">Lvl 1</option><option value="2">Lvl 2</option><option value="3">Lvl 3</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {viewMode === 'excel' && (
          <div className="max-w-6xl mx-auto flex flex-col gap-4 pt-4">
             <div className="border rounded-lg bg-white p-2 shadow-inner">
                <table className="w-full text-xs border-collapse">
                   <thead><tr className="bg-gray-100 text-gray-500 uppercase text-[10px] tracking-tighter"><th className="border p-2 w-10">#</th><th className="border p-2">Đơn vị</th><th className="border p-2 text-left">Nội dung công việc</th><th className="border p-2 w-40">Bắt đầu</th><th className="border p-2 w-40">Kết thúc</th><th className="border p-2 w-20">Level</th></tr></thead>
                   <tbody>{excelGridRows.map((row, rIdx) => (<tr key={rIdx}><td className="border p-2 text-center bg-gray-50 text-gray-400 font-mono">{rIdx + 1}</td><td className="border p-0"><input className="w-full p-2 outline-none focus:bg-blue-50" value={row.unit || ''} onPaste={(e) => handleExcelPaste(e, rIdx, 0)} onChange={(e)=>{const n=[...excelGridRows];n[rIdx].unit=e.target.value;setExcelGridRows(n)}} /></td><td className="border p-0"><input className="w-full p-2 outline-none focus:bg-blue-50" value={row.name || ''} onPaste={(e) => handleExcelPaste(e, rIdx, 1)} onChange={(e)=>{const n=[...excelGridRows];n[rIdx].name=e.target.value;setExcelGridRows(n)}} /></td><td className="border p-0"><input className="w-full p-2 outline-none focus:bg-blue-50 text-center" value={row.start || ''} onPaste={(e) => handleExcelPaste(e, rIdx, 2)} onChange={(e)=>{const n=[...excelGridRows];n[rIdx].start=e.target.value;setExcelGridRows(n)}} /></td><td className="border p-0"><input className="w-full p-2 outline-none focus:bg-blue-50 text-center" value={row.end || ''} onPaste={(e) => handleExcelPaste(e, rIdx, 3)} onChange={(e)=>{const n=[...excelGridRows];n[rIdx].end=e.target.value;setExcelGridRows(n)}} /></td><td className="border p-0"><input className="w-full p-2 outline-none focus:bg-blue-50 text-center" value={row.level || ''} onPaste={(e) => handleExcelPaste(e, rIdx, 4)} onChange={(e)=>{const n=[...excelGridRows];n[rIdx].level=e.target.value;setExcelGridRows(n)}} /></td></tr>))}</tbody>
                </table>
                <button onClick={() => setExcelGridRows([...excelGridRows, {}])} className="mt-4 flex items-center gap-2 text-xs font-black text-emerald-700 hover:opacity-70 px-2 uppercase"><Plus className="w-4 h-4"/> Thêm dòng mới</button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
