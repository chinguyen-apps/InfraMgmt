import { API_URL } from './constants';

export const hashSHA256 = async (text) => {
  const msgBuffer = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const callApi = async (payload, setIsSyncing) => {
  console.log("=== DEBUG API_URL ===", API_URL);
  
  if(!API_URL || !API_URL.startsWith("[https://script.google.com/](https://script.google.com/)")) {
    return { status: 'error', message: `Chưa cấu hình API_URL hợp lệ. Vui lòng kiểm tra lại file src/constants.js. \n\nGiá trị hiện tại đang là:\n${API_URL}` };
  }
  
  setIsSyncing(true);
  try {
    const res = await fetch(API_URL, { redirect: 'follow', method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
    const text = await res.text();
    try {
      const data = JSON.parse(text);
      setIsSyncing(false);
      return data;
    } catch (parseError) {
      setIsSyncing(false);
      return { status: 'error', message: `Google Sheets trả về lỗi.\n\nPhản hồi máy chủ:\n${text.substring(0, 300)}...` };
    }
  } catch (err) {
    setIsSyncing(false);
    return { status: 'error', message: `Lỗi kết nối mạng.\nChi tiết: ${err.message}` };
  }
};

export const getStatusStyle = (status) => {
  const s = String(status || '').toLowerCase();
  if (s === 'active' || s === 'done') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (s === 'pending' || s === 'in progress') return 'bg-amber-100 text-amber-800 border-amber-200';
  if (s === 'expired') return 'bg-rose-100 text-rose-800 border-rose-200';
  if (s === 'open') return 'bg-blue-100 text-blue-800 border-blue-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
};
