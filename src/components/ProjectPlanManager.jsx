import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  List, 
  Plus, 
  Trash2, 
  Table as TableIcon, 
  LayoutGrid, 
  ClipboardList, 
  Save, 
  X,
  AlertCircle
} from 'lucide-react';

/**
 * PROJECT PLAN MANAGER COMPONENT
 * Dùng để quản lý lộ trình dự án (Project Timeline)
 * Tích hợp: Bảng, Gantt Chart và Excel Paste logic.
 */
export default function ProjectPlanManager({ 
  tasks = [],        // Dữ liệu từ projectPlans state trong App.jsx
  onBulkCreate,     // Hàm gọi callApi action: 'create'
  onDelete,         // Hàm gọi callApi action: 'delete'
  selectedUnit      // Đơn vị đang chọn từ Header
}) {
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'gantt' | 'excel'
  const [gridRows, setGridRows] = useState([{}, {}, {}, {}, {}]); // Khởi tạo 5 dòng trống
  
  const HEADER_COLOR = '#059669'; // Emerald-600 đồng bộ với App.jsx

  // Cấu hình các cột cho chế độ dán Excel
  const columns = [
    { key: 'unit', label: 'Đơn vị' },
    { key: 'name', label: 'Tên công việc' },
    { key: 'start', label: 'Ngày bắt đầu' },
    { key: 'end', label: 'Ngày kết thúc' },
    { key: 'bold', label: 'In đậm (x)' }
  ];

  // --- LOGIC XỬ LÝ DATE & GANTT ---
  const formatDateDisplay = (dateStr) => {
    if (!dateStr || !dateStr.includes('-')) return dateStr;
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const ganttData = useMemo(() => {
    if (!tasks || tasks.length === 0) return { months: [], tasksWithPos: [] };
    
    // Lấy khoảng ngày rộng nhất
    const dates = tasks.flatMap(t => [new Date(t.start), new Date(t.end)]);
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    // Tạo danh mục các tháng hiển thị ở header Gantt
    const months = [];
    let current = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    while (current <= maxDate) {
      months.push(new Date(current));
      current.setMonth(current.getMonth() + 1);
    }

    const tasksWithPos = tasks.map(t => {
      const start = new Date(t.start);
      const end = new Date(t.end);
      const left = ((start - minDate) / (maxDate - minDate)) * 100;
      const width = ((end - start) / (maxDate - minDate)) * 100;
      return { ...t, left, width };
    });

    return { months, tasksWithPos, minDate, maxDate };
  }, [tasks]);

  // --- LOGIC NHẬP LIỆU EXCEL ---
  const handleGridChange = (rowIndex, key, value) => {
    const newGrid = [...gridRows];
    newGrid[rowIndex][key] = value;
    setGridRows(newGrid);
  };

  const handleGridPaste = (e, rowIndex, colIndex) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text');
    if (!pasteData) return;

    const rows = pasteData.split(/\r?\n/).filter(row => row.trim() !== '');
    const newGridData = [...gridRows];

    rows.forEach((rowStr, i) => {
      const cells = rowStr.split('\t');
      const targetRowIndex = rowIndex + i;
      if (!newGridData[targetRowIndex]) newGridData[targetRowIndex] = {};

      cells.forEach((cellVal, j) => {
        const targetColIndex = colIndex + j;
        if (targetColIndex < columns.length) {
          let value = cellVal.trim();
          
          // Tự động chuyển DD/MM/YYYY sang YYYY-MM-DD cho cột ngày
          const currentKey = columns[targetColIndex].key;
          if ((currentKey === 'start' || currentKey === 'end') && value.includes('/')) {
            const parts = value.split('/');
            if (parts.length === 3) {
              const [d, m, y] = parts;
              value = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
            }
          }
          newGridData[targetRowIndex][currentKey] = value;
        }
      });
    });
    setGridRows(newGridData);
  };

  const handleSaveExcel = () => {
    const validRows = gridRows
      .filter(r => r.name && r.start && r.end)
      .map(r => ({
        ...r,
        unit: r.unit || selectedUnit, // Fallback về đơn vị đang chọn nếu trống
        bold: r.bold?.toLowerCase() === 'x' || r.bold === 'true'
      }));

    if (validRows.length === 0) {
      alert("Vui lòng nhập ít nhất Tên việc, Ngày bắt đầu và Ngày kết thúc!");
      return;
    }
    
    onBulkCreate(validRows);
    setGridRows([{}, {}, {}, {}, {}]); // Reset grid
    setViewMode('table');
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* HEADER CONTROLS */}
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            Kế hoạch Triển khai
          </h2>
          <div className="flex bg-gray-200 p-1 rounded-lg">
            <button 
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${viewMode === 'table' ? 'bg-white shadow text-emerald-700' : 'text-gray-600'}`}
            >
              <TableIcon className="w-4 h-4" /> Bảng biểu
            </button>
            <button 
              onClick={() => setViewMode('gantt')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${viewMode === 'gantt' ? 'bg-white shadow text-emerald-700' : 'text-gray-600'}`}
            >
              <LayoutGrid className="w-4 h-4" /> Gantt Chart
            </button>
            <button 
              onClick={() => setViewMode('excel')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${viewMode === 'excel' ? 'bg-white shadow text-emerald-700' : 'text-gray-600'}`}
            >
              <ClipboardList className="w-4 h-4" /> Dán từ Excel
            </button>
          </div>
        </div>

        {viewMode === 'excel' ? (
          <button 
            onClick={handleSaveExcel}
            style={{ backgroundColor: HEADER_COLOR }}
            className="px-6 py-2 text-white rounded-lg flex items-center gap-2 hover:opacity-90 transition-all text-sm font-bold shadow-md"
          >
            <Save className="w-4 h-4" /> Lưu Kế hoạch
          </button>
        ) : (
          <div className="text-xs text-gray-500 font-medium">
            Đang hiển thị: <span className="text-emerald-700 font-bold">{selectedUnit === 'All' ? 'Tất cả Đơn vị' : selectedUnit}</span>
          </div>
        )}
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 overflow-auto p-6">
        {viewMode === 'table' && (
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 border-b font-bold w-32">Đơn vị</th>
                <th className="px-4 py-3 border-b font-bold">Nội dung công việc</th>
                <th className="px-4 py-3 border-b font-bold text-center w-32">Bắt đầu</th>
                <th className="px-4 py-3 border-b font-bold text-center w-32">Kết thúc</th>
                <th className="px-4 py-3 border-b w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-10 text-center text-gray-400 italic">Chưa có dữ liệu kế hoạch.</td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr key={task.id} className="group hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 text-indigo-600 font-medium">{task.unit}</td>
                    <td className={`px-4 py-3 ${task.bold ? 'font-black text-gray-900 border-l-4 border-emerald-500 pl-3' : 'text-gray-700'}`}>
                      {task.name}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-500">{formatDateDisplay(task.start)}</td>
                    <td className="px-4 py-3 text-center text-gray-500">{formatDateDisplay(task.end)}</td>
                    <td className="px-4 py-3 text-center">
                      <button 
                        onClick={() => window.confirm('Xóa công việc này?') && onDelete(task.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {viewMode === 'gantt' && (
          <div className="min-w-[1000px] pb-10">
            {/* Timeline Header */}
            <div className="flex border-b border-gray-200 mb-4 bg-gray-50 rounded-t-lg sticky top-0 z-20">
              <div className="w-72 shrink-0 p-3 border-r font-bold text-[10px] text-gray-400 uppercase tracking-wider">Danh mục công việc</div>
              <div className="flex-1 flex">
                {ganttData.months.map((m, i) => (
                  <div key={i} className="flex-1 text-center p-3 text-[10px] font-bold border-r text-gray-500 border-gray-200 bg-white">
                    Tháng {m.getMonth() + 1}/{m.getFullYear()}
                  </div>
                ))}
              </div>
            </div>

            {/* Gantt Rows */}
            <div className="space-y-1 relative">
              {ganttData.tasksWithPos.map((task) => (
                <div key={task.id} className="flex group hover:bg-slate-50 items-center border-b border-gray-50">
                  <div className={`w-72 shrink-0 px-3 py-2 border-r text-xs truncate ${task.bold ? 'font-bold text-emerald-900 bg-emerald-50/30' : 'text-gray-600'}`}>
                    {task.name}
                  </div>
                  <div className="flex-1 h-10 relative">
                    <div 
                      className={`absolute top-2 h-6 rounded-md shadow-sm transition-all duration-500 flex items-center px-2 text-[9px] text-white font-bold whitespace-nowrap overflow-hidden group-hover:brightness-110
                        ${task.bold ? 'bg-emerald-600 z-10' : 'bg-amber-400/90'}`}
                      style={{ 
                        left: `${task.left}%`, 
                        width: `${task.width}%`,
                        minWidth: '6px' 
                      }}
                      title={`${task.name}: ${formatDateDisplay(task.start)} - ${formatDateDisplay(task.end)}`}
                    >
                      {task.width > 8 && formatDateDisplay(task.start)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {viewMode === 'excel' && (
          <div className="flex flex-col gap-4">
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-blue-800">Hướng dẫn dán từ Excel</p>
                <p className="text-xs text-blue-700 mt-1">
                  Copy vùng dữ liệu trong Excel (cột Đơn vị, Tên việc, Ngày bắt đầu, Ngày kết thúc, In đậm) rồi chọn ô đầu tiên bên dưới và nhấn <kbd className="bg-white border rounded px-1 px-0.5">Ctrl + V</kbd>. 
                  Định dạng ngày hỗ trợ cả <strong>DD/MM/YYYY</strong> và <strong>YYYY-MM-DD</strong>.
                </p>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden bg-gray-50 p-2">
              <table className="w-full text-xs border-collapse bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 w-10 text-center">#</th>
                    {columns.map((col, i) => (
                      <th key={i} className="border p-2 text-left text-gray-600">{col.label}</th>
                    ))}
                    <th className="border p-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {gridRows.map((row, rIdx) => (
                    <tr key={rIdx}>
                      <td className="border text-center text-gray-400 bg-gray-50">{rIdx + 1}</td>
                      {columns.map((col, cIdx) => (
                        <td key={cIdx} className="border p-0 focus-within:ring-2 focus-within:ring-emerald-500 z-10">
                          <input 
                            type="text"
                            placeholder={col.key === 'bold' ? 'Gõ x để in đậm' : ''}
                            className="w-full p-2.5 outline-none transition-colors focus:bg-emerald-50"
                            value={row[col.key] || ''}
                            onChange={(e) => handleGridChange(rIdx, col.key, e.target.value)}
                            onPaste={(e) => handleGridPaste(e, rIdx, cIdx)}
                          />
                        </td>
                      ))}
                      <td className="border text-center">
                        <button 
                          onClick={() => setGridRows(gridRows.filter((_, i) => i !== rIdx))}
                          className="text-red-300 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button 
                onClick={() => setGridRows([...gridRows, {}])}
                className="mt-4 flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 px-2"
              >
                <Plus className="w-4 h-4" /> Thêm dòng trống
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
