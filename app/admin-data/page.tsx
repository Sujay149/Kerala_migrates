'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { populateSampleData, clearAllData, getDatabaseStats } from '@/lib/sample-data'
import { Database, Users, Download, RefreshCw, Trash2, Plus } from 'lucide-react'

export default function AdminDataManagement() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const refreshStats = async () => {
    setLoading(true)
    try {
      const result = await getDatabaseStats()
      if (result.success) {
        setStats(result.stats)
      } else {
        setMessage(`Error: ${result.error}`)
      }
    } catch (error) {
      setMessage('Failed to fetch stats')
    }
    setLoading(false)
  }

  const handlePopulateSampleData = async () => {
    setLoading(true)
    setMessage('Populating sample data...')
    
    try {
      const result = await populateSampleData()
      if (result.success) {
        setMessage(`✅ ${result.message}`)
        await refreshStats()
      } else {
        setMessage(`❌ Error: ${result.error}`)
      }
    } catch (error) {
      setMessage('❌ Failed to populate data')
    }
    
    setLoading(false)
  }

  const handleClearAllData = async () => {
    if (!window.confirm('Are you sure you want to clear ALL data? This cannot be undone!')) {
      return
    }

    setLoading(true)
    setMessage('Clearing all data...')
    
    try {
      const result = await clearAllData()
      if (result.success) {
        setMessage(`✅ ${result.message}`)
        await refreshStats()
      } else {
        setMessage(`❌ Error: ${result.error}`)
      }
    } catch (error) {
      setMessage('❌ Failed to clear data')
    }
    
    setLoading(false)
  }

  useEffect(() => {
    refreshStats()
  }, [])

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Database Management</h1>
          <p className="text-gray-600">Manage your Firebase Firestore data</p>
        </div>

        {/* Current Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Current Database Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-800">{stats.users}</div>
                  <div className="text-blue-600">Users</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Download className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-800">{stats.downloads}</div>
                  <div className="text-green-600">Downloads</div>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <RefreshCw className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <div className="text-sm text-gray-800">Last Updated</div>
                  <div className="text-xs text-gray-600">
                    {new Date(stats.lastUpdated).toLocaleString()}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {loading ? 'Loading stats...' : 'No stats available'}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Data Management Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                onClick={handlePopulateSampleData}
                disabled={loading}
                className="flex items-center gap-2 h-12"
              >
                <Plus className="w-4 h-4" />
                Populate Sample Data
              </Button>
              
              <Button 
                onClick={refreshStats}
                variant="outline"
                disabled={loading}
                className="flex items-center gap-2 h-12"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Stats
              </Button>
            </div>
            
            <Button 
              onClick={handleClearAllData}
              variant="destructive"
              disabled={loading}
              className="flex items-center gap-2 h-12 w-full"
            >
              <Trash2 className="w-4 h-4" />
              Clear All Data (Dangerous!)
            </Button>
          </CardContent>
        </Card>

        {/* Status Messages */}
        {message && (
          <Card>
            <CardContent className="pt-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <pre className="text-sm whitespace-pre-wrap">{message}</pre>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <div className="space-y-4 text-gray-700">
              <div>
                <strong>Populate Sample Data:</strong> This will add 25 sample users and 50 download records to your database. 
                It will only add data if the database is currently empty.
              </div>
              <div>
                <strong>Refresh Stats:</strong> Updates the current count of users and downloads from your Firebase database.
              </div>
              <div>
                <strong>Clear All Data:</strong> ⚠️ This permanently deletes ALL data from your users and downloads collections. 
                Use with extreme caution!
              </div>
              <div>
                <strong>Note:</strong> Make sure your Firebase Firestore rules allow read/write access for testing. 
                In production, you should have proper authentication and authorization rules.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}