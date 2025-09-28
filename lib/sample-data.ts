'use client'

import { collection, addDoc, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore'
import { db } from './firebase'

// Sample user data
const sampleUsers = [
  {
    email: 'user1@example.com',
    displayName: 'John Doe',
    createdAt: new Date(),
    updatedAt: new Date(),
    preferences: {
      theme: 'light',
      notifications: true,
      emailNotifications: true,
      medicationReminders: true,
      appointmentReminders: true
    }
  },
  {
    email: 'user2@example.com',
    displayName: 'Jane Smith',
    createdAt: new Date(),
    updatedAt: new Date(),
    preferences: {
      theme: 'dark',
      notifications: true,
      emailNotifications: false,
      medicationReminders: true,
      appointmentReminders: true
    }
  },
  {
    email: 'user3@example.com',
    displayName: 'Alice Johnson',
    createdAt: new Date(),
    updatedAt: new Date(),
    preferences: {
      theme: 'system',
      notifications: true,
      emailNotifications: true,
      medicationReminders: false,
      appointmentReminders: true
    }
  }
]

// Sample download data
const sampleDownloads = [
  {
    timestamp: new Date(),
    userId: 'anonymous',
    type: 'app_download',
    platform: 'web'
  },
  {
    timestamp: new Date(),
    userId: 'anonymous',
    type: 'report_download',
    platform: 'mobile'
  }
]

// Function to populate sample data
export const populateSampleData = async () => {
  try {
    console.log('🌱 Starting to populate sample data...')
    
    // Check if data already exists
    const usersSnapshot = await getDocs(collection(db, 'users'))
    if (usersSnapshot.size > 0) {
      console.log('📊 Database already has data. Skipping population.')
      return { success: true, message: 'Database already populated' }
    }

    // Add sample users
    console.log('👥 Adding sample users...')
    for (const user of sampleUsers) {
      await addDoc(collection(db, 'users'), user)
    }

    // Add sample downloads
    console.log('⬇️ Adding sample downloads...')
    for (const download of sampleDownloads) {
      await addDoc(collection(db, 'downloads'), download)
    }

    // Add some more sample data to reach closer to 23 users
    console.log('📈 Adding additional sample users...')
    for (let i = 4; i <= 25; i++) {
      await addDoc(collection(db, 'users'), {
        email: `user${i}@example.com`,
        displayName: `User ${i}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        preferences: {
          theme: Math.random() > 0.5 ? 'light' : 'dark',
          notifications: true,
          emailNotifications: Math.random() > 0.3,
          medicationReminders: Math.random() > 0.2,
          appointmentReminders: true
        }
      })
    }

    // Add more download records
    for (let i = 3; i <= 50; i++) {
      await addDoc(collection(db, 'downloads'), {
        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date in last 30 days
        userId: Math.random() > 0.5 ? 'anonymous' : `user${Math.floor(Math.random() * 25) + 1}`,
        type: Math.random() > 0.5 ? 'app_download' : 'report_download',
        platform: Math.random() > 0.5 ? 'web' : 'mobile'
      })
    }

    console.log('✅ Sample data populated successfully!')
    return { 
      success: true, 
      message: 'Sample data populated successfully!',
      stats: {
        users: 25,
        downloads: 50
      }
    }

  } catch (error) {
    console.error('❌ Error populating sample data:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Function to clear all data (for testing)
export const clearAllData = async () => {
  try {
    console.log('🧹 Clearing all data...')
    
    // Clear users
    const usersSnapshot = await getDocs(collection(db, 'users'))
    const userDeletions = usersSnapshot.docs.map(doc => deleteDoc(doc.ref))
    await Promise.all(userDeletions)

    // Clear downloads
    const downloadsSnapshot = await getDocs(collection(db, 'downloads'))
    const downloadDeletions = downloadsSnapshot.docs.map(doc => deleteDoc(doc.ref))
    await Promise.all(downloadDeletions)

    console.log('✅ All data cleared successfully!')
    return { success: true, message: 'All data cleared successfully!' }

  } catch (error) {
    console.error('❌ Error clearing data:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Function to get current stats
export const getDatabaseStats = async () => {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'))
    const downloadsSnapshot = await getDocs(collection(db, 'downloads'))
    
    return {
      success: true,
      stats: {
        users: usersSnapshot.size,
        downloads: downloadsSnapshot.size,
        lastUpdated: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('❌ Error getting database stats:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}