import React, { useMemo } from 'react';
import { 
  Server, 
  Network, 
  UserPlus, 
  Globe, 
  Database, 
  Cpu,
  Activity,
  ShieldCheck
} from 'lucide-react';

const BG_CONTAINER = '#ffffff';

// --- UTILITY FUNCTIONS ---
const countStatus = (arr, statusList) => {
  if (!arr) return 0;
  return arr.filter(i => statusList.includes(String(i?.status || '').trim().toLowerCase())).length;
};

const countEnv = (arr, envName) => {
  if (!arr) return 0;
  return arr.filter(i => String(i?.env || '').toLowerCase() === envName.toLowerCase()).length;
};

// --- SUB-COMPONENTS ---

// 1. Thẻ hiển thị thông số Tổng (Big Numbers)
const GlobalStatCard = ({ title, value, icon: Icon, colorClass, onClick }) => (
  <div 
    onClick={onClick}
    style={{ backgroundColor: BG_CONTAINER || '#ffffff' }} 
    className={`relative overflow-hidden rounded-xl border border-gray-100 p-6 shadow-sm transition-all ${onClick ? 'cursor-pointer hover:shadow-md hover:scale-[1.02]' : ''}`}
  >
    <div className="absolute -right-6 -top-6 opacity-5">
      <Icon className="w-32 h-32" />
    </div>
    <div className="relative z-10 flex flex-col h-full justify-between">
      <div className="flex items-center space-x-3 mb-4">
        <div className={`p-2.5 rounded-lg ${colorClass.bg}`}>
          <Icon className={`w-5 h-5 ${colorClass.text}`} />
        </div>
        <h3 className="text-gray-500 font-medium text-sm uppercase tracking-wide">{title}</h3>
      </div>
      <div>
        <span className="text-4xl font-black text-gray-800 tracking-tight">{value}</span>
      </div>
    </div>
  </div>
);

