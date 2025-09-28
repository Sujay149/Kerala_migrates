# Health & Community Alerts System

This document provides an overview of the new dynamic alerts system implemented in the application. The system allows administrators to create, edit, and manage alerts that are displayed to users.

## Features

- **Dynamic Alerts**: All alert data is stored in Firebase and fetched in real-time
- **Alert Management**: Administrators can create, edit, delete, and manage alerts
- **Image Support**: Alerts can include images for better communication
- **Email Notifications**: Send email notifications to users for important alerts
- **Expiry Dates**: Set expiration dates for alerts to automatically hide them
- **Priority Levels**: Assign priority levels to alerts (low, medium, high, critical)
- **Types**: Categorize alerts by type (health, medication, appointment, weather, system)
- **Read Status Tracking**: Track which alerts have been read by users

## Architecture

### Data Model

Alerts are stored in Firebase Firestore with the following structure:

```typescript
interface Alert {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  active: boolean;
  actionRequired?: boolean;
  actionLink?: string;
  imageUrl?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  expiresAt?: string | Date;
}
```

Alert read status is tracked per user:

```typescript
interface AlertReadStatus {
  id: string;
  userId: string;
  alertId: string;
  read: boolean;
  readAt?: Date | string;
}
```

### Components

1. **Alerts Page** (`app/alerts/page.tsx`):
   - Displays all active alerts to users
   - Shows priority, type, and read/unread status
   - Allows users to mark alerts as read
   - Filters out expired alerts

2. **Alerts Layout** (`app/alerts/layout.tsx`):
   - Provides navigation between viewing and managing alerts
   - Uses authentication guard to protect admin functionality

3. **Alert Management** (`app/alerts/manage/page.tsx`):
   - Form for creating and editing alerts
   - Table view of all alerts with filtering
   - Options to delete alerts or send email notifications

4. **API Routes**:
   - `/api/alerts/mark-read`: Marks alerts as read for users
   - `/api/alerts/notify`: Sends email notifications using Web3Forms

### Firebase Integration

The system uses:
- Firestore for storing alert data
- Firebase Storage for storing images
- Firebase Authentication for securing the admin functionality

## Usage

### For Administrators

1. Navigate to the Alerts page and click "Manage Alerts"
2. Create a new alert by filling out the form:
   - Title and message are required
   - Select type and priority
   - Optionally add an image, action link, and expiry date
   - Toggle "Active" to make the alert visible to users
   - Toggle "Action Required" for alerts that need user attention
3. View all alerts in the list tab
4. Edit or delete alerts as needed
5. Send email notifications for important alerts

### For Users

1. Navigate to the Alerts page to see all active alerts
2. Alerts are color-coded by priority
3. Click "Mark as Read" to acknowledge an alert
4. Click "Learn More" if the alert has an associated action link

## Email Notifications

The system uses Web3Forms to send email notifications. Emails include:

- Alert title and message
- Priority information
- Alert image (if available)
- Action link (if available)

To enable email notifications, ensure your Web3Forms API key is set in the environment variables:

```
WEB3FORMS_API_KEY=your_api_key_here
```

## Future Enhancements

Potential future improvements:

1. User subscription preferences for specific alert types
2. SMS notifications for critical alerts
3. Alert analytics to track user engagement
4. Scheduled alerts for recurring notifications
5. Localization support for multilingual alerts

## Troubleshooting

Common issues:

1. **Images not displaying**: Check Firebase Storage permissions
2. **Email notifications not sending**: Verify Web3Forms API key
3. **Alerts not appearing**: Ensure alerts are set to active and not expired