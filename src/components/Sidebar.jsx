import React from 'react';
import { LayoutDashboard, Server, Network, UserPlus, AppWindow, List, ShieldCheck, Users, Share2, BookDashed } from 'lucide-react';
import { HEADER_COLOR } from '../constants';

export default function Sidebar({ activeTab, setActiveTab, hasViewPermission }) {
  const showResourceGroup = hasViewPermission('servers') || hasViewPermission('vips') || hasViewPermission('dns');
  const showSecurityGroup = hasViewPermission('connections') || hasViewPermission('permissions');
  const showSystemGroup = hasViewPermission('appStore') || hasViewPermission('parameters') || hasViewPermission('userGroups') || hasViewPermission('systemUsers');

  const TabBtn = ({ id, icon: Icon, label }) => (
    hasViewPermission(id) && (
      <button onClick={() => setActiveTab(id)} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${activeTab === id ? 'bg-white/20 text-white shadow-md font-medium' : 'text-white/80 hover:bg-white/10'}`}>
        <Icon className="w-5 h-5" /> {label}
      </button>
    )
  );

  return (
    <aside className="w-64 text-white flex flex-col shadow-xl z-20 shrink-0" style={{ backgroundColor: HEADER_COLOR }}>
      <div className="p-6 border-b border-white/20 shadow-sm bg-black/10">
        <h1 className="text-xl font-bold flex items-center gap-2 tracking-wide text-white"><Server className="w-6 h-6" /> InfraManager</h1>
        <p className="text-xs text-white/80 mt-1">Hệ thống Quản lý Hạ tầng</p>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
        <TabBtn id="dashboard" icon={LayoutDashboard} label="Dashboard" />
        <TabBtn id="projectPlan" icon={List} label="Kế hoạch Triển khai" />
        
        {showResourceGroup && <div className="pt-4 pb-2 px-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Tài nguyên</div>}
        <TabBtn id="servers" icon={Server} label="Máy chủ (Servers)" />
        <TabBtn id="vips" icon={Share2} label="VIPs" />
        <TabBtn id="dns" icon={BookDashed} label="DNS Records" />

        {showSecurityGroup && <div className="pt-4 pb-2 px-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Bảo mật</div>}
        <TabBtn id="connections" icon={Network} label="Yêu cầu Kết nối" />
        <TabBtn id="permissions" icon={ShieldCheck} label="Cấp quyền/Tài khoản" />

        {showSystemGroup && <div className="pt-4 pb-2 px-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Hệ thống</div>}
        <TabBtn id="appStore" icon={AppWindow} label="Kho Ứng dụng" />
        <TabBtn id="parameters" icon={List} label="Danh mục Tham số" />
        <TabBtn id="userGroups" icon={ShieldCheck} label="Quản lý Nhóm Quyền" />
        <TabBtn id="systemUsers" icon={Users} label="Quản trị Người dùng" />
      </nav>
    </aside>
  );
}