// 2. Khu vực hiển thị chi tiết cho từng Đơn vị
const UnitSection = ({ unitName, data, onNavigate }) => {
  const { servers, connections, permissions, vips, dns, apps, dbs } = data;

  // --- LOGIC PHÂN LOẠI ỨNG DỤNG ---
  // 1. Nhóm Web: type chính xác là 'Web'
  const webAppsCount = useMemo(() => 
    apps?.filter(a => String(a.type || '').trim() === 'Web').length || 0, 
  [apps]);

  // 2. Nhóm DB: type chính xác là 'DB'
  const dbAppsCount = useMemo(() => 
    apps?.filter(a => String(a.type || '').trim() === 'DB').length || 0, 
  [apps]);

  // 3. Nhóm Khác: type rỗng (khi có cả 2 link hoặc không có thông tin)
  const otherAppsCount = useMemo(() => 
    apps?.filter(a => !a.type || String(a.type).trim() === '').length || 0, 
  [apps]);

  // TỰ ĐỘNG NHÓM VÀ ĐẾM SỐ LƯỢNG THEO MÔI TRƯỜNG
  const envCounts = useMemo(() => {
    if (!servers) return {};
    return servers.reduce((acc, server) => {
      // Lấy tên môi trường, nếu không có gán là 'KHÁC', và viết hoa để đồng bộ
      const env = String(server?.env || 'KHÁC').toUpperCase().trim();
      acc[env] = (acc[env] || 0) + 1;
      return acc;
    }, {});
  }, [servers]);
  
  return (
    <div style={{ backgroundColor: '#ffffff' }} className="mt-6 rounded-2xl border border-gray-100 p-6 shadow-sm">
      {/* Header Đơn vị */}
      <div className="flex items-center mb-6 border-b border-gray-100 pb-4">
        <div className="h-6 w-1.5 bg-[#1a5f4f] rounded-full mr-3"></div>
        <h2 className="text-xl font-bold text-gray-800">{unitName}</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CỘT 1: HẠ TẦNG & MẠNG */}
        <div className="space-y-4">
          <h4 className="text-[#1a5f4f] font-semibold flex items-center text-sm uppercase tracking-wider">
            <Cpu className="w-4 h-4 mr-2" /> Hạ tầng & Mạng
          </h4>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
             <div 
               onClick={() => onNavigate('servers', unitName, '')}
               className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200 cursor-pointer hover:opacity-70"
             >
               <span className="text-gray-600 font-medium">Tổng Máy chủ</span>
               <span className="text-2xl font-bold text-[#1a5f4f]">{servers?.length || 0}</span>
             </div>
             
             {/* Danh sách môi trường máy chủ */}
             <div className="grid grid-cols-2 gap-3 text-center text-xs mb-4">
                {Object.entries(envCounts).sort().map(([env, count]) => {
                  const isProd = env.includes('PROD');
                  const boxClass = isProd ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-white border-gray-100 text-gray-700";
                  return (
                    <div 
                      key={env} 
                      onClick={() => onNavigate('servers', unitName, env)}
                      className={`rounded-lg border p-3 shadow-sm cursor-pointer hover:border-[#1a5f4f] transition-all ${boxClass}`}
                    >
                      <div className="mb-1 font-medium uppercase opacity-70">{env}</div>
                      <div className="font-bold text-lg">{count}</div>
                    </div>
                  );
                })}
             </div>
             
             {/* VIPs & DNS */}
             <div className="grid grid-cols-2 gap-3">
                <div 
                  onClick={() => onNavigate('vips', unitName, '')}
                  className="flex items-center justify-between bg-white border border-gray-100 p-2.5 rounded-lg shadow-sm cursor-pointer hover:border-indigo-400 transition-all"
                >
                  <span className="text-gray-500 text-sm">VIPs</span>
                  <span className="text-indigo-600 font-bold">{vips?.length || 0}</span>
                </div>
                <div 
                  onClick={() => onNavigate('dns', unitName, '')}
                  className="flex items-center justify-between bg-white border border-gray-100 p-2.5 rounded-lg shadow-sm cursor-pointer hover:border-blue-400 transition-all"
                >
                  <span className="text-gray-500 text-sm">DNS</span>
                  <span className="text-blue-600 font-bold">{dns?.length || 0}</span>
                </div>
             </div>
          </div>
        </div>

        {/* CỘT 2: VẬN HÀNH (KẾT NỐI & CẤP QUYỀN) */}
        <div className="space-y-4">
          <h4 className="text-indigo-600 font-semibold flex items-center text-sm uppercase tracking-wider">
            <Activity className="w-4 h-4 mr-2" /> Xử lý Yêu cầu
          </h4>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 h-[calc(100%-2rem)]">
            <div className="space-y-5">
              {/* Kết nối */}
              <div>
                <div className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <Network className="w-4 h-4 mr-1 text-gray-400"/> Kết nối
                </div>
                <div className="flex gap-3">
                  <div 
                    onClick={() => onNavigate('connections', unitName, 'Active')}
                    className="flex-1 bg-white border border-gray-100 rounded-lg p-3 text-center shadow-sm cursor-pointer hover:border-emerald-500 transition-all"
                  >
                    <div className="text-2xl font-bold text-emerald-600">{countStatus(connections, ['active'])}</div>
                    <div className="text-[11px] text-gray-500 uppercase mt-1 tracking-tighter">Active</div>
                  </div>
                  <div 
                    onClick={() => onNavigate('connections', unitName, 'In progress')}
                    className="flex-1 bg-white border border-gray-100 rounded-lg p-3 text-center shadow-sm cursor-pointer hover:border-amber-500 transition-all"
                  >
                    <div className="text-2xl font-bold text-amber-500">{countStatus(connections, ['in progress', 'open'])}</div>
                    <div className="text-[11px] text-gray-500 uppercase mt-1 tracking-tighter">Processing</div>
                  </div>
                </div>
              </div>
              
              {/* Cấp quyền */}
              <div className="pt-4 border-t border-gray-200">
                <div className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <ShieldCheck className="w-4 h-4 mr-1 text-gray-400"/> Quyền & Tài khoản
                </div>
                <div className="space-y-2">
                  <div 
                    onClick={() => onNavigate('permissions', unitName, 'Done')}
                    className="flex justify-between items-center bg-white border border-gray-100 rounded-lg p-2.5 shadow-sm cursor-pointer hover:border-emerald-500 transition-all"
                  >
                    <span className="text-xs text-gray-600">Đã hoàn thành (Done)</span>
                    <span className="text-lg font-bold text-emerald-600">{countStatus(permissions, ['done'])}</span>
                  </div>
                  <div 
                    onClick={() => onNavigate('permissions', unitName, 'In progress')}
                    className="flex justify-between items-center bg-white border border-gray-100 rounded-lg p-2.5 shadow-sm cursor-pointer hover:border-amber-500 transition-all"
                  >
                    <span className="text-xs text-gray-600">Đang xử lý (Progress)</span>
                    <span className="text-lg font-bold text-amber-500">{countStatus(permissions, ['in progress', 'open'])}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CỘT 3: KHO ỨNG DỤNG & DỮ LIỆU */}
        <div className="space-y-4">
          <h4 className="text-blue-600 font-semibold flex items-center text-sm uppercase tracking-wider">
            <Globe className="w-4 h-4 mr-2" /> Kho Ứng dụng & Dữ liệu
          </h4>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 h-[calc(100%-2rem)] flex flex-col justify-center gap-3">
            
            {/* Ứng dụng Web */}
            <div 
              onClick={() => onNavigate('appStore', unitName, 'Web')}
              className="flex items-center p-4 bg-white rounded-xl border border-gray-100 shadow-sm cursor-pointer hover:border-blue-300 transition-all"
            >
              <div className="p-2.5 bg-blue-50 rounded-lg mr-4"><Globe className="w-6 h-6 text-blue-500" /></div>
              <div>
                <div className="text-gray-500 text-xs font-medium">Link Ứng dụng</div>
                <div className="text-2xl font-bold text-gray-800">{webAppsCount}</div>
              </div>
            </div>

            {/* Cơ sở dữ liệu */}
            <div 
              onClick={() => onNavigate('appStore', unitName, 'DB')}
              className="flex items-center p-4 bg-white rounded-xl border border-gray-100 shadow-sm cursor-pointer hover:border-purple-300 transition-all"
            >
              <div className="p-2.5 bg-purple-50 rounded-lg mr-4"><Database className="w-6 h-6 text-purple-500" /></div>
              <div>
                <div className="text-gray-500 text-xs font-medium">Cơ sở dữ liệu</div>
                <div className="text-2xl font-bold text-gray-800">{dbAppsCount}</div>
              </div>
            </div>

            {/* Khác (Type rỗng) */}
            <div 
              onClick={() => onNavigate('appStore', unitName, '')} // Tìm kiếm rỗng
              className="flex items-center p-4 bg-white rounded-xl border border-gray-100 shadow-sm cursor-pointer hover:border-orange-300 transition-all"
            >
              <div className="p-2.5 bg-orange-50 rounded-lg mr-4"><Cpu className="w-6 h-6 text-orange-500" /></div>
              <div>
                <div className="text-gray-500 text-xs font-medium">Hệ thống Khác</div>
                <div className="text-2xl font-bold text-gray-800">{otherAppsCount}</div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};


