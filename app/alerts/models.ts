// Alert data model for Firebase

export interface Alert {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  active: boolean;
  actionRequired?: boolean;
  actionLink?: string;
  imageUrl?: string;
  expiresAt?: Date | string | null;
  authorId?: string;
  authorName?: string;
  sendEmail?: boolean;
  emailSent?: boolean;
  recipients?: string[];
}

export interface AlertFormData {
  title: string;
  message: string;
  type: string;
  priority: string;
  active: boolean;
  actionRequired?: boolean;
  actionLink?: string;
  imageUrl?: string;
  expiresAt?: Date | null;
}
// Convert AlertFormData to Alert for Firebase
export function convertToAlert(formData: AlertFormData): Omit<Alert, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    title: formData.title,
    message: formData.message,
    type: formData.type,
    priority: formData.priority,
    active: formData.active,
    actionRequired: formData.actionRequired,
    actionLink: formData.actionLink,
    imageUrl: formData.imageUrl,
    expiresAt: formData.expiresAt || null,
  };
}

// Convert Firebase Alert to AlertFormData for editing
export function convertToAlertFormData(alert: Alert): AlertFormData {
  return {
    title: alert.title,
    message: alert.message,
    type: alert.type,
    priority: alert.priority,
    active: alert.active,
    actionRequired: alert.actionRequired,
    actionLink: alert.actionLink,
    imageUrl: alert.imageUrl,
    expiresAt: typeof alert.expiresAt === 'string' 
      ? new Date(alert.expiresAt) 
      : alert.expiresAt as Date | undefined,
  };
}