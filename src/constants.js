export const HEADER_COLOR = '#006D5B';
export const BG_BODY = '#f4f6f8';
export const BG_CONTAINER = '#ffffff';

export const API_URL = "https://gas-proxy.wikjin.workers.dev"; 

export const SYSTEM_MODULES = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'servers', label: 'Máy chủ (Server)' },
  { id: 'vips', label: 'Virtual IPs (VIPs)' },
  { id: 'dns', label: 'DNS Records' },
  { id: 'connections', label: 'Yêu cầu Kết nối' },
  { id: 'permissions', label: 'Cấp quyền/Tài khoản' },
  { id: 'appStore', label: 'Kho Ứng dụng' },
  { id: 'parameters', label: 'Danh mục Tham số' },
  { id: 'userGroups', label: 'Quản lý Nhóm quyền' },
  { id: 'systemUsers', label: 'Quản trị Người dùng HT' }
];

export const modalConfigs = {
  server: [
    { key: 'unit', label: 'Đơn vị' }, { key: 'env', label: 'Môi trường' }, { key: 'hostname', label: 'Hostname' },
    { key: 'ip', label: 'IP' }, { key: 'app', label: 'Application' }, { key: 'cpu', label: 'CPU' },
    { key: 'memory', label: 'Memory' }, { key: 'storage', label: 'Storage' }, { key: 'osAdmin', label: 'Admin OS' },
    { key: 'appAdmin', label: 'Admin App' }, { key: 'dbAdmin', label: 'Admin DB' }, { key: 'osVersion', label: 'Hệ điều hành' }, { key: 'swVersion', label: 'Software version' }
  ],
  vip: [
    { key: 'unit', label: 'Đơn vị' }, { key: 'env', label: 'Môi trường' }, { key: 'app', label: 'Ứng dụng' },
    { key: 'vsName', label: 'VS_Name' }, { key: 'vip', label: 'VIP' }, { key: 'members', label: 'Members' }
  ],
  dns: [
    { key: 'unit', label: 'Đơn vị' }, { key: 'env', label: 'Môi trường' }, { key: 'fqdn', label: 'FQDN' }, { key: 'ip', label: 'IP Address' }
  ],
  connection: [
    { key: 'unit', label: 'Đơn vị' }, { key: 'env', label: 'Môi trường' }, { key: 'machineType', label: 'Loại máy' },
    { key: 'srcIp', label: 'IP Nguồn' }, { key: 'destIp', label: 'IP Đích' }, { key: 'port', label: 'Port' },
    { key: 'expDate', label: 'Ngày hết hạn' }, { key: 'purpose', label: 'Mục đích' }, { key: 'status', label: 'Trạng thái' },
    { key: 'app', label: 'Ứng dụng' }, { key: 'reqDate', label: 'Ngày yêu cầu' }, { key: 'compDate', label: 'Ngày hoàn thành' }, { key: 'note', label: 'Ghi chú' }
  ],
  permission: [
    { key: 'unit', label: 'Đơn vị' }, { key: 'env', label: 'Môi trường' }, { key: 'staffId', label: 'Mã CB' },
    { key: 'branchId', label: 'Mã Chi nhánh' }, { key: 'fullName', label: 'Họ tên' }, { key: 'deptId', label: 'Mã phòng ban' },
    { key: 'email', label: 'Email' }, { key: 'wsName', label: 'Tên máy trạm' }, { key: 'wsIp', label: 'IP máy trạm' },
    { key: 'roleGroup', label: 'Nhóm quyền cấp phát' }, { key: 'reqDate', label: 'Ngày yêu cầu' }, { key: 'compDate', label: 'Ngày hoàn thành' },
    { key: 'status', label: 'Trạng thái' }, { key: 'note', label: 'Ghi chú' }
  ],
  app: [
    { key: 'unit', label: 'Đơn vị' }, { key: 'env', label: 'Môi trường' }, { key: 'name', label: 'Tên ứng dụng' },
    { key: 'desc', label: 'Mô tả' }, { key: 'webLink', label: 'Link truy cập web' }, { key: 'dbString', label: 'Chuỗi kết nối DB' }
  ],
  parameter: [
    { key: 'type', label: 'Tên tham số' }, { key: 'value', label: 'Giá trị' }, { key: 'desc', label: 'Mô tả' }
  ]
};
