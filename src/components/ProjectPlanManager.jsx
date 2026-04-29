import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  List, 
  Plus, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  LayoutGrid, 
  Table as TableIcon 
} from 'lucide-react';

// Giả định các hằng số màu sắc khớp với App.jsx của bạn
const HEADER_COLOR = '#059669'; // Emerald-600

export default function ProjectPlanManager() {
  const [viewMode, setViewMode] = useState('table'); // 'table' hoặc 'gantt'
  const [tasks, setTasks] = useState([
    { id: 1, name: 'DEV Environment setup for Profile, Xpress, WebUI', start: '2026-04-15', end: '2026-05-15', bold: false },
    { id: 2, name: 'SIT&UAT', start: '2026-06-01', end: '2026-12-01', bold: true },
    { id: 3, name: 'System Integration Test (SIT - Core) LVB', start: '2026-04-01', end: '2026-09-30', bold: false },
    // Dữ liệu mẫu dựa trên hình ảnh của bạn
  ]);

  // Logic xử lý ngày tháng
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const handleTaskChange = (id, field, value) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const addTask = () => {
    const newTask = {
      id: Date.now(),
      name: 'New Task',
      start: new Date().toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
      bold: false
    };
    setTasks([...tasks, newTask]);
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  // --- GANTT LOGIC ---
  const ganttData = useMemo(() => {
    if (tasks.length === 0) return { months: [], tasksWithPos: [] };
    
    const dates = tasks.flatMap(t => [new Date(t.start), new Date(t.end)]);
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    // Tạo danh sách các tháng hiển thị
    const months = [];
    let current = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    while (current <= maxDate) {
      months.push(new Date(current));
      current.setMonth(current.getMonth() + 1);
    }

    const totalDays = (maxDate - minDate) / (1000 * 60 * 60 * 24);

    const tasksWithPos = tasks.map(t => {
      const start = new Date(t.start);
      const end = new Date(t.end);
      const left = ((start - minDate) / (maxDate - minDate)) * 100;
      const width = ((end - start) / (maxDate - minDate)) * 100;
      return { ...t, left, width };
    });

    return { months, tasksWithPos, minDate, maxDate };
  }, [tasks]);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header điều khiển */}
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            Kế hoạch triển khai Dự án
          </h2>
          <div className="flex bg-gray-200 p-1 rounded-lg">
            <button 
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'table' ? 'bg-white shadow text-emerald-700' : 'text-gray-600'}`}
            >
              <TableIcon className="w-4 h-4" /> Bảng biểu
            </button>
            <button 
              onClick={() => setViewMode('gantt')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'gantt' ? 'bg-white shadow text-emerald-700' : 'text-gray-600'}`}
            >
              <LayoutGrid className="w-4 h-4" /> Gantt Chart
            </button>
          </div>
        </div>
        <button 
          onClick={addTask}
          style={{ backgroundColor: HEADER_COLOR }}
          className="px-4 py-2 text-white rounded-lg flex items-center gap-2 hover:opacity-90 transition-all text-sm font-bold"
        >
          <Plus className="w-4 h-4" /> Thêm công việc
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {viewMode === 'table' ? (
          /* CHẾ ĐỘ BẢNG (EDIT) */
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 border-b font-bold w-1/2">Tên công việc</th>
                <th className="px-4 py-3 border-b font-bold text-center">Bắt đầu</th>
                <th className="px-4 py-3 border-b font-bold text-center">Kết thúc</th>
                <th className="px-4 py-3 border-b w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-2">
                    <input 
                      type="text" 
                      value={task.name}
                      onChange={(e) => handleTaskChange(task.id, 'name', e.target.value)}
                      className={`w-full bg-transparent border-none outline-none focus:ring-1 focus:ring-emerald-200 rounded px-2 py-1 ${task.bold ? 'font-black text-gray-900' : 'text-gray-700'}`}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input 
                      type="date" 
                      value={task.start}
                      onChange={(e) => handleTaskChange(task.id, 'start', e.target.value)}
                      className="border border-gray-200 rounded px-2 py-1 outline-none text-xs focus:border-emerald-500"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input 
                      type="date" 
                      value={task.end}
                      onChange={(e) => handleTaskChange(task.id, 'end', e.target.value)}
                      className="border border-gray-200 rounded px-2 py-1 outline-none text-xs focus:border-emerald-500"
                    />
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button onClick={() => deleteTask(task.id)} className="text-red-400 hover:text-red-600 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          /* CHẾ ĐỘ GANTT CHART */
          <div className="relative min-w-[800px]">
            {/* Timeline Header */}
            <div className="flex border-b border-gray-200 mb-4 bg-gray-50 rounded-t-lg">
              <div className="w-64 shrink-0 p-3 border-r font-bold text-xs text-gray-500">DANH MỤC CÔNG VIỆC</div>
              <div className="flex-1 flex">
                {ganttData.months.map((m, i) => (
                  <div key={i} className="flex-1 text-center p-3 text-[10px] font-bold border-r text-gray-400 border-gray-100">
                    Tháng {m.getMonth() + 1}/{m.getFullYear()}
                  </div>
                ))}
              </div>
            </div>

            {/* Gantt Rows */}
            <div className="space-y-1">
              {ganttData.tasksWithPos.map((task) => (
                <div key={task.id} className="flex group hover:bg-slate-50 items-center">
                  <div className={`w-64 shrink-0 px-3 py-2 border-r text-xs truncate ${task.bold ? 'font-bold' : ''}`}>
                    {task.name}
                  </div>
                  <div className="flex-1 h-8 relative">
                    <div 
                      className={`absolute top-1.5 h-5 rounded-full shadow-sm transition-all duration-500 flex items-center px-2 text-[8px] text-white font-bold whitespace-nowrap overflow-hidden
                        ${task.bold ? 'bg-emerald-600' : 'bg-amber-400 opacity-80 group-hover:opacity-100'}`}
                      style={{ 
                        left: `${task.left}%`, 
                        width: `${task.width}%`,
                        minWidth: '4px' 
                      }}
                    >
                      {task.width > 10 && formatDate(task.start)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