// --- COMPONENT CHÍNH ---
export default function Dashboard({ 
  selectedUnit, 
  filteredServers = [], 
  filteredConnections = [], 
  filteredPermissions = [],
  filteredVIPs = [],    // Props mới bổ sung
  filteredDNS = [],     // Props mới bổ sung
  filteredApps = [],    // Props mới bổ sung
  filteredDBs = [],      // Props mới bổ sung
  onNavigate
}) {

  // Gom nhóm danh sách các đơn vị đang có dữ liệu
  const displayUnits = useMemo(() => {
    const allUnits = new Set([
      ...filteredServers.map(i => i?.unit),
      ...filteredConnections.map(i => i?.unit),
      ...filteredPermissions.map(i => i?.unit),
      ...filteredVIPs.map(i => i?.unit),
      ...filteredApps.map(i => i?.unit)
    ].filter(Boolean)); // Lọc bỏ các giá trị undefined/null

    return selectedUnit === 'All' ? Array.from(allUnits) : [selectedUnit];
  }, [selectedUnit, filteredServers, filteredConnections, filteredPermissions, filteredVIPs, filteredApps]);

  // Hàm helper lấy data cho từng đơn vị cụ thể
  const getUnitData = (unitName) => ({
    servers: filteredServers.filter(item => item?.unit === unitName),
    connections: filteredConnections.filter(item => item?.unit === unitName),
    permissions: filteredPermissions.filter(item => item?.unit === unitName),
    vips: filteredVIPs.filter(item => item?.unit === unitName),
    dns: filteredDNS.filter(item => item?.unit === unitName),
    apps: filteredApps.filter(item => item?.unit === unitName),
    dbs: filteredDBs.filter(item => item?.unit === unitName),
  });

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Dashboard Tổng quan 
            {selectedUnit !== 'All' && <span className="text-[#1a5f4f] ml-2">- {selectedUnit}</span>}
          </h2>
          <p className="text-gray-500 text-sm mt-1">Cập nhật tình trạng hạ tầng và yêu cầu xử lý mới nhất</p>
        </div>
      </div>

      {/* Global Highlights - Chỉ hiện khi chọn "Tất cả" */}
      {selectedUnit === 'All' && (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6"> {/* Đổi lg:grid-cols-4 thành lg:grid-cols-5 */}
        <GlobalStatCard 
          title="Tổng Máy Chủ" 
          value={filteredServers.length} 
          icon={Server} 
          colorClass={{ bg: 'bg-[#1a5f4f]/10', text: 'text-[#1a5f4f]' }} 
          onClick={() => onNavigate('servers', 'All', '')} // Click chuyển sang tab Servers
        />
        
        {/* Thẻ VIPs đứng độc lập */}
        <GlobalStatCard 
          title="Tổng Virtual IPs" 
          value={filteredVIPs.length} 
          icon={Network} 
          colorClass={{ bg: 'bg-indigo-50', text: 'text-indigo-600' }}
        />
    
        {/* Thẻ DNS Records đứng độc lập */}
        <GlobalStatCard 
          title="DNS Records" 
          value={filteredDNS.length} 
          icon={Globe} 
          colorClass={{ bg: 'bg-blue-50', text: 'text-blue-600' }}
        />
    
        <GlobalStatCard 
          title="Kết nối Active" 
          value={countStatus(filteredConnections, ['active', 'hoạt động', 'đã kết nối', 'done', 'hoàn thành'])} 
          icon={Activity} 
          colorClass={{ bg: 'bg-emerald-50', text: 'text-emerald-600' }}
        />
        <GlobalStatCard 
          title="Cấp quyền (Done)" 
          value={countStatus(filteredPermissions, ['done', 'hoàn thành', 'đã cấp', 'active'])} 
          icon={ShieldCheck} 
          colorClass={{ bg: 'bg-purple-50', text: 'text-purple-600' }}
        />
      </div>
    )}

      {/* Render thông tin chi tiết từng Đơn vị */}
      <div className="space-y-6">
        {displayUnits.length > 0 ? (
          displayUnits.map(unit => (
            <UnitSection 
              key={unit} 
              unitName={unit} 
              data={getUnitData(unit)} 
              onNavigate={onNavigate} // Truyền xuống UnitSection
            />
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100 shadow-sm">
            <Database className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Chưa có dữ liệu cho đơn vị này</p>
          </div>
        )}
      </div>

    </div>
  );
}
