// Admin configuration for government and health centers
export interface AdminCredentials {
  email: string;
  password: string;
  role: 'government' | 'health_center';
  organizationName: string;
  permissions: string[];
}

export interface AdminUser {
  uid: string;
  email: string;
  role: 'government' | 'health_center';
  organizationName: string;
  permissions: string[];
  isAdmin: true;
  createdAt: Date;
  lastLogin?: Date;
}

// Predefined admin credentials
export const ADMIN_CREDENTIALS: AdminCredentials[] = [
  // Custom Admin Access
  {
    email: 'mohansivathota@gmail.com',
    password: 'siv@siv@58',
    role: 'government',
    organizationName: 'Government Admin - Mohan Siva',
    permissions: [
      'view_all_users',
      'view_health_stats',
      'export_reports',
      'manage_health_centers',
      'view_system_analytics'
    ]
  },
  // Government Access
  {
    email: 'kerala.govt@medibot.admin',
    password: 'KeralGov@2024!Secure',
    role: 'government',
    organizationName: 'Government of Kerala - Health Department',
    permissions: [
      'view_all_users',
      'view_health_stats',
      'export_reports',
      'manage_health_centers',
      'view_system_analytics'
    ]
  },
  {
    email: 'tamilnadu.govt@medibot.admin',
    password: 'TNGov@2024!Health',
    role: 'government',
    organizationName: 'Government of Tamil Nadu - Health Department',
    permissions: [
      'view_all_users',
      'view_health_stats',
      'export_reports',
      'manage_health_centers',
      'view_system_analytics'
    ]
  },
  // Health Center Access
  {
    email: 'kims.hospital@medibot.admin',
    password: 'KIMS@2024!Medical',
    role: 'health_center',
    organizationName: 'KIMS Hospital - Trivandrum',
    permissions: [
      'view_patients',
      'manage_appointments',
      'view_health_records',
      'generate_reports'
    ]
  },
  {
    email: 'apollo.hospital@medibot.admin',
    password: 'Apollo@2024!Health',
    role: 'health_center',
    organizationName: 'Apollo Hospital - Chennai',
    permissions: [
      'view_patients',
      'manage_appointments',
      'view_health_records',
      'generate_reports'
    ]
  },
  {
    email: 'aiims.delhi@medibot.admin',
    password: 'AIIMS@2024!Delhi',
    role: 'health_center',
    organizationName: 'AIIMS - New Delhi',
    permissions: [
      'view_patients',
      'manage_appointments',
      'view_health_records',
      'generate_reports',
      'research_access'
    ]
  }
];

// Check if credentials match any admin account
export const validateAdminCredentials = (email: string, password: string): AdminCredentials | null => {
  return ADMIN_CREDENTIALS.find(
    admin => admin.email.toLowerCase() === email.toLowerCase() && admin.password === password
  ) || null;
};

// Check if user is admin
export const isAdminEmail = (email: string): boolean => {
  return ADMIN_CREDENTIALS.some(admin => admin.email.toLowerCase() === email.toLowerCase());
};

// Get admin role by email
export const getAdminRole = (email: string): 'government' | 'health_center' | null => {
  const admin = ADMIN_CREDENTIALS.find(admin => admin.email.toLowerCase() === email.toLowerCase());
  return admin?.role || null;
};

// Permission checks
export const hasPermission = (adminUser: AdminUser, permission: string): boolean => {
  return adminUser.permissions.includes(permission);
};

// Dashboard routes based on role
export const getAdminDashboardRoute = (role: 'government' | 'health_center'): string => {
  switch (role) {
    case 'government':
      return '/admin/government';
    case 'health_center':
      return '/admin/health-center';
    default:
      return '/dashboard';
  }
};