import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, Check, AlertCircle, Building2, LogIn, LogOut, KeyRound, Loader2, List as ListIcon, Table as TableIcon, AppWindow, Trash2, Plus } from 'lucide-react';
import { HEADER_COLOR, BG_BODY, BG_CONTAINER, SYSTEM_MODULES, modalConfigs } from './constants';
import { hashSHA256, callApi } from './helpers';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AppStore from './components/AppStore';
import { GenericTable, UserGroupsTable, SystemUsersTable } from './components/Tables';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [apiError, setApiError] = useState(''); 
  const [headerMaps, setHeaderMaps] = useState({}); 

  const [currentUser, setCurrentUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const [activeTab, setActiveTab] = useState('appStore');
  
  const [servers, setServers] = useState([]);
  const [vips, setVips] = useState([]);
  const [dns, setDns] = useState([]);
  const [connections, setConnections] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [apps, setApps] = useState([]);
  const [parameters, setParameters] = useState([]);
  const [userGroups, setUserGroups] = useState([]);
  const [systemUsers, setSystemUsers] = useState([]);

  const [selectedItems, setSelectedItems] = useState({});
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [bulkEditData, setBulkEditData] = useState({ type: '', field: '', value: '' });

  const [selectedUnit, setSelectedUnit] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); 
  const [formData, setFormData] = useState({});
  const [inputMode, setInputMode] = useState('grid');
  const [gridRows, setGridRows] = useState([{}]);

  const applyDataToStates = (data) => {
    if (!data) return;
    
    const newHeaderMaps = {}; // Tạo bộ từ điển mới

    // Hàm chuẩn hóa thông minh: Tự động map Tiếng Việt <-> Tiếng Anh
    const processData = (type, rawData, configMapping) => {
      if (!rawData || !Array.isArray(rawData)) return [];
      
      // 1. Tự động nội suy Header Map từ dòng dữ liệu đầu tiên và file Config
      const mapping = {};
      if (rawData.length > 0 && configMapping) {
         const rawKeys = Object.keys(rawData[0]);
         configMapping.forEach(col => {
            // Nếu data trả về Tiếng Anh (chuẩn gốc) -> Map 1:1
            if (rawKeys.includes(col.key)) {
               mapping[col.key] = col.key;
            } 
            // Nếu data trả về Tiếng Việt (từ Google Sheet) -> Map Label thành Key
            else if (rawKeys.includes(col.label)) {
               mapping[col.label] = col.key;
            }
         });
      }

      // 2. Lưu lại từ điển ngược (Tiếng Anh -> Tiếng Việt) để dùng cho hàm getRawItemForApi
      // Giúp lúc anh bấm "Thêm mới/Lưu", nó sẽ gửi đúng cột Tiếng Việt lên Google Sheet
      const reverseMap = {};
      Object.entries(mapping).forEach(([raw, eng]) => {
          reverseMap[eng] = raw;
      });
      newHeaderMaps[type] = reverseMap;

      // 3. Tiến hành phiên dịch và chuyển đổi dữ liệu
      return rawData.map(item => {
        const normalizedItem = { id: item.id, type: item.type }; // Luôn giữ ID và Type
        
        Object.keys(item).forEach(rawKey => {
          const englishKey = mapping[rawKey];
          if (englishKey) {
            normalizedItem[englishKey] = item[rawKey];
          } else {
            normalizedItem[rawKey] = item[rawKey]; // Giữ nguyên các trường không có trong config
          }
        });

        // Parse JSON đặc biệt cho mảng quyền
        if (type === 'userGroup' && normalizedItem.permissions) {
            try { 
              normalizedItem.permissions = typeof normalizedItem.permissions === 'string' 
                ? JSON.parse(normalizedItem.permissions) 
                : normalizedItem.permissions; 
            } catch(e) {}
        }
        return normalizedItem;
      }).filter(Boolean);
    };

    // Áp dụng dữ liệu vào các State chính
    setServers(processData('server', data.server, modalConfigs.server));
    setVips(processData('vip', data.vip, modalConfigs.vip));
    setDns(processData('dns', data.dns, modalConfigs.dns));
    setPermissions(processData('permission', data.permission, modalConfigs.permission));
    setApps(processData('app', data.app, modalConfigs.app));
    setConnections(processData('connection', data.connection, modalConfigs.connection));

    // Fix map cứng cho các bảng hệ thống (đề phòng config của anh chưa có mảng này)
    const paramConfig = [{key: 'code', label: 'Tên tham số'}, {key: 'type', label: 'Loại'}, {key: 'value', label: 'Giá trị'}, {key: 'desc', label: 'Mô tả'}];
    setParameters(processData('parameter', data.parameter, modalConfigs.parameter || paramConfig));
    
    const sysUserConfig = [{key: 'username', label: 'Tên đăng nhập'}, {key: 'password', label: 'Mật khẩu'}, {key: 'fullName', label: 'Họ và Tên'}, {key: 'groupId', label: 'Nhóm quyền'}];
    setSystemUsers(processData('systemUser', data.systemUser, sysUserConfig));
    
    const userGrpConfig = [{key: 'groupName', label: 'Tên Nhóm'}, {key: 'permissions', label: 'Quyền'}];
    setUserGroups(processData('userGroup', data.userGroup, userGrpConfig));

    // Cập nhật State HeaderMaps để hệ thống CRUD gọi tự động
    setHeaderMaps(newHeaderMaps); 
  };
  
  // 1. Khai báo hàm fetchData chứa TẤT CẢ logic xử lý dữ liệu của bạn
  const fetchData = async () => {
    // 1. NGAY LẬP TỨC: Thử lấy dữ liệu cũ từ LocalStorage hiển thị trước
    const cachedLocalData = localStorage.getItem('infra_app_data');
    if (cachedLocalData) {
        try {
            applyDataToStates(JSON.parse(cachedLocalData));
            setIsLoading(false); // Tắt loading full-screen ngay lập tức nếu có cache!
        } catch(e) {}
    }

    // 2. CHẠY NGẦM: Gọi API lấy dữ liệu mới
    try {
        // BÍ QUYẾT TRÁNH LỖI CRASH Ở ĐÂY: Truyền một hàm rỗng () => {} vào tham số thứ 2
        // Nó giúp hàm callApi không bị crash, mà cũng không bật cái kính mờ ở giao diện lên!
        const res = await callApi({ action: 'read' }, () => {}); 
        
        if (res && res.status === 'success') {
          applyDataToStates(res.data);
          // Lưu lại bản mới nhất vào LocalStorage cho lần sau
          localStorage.setItem('infra_app_data', JSON.stringify(res.data)); 
          if (res.user) {
             setCurrentUser(res.user);
             localStorage.setItem('current_user', JSON.stringify(res.user));
          }
        } else if (res && res.status === 'error') {
           if (res.message && !String(res.message).includes("Unauthorized")) {
              setApiError(res.message);
           }
        }
    } catch (error) {
        console.error("Lỗi ngầm khi fetch data:", error);
        // Nếu sập mạng hoặc Worker không phản hồi, vẫn có thông báo
        setApiError("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
    } finally {
        // LƯU Ý QUAN TRỌNG NHẤT: Khối finally LUÔN LUÔN CHẠY
        // Chốt chặn cuối cùng đảm bảo 100% tắt vòng quay Loading, giúp user không bị treo màn hình
        setIsLoading(false);
    }
  };

  // 2. Chỉ dùng MỘT useEffect duy nhất khi khởi động App
  useEffect(() => {
    // Khôi phục phiên đăng nhập (nếu có)
    const savedUser = localStorage.getItem('current_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    // Gọi hàm fetch dữ liệu
    fetchData(); 
  }, []);

  // Tự động clear filter khi quay về Dashboard
  useEffect(() => {
    if (activeTab === 'dashboard') {
      // 1. Xóa từ khóa trong ô search
      setSearchTerm('');
      
      // 2. Reset bộ lọc loại ứng dụng (nếu bạn đã thêm appTypeFilter ở bước trước)
      if (typeof setAppTypeFilter === 'function') {
        setAppTypeFilter('All');
      }
  
      // 3. (Tùy chọn) Reset đơn vị về "Tất cả" nếu bạn muốn Dashboard luôn hiển thị tổng thể
      // setSelectedUnit('All'); 
    }
  }, [activeTab]); // Chạy mỗi khi activeTab thay đổi

  // ============================================================================
  // TỰ ĐỘNG LOGOUT KHI TREO MÁY (INACTIVITY TIMEOUT)
  // ============================================================================
  useEffect(() => {
    // Chỉ kích hoạt đếm giờ khi người dùng ĐÃ ĐĂNG NHẬP
    if (!currentUser) return;

    let timeoutId;
    const INACTIVITY_LIMIT = 15 * 60 * 1000; // Đặt thời gian là 15 phút (tính bằng mili-giây)

    // Hàm reset lại đồng hồ mỗi khi có tương tác
    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      
      timeoutId = setTimeout(() => {
        // Hết giờ -> Tự động đăng xuất
        alert("Phiên đăng nhập đã hết hạn do không có thao tác trong thời gian dài. Vui lòng đăng nhập lại.");
        handleLogout(); // Hàm handleLogout của anh đã có sẵn logic xóa token & state
      }, INACTIVITY_LIMIT);
    };

    // Các sự kiện được tính là "Có tương tác"
    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    
    // Gắn "tai nghe" sự kiện vào toàn bộ trang web
    activityEvents.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    // Khởi động đồng hồ đếm ngược ngay lập tức
    resetTimer();

    // Dọn dẹp bộ nhớ (Cleanup) khi người dùng chủ động đăng xuất hoặc tắt component
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [currentUser]); // Trigger lại effect này nếu state currentUser thay đổi

  // ============================================================================
  // TỐI ƯU HÓA HIỆU NĂNG (SENIOR LEVEL PERFORMANCE OPTIMIZATION)
  // ============================================================================

  // 1. Chuyển đổi dữ liệu Tham số thành Map (Dictionary O(1)) để tránh vòng lặp N^2
  const paramOptionsMap = useMemo(() => {
    const map = {};
    parameters.forEach(p => {
      if (!map[p.type]) map[p.type] = [];
      const vals = String(p.value || '').split(',').map(v => v.trim()).filter(Boolean);
      map[p.type].push(...vals);
    });
    // Xóa trùng lặp
    Object.keys(map).forEach(k => map[k] = Array.from(new Set(map[k])));
    return map;
  }, [parameters]);

  // 2. Cache danh sách tất cả các Đơn vị
  const allUnits = useMemo(() => {
    const existing = [...servers, ...vips, ...dns, ...connections, ...permissions, ...apps].map(item => item.unit);
    return Array.from(new Set([...(paramOptionsMap['Đơn vị'] || []), ...existing])).filter(Boolean);
  }, [servers, vips, dns, connections, permissions, apps, paramOptionsMap]);

  // 3. Cache logic tìm kiếm chung để tránh cấp phát lại hàm mỗi lần render
  const getFilteredData = (dataArray) => {
    let res = dataArray;
    if (selectedUnit !== 'All') res = res.filter(item => item.unit === selectedUnit);
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      res = res.filter(item => Object.values(item).some(val => val !== null && val !== undefined && String(val).toLowerCase().includes(lowerSearch)));
    }
    return res;
  };

  const getSearchOnlyData = (dataArray) => {
    if (!searchTerm.trim()) return dataArray;
    const lowerSearch = searchTerm.toLowerCase();
    return dataArray.filter(item => Object.values(item).some(val => val !== null && val !== undefined && String(val).toLowerCase().includes(lowerSearch)));
  };

  // 4. Memoize toàn bộ mảng dữ liệu đã lọc, chỉ chạy lại khi thật sự cần thiết
  const filteredServers = useMemo(() => getFilteredData(servers), [servers, selectedUnit, searchTerm]);
  const filteredVips = useMemo(() => getFilteredData(vips), [vips, selectedUnit, searchTerm]);
  const filteredDns = useMemo(() => getFilteredData(dns), [dns, selectedUnit, searchTerm]);
  const filteredConnections = useMemo(() => getFilteredData(connections), [connections, selectedUnit, searchTerm]);
  const filteredPermissions = useMemo(() => getFilteredData(permissions), [permissions, selectedUnit, searchTerm]);
  const filteredParameters = useMemo(() => getSearchOnlyData(parameters), [parameters, searchTerm]);
  const filteredUserGroups = useMemo(() => getSearchOnlyData(userGroups), [userGroups, searchTerm]);
  const filteredSystemUsers = useMemo(() => getSearchOnlyData(systemUsers), [systemUsers, searchTerm]);
  
  const formattedApps = useMemo(() => {
    return getFilteredData(apps).map(app => ({
      ...app,
      webLink: app.webLink && !/^https?:\/\//i.test(app.webLink.trim()) ? `http://${app.webLink.trim()}` : app.webLink
    }));
  }, [apps, searchTerm, selectedUnit]);

  // ============================================================================

  const getRawItemForApi = (type, normalizedItem) => {
    const mapping = headerMaps[type];
    if (!mapping) return normalizedItem;
    const rawItem = { id: normalizedItem.id };
    Object.keys(mapping).forEach(key => { rawItem[mapping[key]] = normalizedItem[key]; });

    // --- SỬA ĐOẠN NÀY ĐỂ GIỮ LẠI MẬT KHẨU ---
    if (type === 'systemUser' && normalizedItem.password) {
      rawItem.password = normalizedItem.password;
    }

    // --- THÊM ĐOẠN NÀY ĐỂ GỬI TRƯỜNG TYPE LÊN API ---
    if (type === 'app' && normalizedItem.type !== undefined) {
      rawItem.type = normalizedItem.type;
    }
    // ------------------------------------------------
    
    if (normalizedItem.permissions !== undefined) rawItem.permissions = typeof normalizedItem.permissions === 'object' ? JSON.stringify(normalizedItem.permissions) : normalizedItem.permissions;
    return rawItem;
  };

  const getRawFieldForBulk = (type, field) => headerMaps[type] && headerMaps[type][field] ? headerMaps[type][field] : field;

  const hasViewPermission = (tab) => currentUser?.permissions?.[tab]?.view;
  const hasAddPermission = (tab) => currentUser?.permissions?.[tab]?.add;

  const handleLogin = async (e) => {
    e.preventDefault();
    const hashedInputPassword = await hashSHA256(loginForm.password.trim());
    // Gọi API login lên Server
    const res = await callApi({ 
      action: 'login', 
      username: loginForm.username.trim(), 
      password: hashedInputPassword 
    }, setIsSyncing);
    
    if (res && res.status === 'success') {
      // Lưu Token và User Info
      localStorage.setItem('auth_token', res.token);
      localStorage.setItem('current_user', JSON.stringify(res.user));
      setCurrentUser(res.user);
      
      setShowLoginModal(false); 
      setLoginError('');
      if (res.user?.permissions?.dashboard?.view) setActiveTab('dashboard');
      
      // Tái sử dụng luôn cục data từ API Login trả về
      // (Không cần phải gọi fetchData() chờ thêm 6 giây nữa!)
      if (res.data) {     
        applyDataToStates(res.data); 
        // LƯU DỮ LIỆU ĐĂNG NHẬP VÀO LOCALSTORAGE
        localStorage.setItem('infra_app_data', JSON.stringify(res.data));
      } 
    } else {
      setLoginError(res?.message || 'Sai tên đăng nhập hoặc mật khẩu!');
    }
  };

  const handleLogout = () => { 
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    localStorage.removeItem('infra_app_data'); // XÓA BẢN SAO DỮ LIỆU KHI ĐĂNG XUẤT
    setCurrentUser(null); 
    setActiveTab('appStore'); 
    setLoginForm({ username: '', password: '' }); 
    // Clear TẤT CẢ dữ liệu bảo mật khỏi state, bao gồm cả User và Group
    setServers([]); 
    setVips([]); 
    setDns([]); 
    setConnections([]); 
    setPermissions([]);
    setSystemUsers([]); // Thêm dòng này
    setUserGroups([]);  // Thêm dòng này
  };

  // 1. Định nghĩa hàm điều hướng kèm filter
  const handleDashboardNavigate = (tab, unit, filterValue) => {
    setActiveTab(tab);
    if (unit) setSelectedUnit(unit);
    // Nếu có giá trị lọc (ví dụ 'Production' hoặc 'Active'), ta gán vào ô tìm kiếm
    if (filterValue) {
      setSearchTerm(filterValue);
    } else {
      setSearchTerm('');
    }
  };
  
  const handleChangePassword = async (e) => {
    e.preventDefault(); setPasswordError(''); setPasswordSuccess('');
    if (passwordForm.newPassword !== passwordForm.confirmPassword) return setPasswordError('Mật khẩu mới và Xác nhận không khớp!');
    const hashedCurrentPassword = await hashSHA256(passwordForm.currentPassword.trim());
    if (hashedCurrentPassword !== currentUser.password) return setPasswordError('Mật khẩu hiện tại không đúng!');
    
    const hashedNewPassword = await hashSHA256(passwordForm.newPassword.trim());
    const updatedUser = { ...currentUser, password: hashedNewPassword };
    setSystemUsers(systemUsers.map(u => u.id === currentUser.id ? updatedUser : u)); setCurrentUser(updatedUser);
    const res = await callApi({ action: 'update', type: 'systemUser', id: currentUser.id, data: getRawItemForApi('systemUser', updatedUser) }, setIsSyncing);
    
    if (res.status === 'success') {
      setPasswordSuccess('Đổi mật khẩu thành công!');
      setTimeout(() => { setShowChangePasswordModal(false); setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); setPasswordSuccess(''); }, 1500);
    } else setPasswordError('Có lỗi xảy ra khi lưu mật khẩu!');
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({});
    setGridRows([{}]);
    setModalType('');
  };

  const closeBulkEditModal = () => {
    setShowBulkEditModal(false);
    setBulkEditData({ type: '', field: '', value: '' });
  };

  const openAddModal = (type) => {
    setModalType(type);
    if (type === 'systemUser' || type === 'userGroup') { setFormData(type === 'userGroup' ? { permissions: {} } : {}); setInputMode('form'); } 
    else { setFormData((selectedUnit !== 'All' && type !== 'parameter') ? { unit: selectedUnit } : {}); setInputMode('grid'); setGridRows([(selectedUnit !== 'All' && type !== 'parameter') ? { unit: selectedUnit } : {}]); }
    setShowModal(true);
  };

  const openEditModal = (type, item) => {
    setModalType(type); setFormData(type === 'systemUser' ? { ...item, password: '' } : { ...item }); setInputMode('form'); setShowModal(true);
  };

  const handleDeleteSelected = async (type, ids, skipConfirm = false) => {
    if (!skipConfirm && !window.confirm(`Bạn có chắc chắn muốn xóa ${ids.length} dòng dữ liệu?`)) return;
    const updateLocal = (list, setList) => setList(list.filter(i => !ids.includes(i.id)));
    if (type === 'server') updateLocal(servers, setServers); else if (type === 'vip') updateLocal(vips, setVips); else if (type === 'dns') updateLocal(dns, setDns);
    else if (type === 'connection') updateLocal(connections, setConnections); else if (type === 'permission') updateLocal(permissions, setPermissions);
    else if (type === 'app') updateLocal(apps, setApps); else if (type === 'parameter') updateLocal(parameters, setParameters);
    else if (type === 'userGroup') updateLocal(userGroups, setUserGroups); else if (type === 'systemUser') updateLocal(systemUsers, setSystemUsers);
    setSelectedItems({ ...selectedItems, [type]: [] });
    await callApi({ action: 'delete', type: type, ids: ids }, setIsSyncing);
  };

  const executeBulkEdit = async (e) => {
    e.preventDefault();
    const ids = selectedItems[bulkEditData.type] || [];
    if(ids.length === 0) return;
    const today = new Date().toISOString().split('T')[0];
    const s = String(bulkEditData.value || '').toLowerCase();
    
    const updateLocal = (list, setList) => setList(list.map(item => {
        if (ids.includes(item.id)) {
           let upd = { ...item, [bulkEditData.field]: bulkEditData.value };
           if (bulkEditData.type === 'permission' && bulkEditData.field === 'status' && s === 'done') upd.compDate = today;
           if (bulkEditData.type === 'connection' && bulkEditData.field === 'status' && s === 'active') upd.compDate = today;
           return upd;
        } return item;
    }));
    if (bulkEditData.type === 'server') updateLocal(servers, setServers); else if (bulkEditData.type === 'vip') updateLocal(vips, setVips);
    else if (bulkEditData.type === 'dns') updateLocal(dns, setDns); else if (bulkEditData.type === 'connection') updateLocal(connections, setConnections);
    else if (bulkEditData.type === 'permission') updateLocal(permissions, setPermissions); else if (bulkEditData.type === 'app') updateLocal(apps, setApps);
    else if (bulkEditData.type === 'parameter') updateLocal(parameters, setParameters);
    
    closeBulkEditModal(); 
    setSelectedItems({ ...selectedItems, [bulkEditData.type]: [] });
    await callApi({ action: 'bulkEdit', type: bulkEditData.type, ids: ids, field: getRawFieldForBulk(bulkEditData.type, bulkEditData.field), value: bulkEditData.value }, setIsSyncing);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let newFormData = { ...formData, [name]: value };
    const today = new Date().toISOString().split('T')[0];
    const s = String(value || '').toLowerCase();
    
    if (modalType === 'permission' && name === 'status' && s === 'done') newFormData.compDate = today;
    if (modalType === 'connection' && name === 'status' && s === 'active') newFormData.compDate = today;
    setFormData(newFormData);
  };

  const handleGroupPermChange = (modId, permType, checked) => {
    setFormData(prev => {
      const perms = prev.permissions || {};
      return { ...prev, permissions: { ...perms, [modId]: { ...(perms[modId] || {}), [permType]: checked } } };
    });
  };

  const handleGridChange = (rowIndex, key, value) => {
    const newGridData = [...gridRows];
    newGridData[rowIndex][key] = value;
    setGridRows(newGridData);
  };

  const handleGridPaste = (e, rowIndex, colIndex, cols) => {
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
        if (targetColIndex < cols.length) {
          newGridData[targetRowIndex][cols[targetColIndex].key] = cellVal.trim();
        }
      });
    });
    setGridRows(newGridData);
  };

  const addGridRow = () => setGridRows([...gridRows, {}]);
  const removeGridRow = (index) => setGridRows(gridRows.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    let submitFormData = { ...formData };

    // --- BỔ SUNG CHECK TRÙNG USERNAME TẠI ĐÂY ---
    if (modalType === 'systemUser' && !submitFormData.id) {
      const isDuplicate = systemUsers.some(
        u => u.username?.toLowerCase() === submitFormData.username?.trim().toLowerCase()
      );
      if (isDuplicate) {
        alert("Lỗi: Tên đăng nhập này đã tồn tại trong hệ thống!");
        return; // Dừng xử lý
      }
    }
    
    // --- THÊM LOGIC AUTO SET TYPE KHI NHẬP FORM ---
    if (modalType === 'app') {
       const w = String(submitFormData.webLink || '').trim();
       const d = String(submitFormData.dbString || '').trim();
       if (w) submitFormData.type = 'Web';
       else if (d) submitFormData.type = 'DB';
       else submitFormData.type = '';
    }
    // ----------------------------------------------
    
    if (modalType === 'systemUser') {
      if (submitFormData.password) submitFormData.password = await hashSHA256(submitFormData.password);
      else if (submitFormData.id) submitFormData.password = (systemUsers.find(u => u.id === submitFormData.id) || {}).password;
    }
    
    if (inputMode === 'form' && submitFormData.id) {
      const payloadData = modalType === 'userGroup' ? { ...submitFormData, permissions: JSON.stringify(submitFormData.permissions) } : submitFormData;
      const updateLocal = (list, setList) => setList(list.map(i => i.id === submitFormData.id ? { ...submitFormData } : i));
      if (modalType === 'server') updateLocal(servers, setServers); else if (modalType === 'vip') updateLocal(vips, setVips); else if (modalType === 'dns') updateLocal(dns, setDns);
      else if (modalType === 'connection') updateLocal(connections, setConnections); else if (modalType === 'permission') updateLocal(permissions, setPermissions);
      else if (modalType === 'app') updateLocal(apps, setApps); else if (modalType === 'parameter') updateLocal(parameters, setParameters);
      else if (modalType === 'userGroup') updateLocal(userGroups, setUserGroups); else if (modalType === 'systemUser') updateLocal(systemUsers, setSystemUsers);
      
      closeModal();
      await callApi({ action: 'update', type: modalType, id: submitFormData.id, data: getRawItemForApi(modalType, payloadData) }, setIsSyncing);
    } else {
      const today = new Date().toISOString().split('T')[0];
      const newItems = (inputMode === 'form' ? [{ ...submitFormData, id: 'ID' + Date.now() }] : gridRows.filter(r => Object.keys(r).length > 0 && Object.values(r).some(v => v)).map((row, idx) => {
        let pr = { ...row, id: 'ID' + Date.now() + idx };
        const s = String(pr.status || '').toLowerCase();
        if (modalType === 'permission' && s === 'done' && !pr.compDate) pr.compDate = today;
        if (modalType === 'connection' && s === 'active' && !pr.compDate) pr.compDate = today;
        if (selectedUnit !== 'All' && !pr.unit) pr.unit = selectedUnit;

        // --- THÊM LOGIC TYPE NẾU THÊM MỚI TỪ GRID EXCEL ---
        if (modalType === 'app') {
           const w = String(pr.webLink || '').trim();
           const d = String(pr.dbString || '').trim();
           if (w) pr.type = 'Web';
           else if (d) pr.type = 'DB';
           else pr.type = '';
        }
        // --------------------------------------------------
        
        return pr;
      }));
      if (newItems.length === 0) return;
      
      if (modalType === 'server') setServers([...servers, ...newItems]); else if (modalType === 'vip') setVips([...vips, ...newItems]); else if (modalType === 'dns') setDns([...dns, ...newItems]);
      else if (modalType === 'connection') setConnections([...connections, ...newItems]); else if (modalType === 'permission') setPermissions([...permissions, ...newItems]);
      else if (modalType === 'app') setApps([...apps, ...newItems]); else if (modalType === 'parameter') setParameters([...parameters, ...newItems]);
      else if (modalType === 'userGroup') setUserGroups([...userGroups, ...newItems]); else if (modalType === 'systemUser') setSystemUsers([...systemUsers, ...newItems]);
      
      closeModal();
      await callApi({ action: 'create', type: modalType, data: newItems.map(i => getRawItemForApi(modalType, i)) }, setIsSyncing);
    }
  };

  const renderFieldInput = (col, value, isBulk = false) => {
    const isParamDropdown = ['env', 'unit', 'machineType', 'osVersion', 'roleGroup'].includes(col.key);
    const paramTypeMap = { 'env': 'Môi trường', 'unit': 'Đơn vị', 'machineType': 'Loại máy', 'osVersion': 'Hệ điều hành', 'roleGroup': 'Nhóm quyền cấp phát' };
    const updateFunc = isBulk ? (e) => setBulkEditData({...bulkEditData, value: e.target.value}) : handleInputChange;
    
    if (isParamDropdown && !(col.key === 'unit' && modalType === 'parameter')) {
      return <select name={col.key} value={value} onChange={updateFunc} className="w-full border border-gray-300 rounded p-2 focus:ring-2 outline-none" required={isBulk}><option value="">Chọn...</option>{(paramOptionsMap[paramTypeMap[col.key]] || []).map((v, i) => <option key={i} value={v}>{v}</option>)}</select>;
    }
    if (col.key === 'status') {
      const pType = bulkEditData.type === 'connection' || modalType === 'connection' ? 'Trạng thái kết nối' : 'Trạng thái cấp quyền';
      return <select name={col.key} value={value} onChange={updateFunc} className="w-full border border-gray-300 rounded p-2 focus:ring-2 outline-none" required={isBulk}><option value="">Chọn...</option>{(paramOptionsMap[pType] || []).map((v, i) => <option key={i} value={v}>{v}</option>)}</select>;
    }
    if (col.key === 'type' && modalType === 'parameter' && !isBulk) {
      return <><input type="text" name={col.key} value={value} onChange={updateFunc} list="paramTypesList" className="w-full border border-gray-300 rounded p-2 focus:ring-2 outline-none" placeholder="VD: Môi trường..." /><datalist id="paramTypesList"><option value="Môi trường" /><option value="Đơn vị" /><option value="Loại máy" /><option value="Hệ điều hành" /><option value="Nhóm quyền cấp phát" /><option value="Trạng thái kết nối" /><option value="Trạng thái cấp quyền" /></datalist></>;
    }
    if (col.key === 'value' && modalType === 'parameter' && !isBulk) return <textarea name={col.key} value={value} onChange={updateFunc} className="w-full border border-gray-300 rounded p-2 focus:ring-2 outline-none" rows="3" placeholder="Nhập các giá trị cách nhau bởi dấu phẩy (,)" />;
    if (['desc', 'note'].includes(col.key) && !isBulk) return <textarea name={col.key} value={value} onChange={updateFunc} className="w-full border border-gray-300 rounded p-2 focus:ring-2 outline-none" rows="2" />;
    if (['reqDate', 'compDate', 'expDate', 'approvedDate'].includes(col.key) && !isBulk) return <input type="date" name={col.key} value={value} onChange={updateFunc} className="w-full border border-gray-300 rounded p-2 focus:ring-2 outline-none" />;
    
    // Tắt autocomplete cho Tên đăng nhập khi Admin tạo User mới
    if (col.key === 'username') return <input type="text" name={col.key} value={value} onChange={updateFunc} className="w-full border border-gray-300 rounded p-2 focus:ring-2 outline-none" required={isBulk} autoComplete="off" />;
    
    return <input type="text" name={col.key} value={value} onChange={updateFunc} className="w-full border border-gray-300 rounded p-2 focus:ring-2 outline-none" placeholder={isBulk ? "Nhập giá trị mới..." : ""} required={isBulk} />;
  };

  if (isLoading) return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50"><Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-4" /><p className="font-medium">Đang tải...</p></div>;
  
  // --- MÀN HÌNH KHÁCH (CHƯA ĐĂNG NHẬP) ---
  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col font-sans text-gray-800" style={{ backgroundColor: BG_BODY }}>
        {isSyncing && <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-[100] flex items-center justify-center"><Loader2 className="w-8 h-8 text-emerald-600 animate-spin"/></div>}
        
        {/* THANH HEADER LUÔN ĐƯỢC HIỂN THỊ DÙ CÓ LỖI HAY KHÔNG */}
        <header style={{ backgroundColor: HEADER_COLOR }} className="p-4 flex justify-between items-center z-10 shadow-md shrink-0 text-white">
          <div className="flex items-center gap-2 font-bold text-xl"><AppWindow className="w-6 h-6" /> Infrastructure Management</div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg border border-white/20">
              <Building2 className="w-4 h-4 text-white/80" />
              <select value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)} className="bg-transparent text-sm font-medium text-white outline-none cursor-pointer">
                <option value="All" className="text-gray-800">Tất cả Đơn vị</option>
                {allUnits.map((u, i) => <option key={i} value={u} className="text-gray-800">{u}</option>)}
              </select>
            </div>
            <div className="flex items-center bg-white/10 rounded-lg px-3 py-2 w-64 md:w-80 focus-within:bg-white/20"><Search className="w-4 h-4 text-white/70 mr-2" /><input type="text" placeholder="Tìm ứng dụng..." className="bg-transparent border-none outline-none text-sm w-full text-white placeholder-white/70" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
            
            {/* NÚT ĐĂNG NHẬP LUÔN LUÔN CÓ MẶT */}
            <button onClick={() => setShowLoginModal(true)} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg font-medium text-sm"><LogIn className="w-4 h-4" /> Đăng nhập</button>
          </div>
        </header>

        {/* NỘI DUNG CHÍNH: LUÔN HIỂN THỊ KHO ỨNG DỤNG BÌNH THƯỜNG */}
        <main className="flex-1 p-8 overflow-y-auto relative">
          <AppStore isPublic={true} filteredApps={formattedApps} hasAddPermission={false} />
          
          {/* NẾU CÓ LỖI MẠNG/API, CHỈ HIỂN THỊ 1 TOAST NHỎ Ở GÓC DƯỚI (KHÔNG CHE MÀN HÌNH) */}
          {apiError && (
            <div className="fixed bottom-6 right-6 bg-white border-l-4 border-red-500 text-gray-800 p-4 rounded-lg shadow-2xl flex items-start gap-3 z-50 max-w-sm">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold text-red-600">Lỗi tải dữ liệu</p>
                <p className="text-xs mt-1 text-gray-600">{apiError}</p>
              </div>
              <button onClick={() => setApiError('')} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4"/></button>
            </div>
          )}
        </main>

        {/* MODAL ĐĂNG NHẬP GIỮ NGUYÊN */}
        {showLoginModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[110] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
              <button 
                onClick={() => !isSyncing && setShowLoginModal(false)} 
                className="absolute top-4 right-4 text-gray-400 hover:bg-gray-100 rounded-full p-1.5"
                disabled={isSyncing}
              >
                <X className="w-5 h-5"/>
              </button>
              
              <div className="text-center mb-6">
                <div style={{ backgroundColor: HEADER_COLOR }} className="w-16 h-16 rounded-full flex items-center justify-center text-white mx-auto mb-4 shadow-lg">
                  <KeyRound className="w-8 h-8"/>
                </div>
                <h2 className="text-2xl font-bold">Đăng nhập</h2>
              </div>
              
              <form onSubmit={handleLogin} className="space-y-4">
                {loginError && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{loginError}</div>}
                
                <div>
                  <label className="block text-sm font-medium mb-1">Tài khoản</label>
                  <input 
                    required 
                    disabled={isSyncing}
                    value={loginForm.username} 
                    onChange={(e) => setLoginForm({...loginForm, username: e.target.value})} 
                    className="w-full border rounded-lg p-3 focus:ring-2 outline-none disabled:bg-gray-100 disabled:text-gray-500" 
                    type="text" 
                    autoComplete="username" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Mật khẩu</label>
                  <input 
                    required 
                    disabled={isSyncing}
                    value={loginForm.password} 
                    onChange={(e) => setLoginForm({...loginForm, password: e.target.value})} 
                    className="w-full border rounded-lg p-3 focus:ring-2 outline-none disabled:bg-gray-100 disabled:text-gray-500" 
                    type="password" 
                    autoComplete="current-password" 
                  />
                </div>
                
                <button 
                  type="submit" 
                  disabled={isSyncing}
                  style={{ backgroundColor: isSyncing ? '#9ca3af' : HEADER_COLOR }} 
                  className={`w-full text-white rounded-lg p-3 font-bold flex justify-center items-center gap-2 transition-all ${isSyncing ? 'cursor-not-allowed' : 'hover:opacity-90 shadow-md'}`}
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    'Đăng nhập'
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- MÀN HÌNH CHÍNH (ĐÃ ĐĂNG NHẬP) ---
  return (
    <div className="min-h-screen flex font-sans text-gray-800" style={{ backgroundColor: BG_BODY }}>
      {isSyncing && <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-[100] flex items-center justify-center"><Loader2 className="w-8 h-8 text-emerald-600 animate-spin"/></div>}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} hasViewPermission={hasViewPermission} />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header style={{ backgroundColor: BG_CONTAINER }} className="p-4 border-b border-gray-200 flex justify-between items-center z-10 shadow-sm shrink-0">
          <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2 w-72 md:w-96 focus-within:ring-2"><Search className="w-4 h-4 text-gray-500 mr-2" /><input type="text" placeholder="Tìm kiếm..." className="bg-transparent border-none outline-none text-sm w-full text-gray-700" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-100"><Building2 className="w-4 h-4 text-indigo-700" /><select value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)} className="bg-transparent text-sm font-medium text-indigo-900 outline-none"><option value="All">Tất cả Đơn vị</option>{allUnits.map((u, i) => <option key={i} value={u}>{u}</option>)}</select></div>
            <div className="flex items-center gap-4 pl-4 border-l border-gray-200">
              <div className="flex items-center gap-3"><div style={{ backgroundColor: HEADER_COLOR }} className="w-8 h-8 text-white rounded-full flex items-center justify-center font-bold text-sm uppercase">{currentUser.username.charAt(0)}</div><div className="hidden md:block"><div className="text-sm font-bold leading-tight">{currentUser.fullName}</div><div className="text-xs text-gray-500">{userGroups.find(g => g.id === currentUser.groupId)?.groupName || 'No Group'}</div></div></div>
              <div className="flex items-center gap-1"><button onClick={() => { setShowChangePasswordModal(true); setPasswordForm({currentPassword:'', newPassword:'', confirmPassword:''}); setPasswordError(''); setPasswordSuccess(''); }} className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"><KeyRound className="w-5 h-5"/></button><button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><LogOut className="w-5 h-5"/></button></div>
            </div>
          </div>
        </header>

        <div className="p-8 flex-1 overflow-y-auto custom-scrollbar relative">
          {activeTab === 'dashboard' && hasViewPermission('dashboard') && (
            <Dashboard 
              selectedUnit={selectedUnit} 
              filteredServers={filteredServers} 
              filteredConnections={filteredConnections} 
              filteredPermissions={filteredPermissions}
              filteredVIPs={filteredVips}      // Đã có sẵn state này trong App.jsx
              filteredDNS={filteredDns}        // Đã có sẵn state này trong App.jsx
              filteredApps={formattedApps}     // Dùng formattedApps đã có sẵn trong App.jsx
              filteredDBs={[]}                 // App.jsx hiện chưa có chức năng quản lý DB riêng nên tạm truyền mảng rỗng []
              onNavigate={handleDashboardNavigate} //Hàm điều hướng khi người dùng click vào các chỉ số trên dashboard
            />
          )}
          {activeTab === 'servers' && hasViewPermission('servers') && <GenericTable title="Quản lý Máy chủ (Server)" type="server" moduleId="servers" data={filteredServers} config={modalConfigs.server} selectedItems={selectedItems} setSelectedItems={setSelectedItems} hasAddPermission={hasAddPermission('servers')} setBulkEditData={setBulkEditData} setShowBulkEditModal={setShowBulkEditModal} handleDeleteSelected={handleDeleteSelected} openAddModal={openAddModal} openEditModal={openEditModal} />}
          {activeTab === 'vips' && hasViewPermission('vips') && <GenericTable title="Quản lý Virtual IPs (VIPs)" type="vip" moduleId="vips" data={filteredVips} config={modalConfigs.vip} selectedItems={selectedItems} setSelectedItems={setSelectedItems} hasAddPermission={hasAddPermission('vips')} setBulkEditData={setBulkEditData} setShowBulkEditModal={setShowBulkEditModal} handleDeleteSelected={handleDeleteSelected} openAddModal={openAddModal} openEditModal={openEditModal} />}
          {activeTab === 'dns' && hasViewPermission('dns') && <GenericTable title="Quản lý DNS Records" type="dns" moduleId="dns" data={filteredDns} config={modalConfigs.dns} selectedItems={selectedItems} setSelectedItems={setSelectedItems} hasAddPermission={hasAddPermission('dns')} setBulkEditData={setBulkEditData} setShowBulkEditModal={setShowBulkEditModal} handleDeleteSelected={handleDeleteSelected} openAddModal={openAddModal} openEditModal={openEditModal} />}
          {activeTab === 'connections' && hasViewPermission('connections') && <GenericTable title="Quản lý Kết nối" type="connection" moduleId="connections" data={filteredConnections} config={modalConfigs.connection} selectedItems={selectedItems} setSelectedItems={setSelectedItems} hasAddPermission={hasAddPermission('connections')} setBulkEditData={setBulkEditData} setShowBulkEditModal={setShowBulkEditModal} handleDeleteSelected={handleDeleteSelected} openAddModal={openAddModal} openEditModal={openEditModal} />}
          {activeTab === 'permissions' && hasViewPermission('permissions') && <GenericTable title="Quản lý Quyền & Tài khoản" type="permission" moduleId="permissions" data={filteredPermissions} config={modalConfigs.permission} selectedItems={selectedItems} setSelectedItems={setSelectedItems} hasAddPermission={hasAddPermission('permissions')} setBulkEditData={setBulkEditData} setShowBulkEditModal={setShowBulkEditModal} handleDeleteSelected={handleDeleteSelected} openAddModal={openAddModal} openEditModal={openEditModal} />}
          {activeTab === 'appStore' && hasViewPermission('appStore') && <AppStore isPublic={false} filteredApps={formattedApps} hasAddPermission={hasAddPermission('appStore')} openAddModal={() => openAddModal('app')} openEditModal={(app) => openEditModal('app', app)} onDeleteApp={(id) => handleDeleteSelected('app', [id], true)} />}
          {activeTab === 'parameters' && hasViewPermission('parameters') && <GenericTable title="Danh mục Tham số Hệ thống" type="parameter" moduleId="parameters" data={filteredParameters} config={modalConfigs.parameter} selectedItems={selectedItems} setSelectedItems={setSelectedItems} hasAddPermission={hasAddPermission('parameters')} setBulkEditData={setBulkEditData} setShowBulkEditModal={setShowBulkEditModal} handleDeleteSelected={handleDeleteSelected} openAddModal={openAddModal} openEditModal={openEditModal} />}
          {activeTab === 'userGroups' && hasViewPermission('userGroups') && <UserGroupsTable data={filteredUserGroups} selectedItems={selectedItems} setSelectedItems={setSelectedItems} handleDeleteSelected={handleDeleteSelected} openAddModal={openAddModal} openEditModal={openEditModal} />}
          {activeTab === 'systemUsers' && hasViewPermission('systemUsers') && <SystemUsersTable data={filteredSystemUsers} userGroups={userGroups} selectedItems={selectedItems} setSelectedItems={setSelectedItems} handleDeleteSelected={handleDeleteSelected} openAddModal={openAddModal} openEditModal={openEditModal} />}
        </div>
      </main>

      {/* --- CÁC MODAL --- */}
      {showBulkEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"><form onSubmit={executeBulkEdit} className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 relative"><button type="button" onClick={closeBulkEditModal} className="absolute top-4 right-4"><X className="w-4 h-4"/></button><h3 className="text-lg font-bold mb-4">Sửa hàng loạt</h3><div className="space-y-4"><div><label className="block text-sm font-medium mb-1">Chọn trường</label><select required value={bulkEditData.field} onChange={e => setBulkEditData({...bulkEditData, field: e.target.value})} className="w-full border rounded p-2 focus:ring-2 outline-none">{modalConfigs[bulkEditData.type]?.map((c, i) => <option key={i} value={c.key}>{c.label}</option>)}</select></div><div><label className="block text-sm font-medium mb-1">Giá trị mới</label>{renderFieldInput(modalConfigs[bulkEditData.type]?.find(c => c.key === bulkEditData.field) || { key: bulkEditData.field }, bulkEditData.value, true)}</div></div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={closeBulkEditModal} className="px-4 py-2 border rounded-lg">Hủy</button><button type="submit" style={{ backgroundColor: HEADER_COLOR }} className="px-4 py-2 text-white rounded-lg">Áp dụng</button></div></form></div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"><div className={`bg-white rounded-xl shadow-2xl w-full ${inputMode === 'grid' && modalType !== 'systemUser' && modalType !== 'userGroup' ? 'max-w-[95vw]' : 'max-w-2xl'} max-h-[95vh] flex flex-col`}><div className="flex justify-between items-center p-6 border-b bg-slate-50/50"><h3 className="text-xl font-bold">{modalType === 'systemUser' ? (formData.id ? 'Sửa Tài khoản' : 'Tạo Tài khoản') : modalType === 'userGroup' ? (formData.id ? 'Sửa Nhóm Quyền' : 'Tạo Nhóm Quyền') : (formData.id ? `Cập nhật dữ liệu` : `Thêm mới dữ liệu`)}</h3><button type="button" onClick={closeModal}><X className="w-5 h-5"/></button></div><form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">{!formData.id && modalType !== 'systemUser' && modalType !== 'userGroup' && (<div className="flex justify-center border-b p-4"><div className="flex bg-gray-100 p-1.5 rounded-lg"><button type="button" onClick={() => setInputMode('form')} className={`flex items-center gap-2 px-6 py-2 rounded-md text-sm font-medium ${inputMode === 'form' ? 'bg-white shadow text-emerald-700' : 'text-gray-500'}`}><ListIcon className="w-4 h-4" /> Form</button><button type="button" onClick={() => setInputMode('grid')} className={`flex items-center gap-2 px-6 py-2 rounded-md text-sm font-medium ${inputMode === 'grid' ? 'bg-white shadow text-emerald-700' : 'text-gray-500'}`}><TableIcon className="w-4 h-4" /> Dán từ Excel</button></div></div>)}<div className="flex-1 overflow-y-auto p-6">{inputMode === 'form' ? (modalType === 'userGroup' ? (<div className="space-y-6"><div><label className="block text-sm font-medium mb-1">Tên Nhóm *</label><input required name="groupName" value={formData.groupName || ''} onChange={handleInputChange} className="w-full border rounded p-2 outline-none" type="text" /></div><div className="border rounded-lg overflow-hidden"><table className="w-full text-sm text-left"><thead className="bg-gray-50 border-b"><tr><th className="px-4 py-2">Phân hệ</th><th className="px-4 py-2 text-center">Xem</th><th className="px-4 py-2 text-center">Thêm/Sửa</th></tr></thead><tbody className="divide-y">{SYSTEM_MODULES.map((mod, i) => (<tr key={i}><td className="px-4 py-2">{mod.label}</td><td className="px-4 py-2 text-center"><input type="checkbox" checked={formData.permissions?.[mod.id]?.view || false} onChange={(e) => handleGroupPermChange(mod.id, 'view', e.target.checked)} /></td><td className="px-4 py-2 text-center"><input type="checkbox" checked={formData.permissions?.[mod.id]?.add || false} onChange={(e) => handleGroupPermChange(mod.id, 'add', e.target.checked)} /></td></tr>))}</tbody></table></div></div>) : modalType === 'systemUser' ? (<div className="grid grid-cols-2 gap-4"><div className="col-span-2 sm:col-span-1"><label className="block text-sm font-medium mb-1">Tên đăng nhập *</label><input required name="username" value={formData.username || ''} onChange={handleInputChange} className="w-full border rounded p-2 outline-none" type="text" autoComplete="off" /></div><div className="col-span-2 sm:col-span-1"><label className="block text-sm font-medium mb-1">Mật khẩu {formData.id ? '' : '*'}</label><input required={!formData.id} name="password" value={formData.password || ''} onChange={handleInputChange} className="w-full border rounded p-2 outline-none" type="password" placeholder={formData.id ? "(Nhập để đổi mật khẩu)" : "Nhập mật khẩu..."} autoComplete="new-password" /></div><div className="col-span-2 sm:col-span-1"><label className="block text-sm font-medium mb-1">Họ và Tên</label><input required name="fullName" value={formData.fullName || ''} onChange={handleInputChange} className="w-full border rounded p-2 outline-none" type="text" /></div><div className="col-span-2 sm:col-span-1"><label className="block text-sm font-medium mb-1">Gán Nhóm Quyền *</label><select required name="groupId" value={formData.groupId || ''} onChange={handleInputChange} className="w-full border rounded p-2 outline-none"><option value="">-- Chọn Nhóm --</option>{userGroups.map(g => <option key={g.id} value={g.id}>{g.groupName}</option>)}</select></div></div>) : (<div className="grid grid-cols-2 gap-4">{(modalConfigs[modalType] || []).map((col, i) => <div key={i} className={['desc', 'note', 'purpose', 'value'].includes(col.key) ? 'col-span-2' : 'col-span-2 sm:col-span-1'}><label className="block text-sm font-medium mb-1">{col.label}</label>{renderFieldInput(col, formData[col.key] || '', false)}</div>)}</div>)) : (<div className="overflow-x-auto border rounded-lg bg-gray-50/50 p-4"><table className="w-full text-sm text-left"><thead className="bg-gray-100"><tr><th className="px-2 py-2 text-center border-b w-10">#</th>{(modalConfigs[modalType] || []).map((c, i) => <th key={i} className="px-2 py-2 border-b">{c.label}</th>)}<th className="px-2 py-2 border-b w-10"></th></tr></thead><tbody>{gridRows.map((row, rIdx) => (<tr key={rIdx}><td className="px-2 py-1 text-center text-gray-400">{rIdx + 1}</td>{(modalConfigs[modalType] || []).map((c, cIdx) => <td key={cIdx} className="px-1 py-1 min-w-[120px]"><input type="text" className="w-full border border-gray-300 rounded px-2 py-1.5 outline-none" value={row[c.key] || ''} onChange={(e) => handleGridChange(rIdx, c.key, e.target.value)} onPaste={(e) => handleGridPaste(e, rIdx, cIdx, modalConfigs[modalType])} /></td>)}<td className="px-2 py-1 text-center"><button type="button" onClick={() => removeGridRow(rIdx)} className="text-red-400"><Trash2 className="w-4 h-4"/></button></td></tr>))}</tbody></table><button type="button" onClick={addGridRow} className="mt-4 flex items-center gap-1 text-sm font-medium text-emerald-600"><Plus className="w-4 h-4" /> Thêm dòng trống</button></div>)}</div><div className="flex justify-end gap-3 p-4 border-t bg-slate-50"><button type="button" onClick={closeModal} className="px-6 py-2 border rounded-lg">Hủy</button><button type="submit" style={{ backgroundColor: HEADER_COLOR }} className="px-6 py-2 text-white rounded-lg">Lưu dữ liệu</button></div></form></div></div>
      )}

      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative"><button onClick={() => setShowChangePasswordModal(false)} className="absolute top-4 right-4"><X className="w-5 h-5"/></button><div className="text-center mb-6"><div style={{ backgroundColor: HEADER_COLOR }} className="w-16 h-16 rounded-full flex items-center justify-center text-white mx-auto mb-4"><KeyRound className="w-8 h-8"/></div><h2 className="text-2xl font-bold">Đổi Mật Khẩu</h2></div><form onSubmit={handleChangePassword} className="space-y-4">{passwordError && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{passwordError}</div>}{passwordSuccess && <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm flex items-center gap-2"><Check className="w-4 h-4"/>{passwordSuccess}</div>}<div><label className="block text-sm font-medium mb-1">Mật khẩu hiện tại</label><input required value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})} className="w-full border rounded-lg p-3 outline-none" type="password" autoComplete="current-password" /></div><div><label className="block text-sm font-medium mb-1">Mật khẩu mới</label><input required value={passwordForm.newPassword} onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})} className="w-full border rounded-lg p-3 outline-none" type="password" autoComplete="new-password" /></div><div><label className="block text-sm font-medium mb-1">Xác nhận mật khẩu mới</label><input required value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})} className="w-full border rounded-lg p-3 outline-none" type="password" autoComplete="new-password" /></div><button type="submit" style={{ backgroundColor: HEADER_COLOR }} className="w-full text-white rounded-lg p-3 font-bold mt-2">Xác nhận đổi</button></form></div></div>
      )}
    </div>
  );
}
