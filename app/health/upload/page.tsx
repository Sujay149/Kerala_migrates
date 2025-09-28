'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Upload, FileText, ArrowRight, Heart } from 'lucide-react';

export default function HealthUploadPage() {
  const router = useRouter();
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    // Show options after a brief delay instead of immediate redirect
    const timer = setTimeout(() => {
      setShowOptions(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const navigateToUpload = () => {
    router.push('/upload');
  };

  const navigateToDashboard = () => {
    router.push('/dashboard/user');
  };

  if (!showOptions) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Preparing health document upload...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Heart className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold mb-2">
              Health Document Upload
            </CardTitle>
            <p className="text-gray-600">
              Upload your health documents for Kerala migrant workers services
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Button
                onClick={navigateToUpload}
                className="w-full flex items-center justify-center gap-3 py-6 text-lg"
                size="lg"
              >
                <Upload className="w-5 h-5" />
                Upload New Documents
                <ArrowRight className="w-5 h-5" />
              </Button>
              
              <Button
                variant="outline"
                onClick={navigateToDashboard}
                className="w-full flex items-center justify-center gap-3 py-6 text-lg"
                size="lg"
              >
                <FileText className="w-5 h-5" />
                View My Documents
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Supported Documents:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Medical Certificates</li>
                <li>• Blood Test Reports</li>
                <li>• X-Ray Reports</li>
                <li>• Vaccination Certificates</li>
                <li>• Health Insurance Cards</li>
                <li>• ID Proof & Work Permits</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
