// app/auth/error/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [debugError, setDebugError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(true); // Set to true by default for testing

  // Add direct environment variable checking
  const checkEnvVariables = () => {
    return {
      clientId: !!process.env.GOOGLE_CLIENT_ID,
      clientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      //nextAuthUrl: process.env.NEXTAUTH_URL,
      //hasSecret: !!process.env.NEXTAUTH_SECRET,
    };
  };

  useEffect(() => {
    console.log('Error type:', error); // Debug log
    
    async function fetchDebugInfo() {
      try {
        // Log the direct env check
        const directCheck = checkEnvVariables();
        console.log('Direct environment check:', directCheck);
        setDebugInfo(directCheck);
      } catch (err) {
        console.error('Error in debug check:', err);
        setDebugError(err instanceof Error ? err.message : 'Unknown error');
      }
    }

    fetchDebugInfo();
  }, [error]);

  const getErrorMessage = (error: string) => {
    switch (error) {
      case 'OAuthSignin':
        return 'Error signing in with Google. This usually means there is a configuration issue with the Google OAuth setup.';
      case 'Configuration':
        return 'There is a problem with the server configuration. Check your environment variables.';
      case 'AccessDenied':
        return 'Access was denied to your Google account. You may have declined the authentication request.';
      case 'Callback':
        return 'There was a problem with the authentication callback. This could be due to mismatched redirect URIs.';
      default:
        return `Authentication error: ${error}. Please check the configuration.`;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Authentication Error
          </h2>
          
          <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-md">
            <p className="font-medium">Error Details:</p>
            <p>{error ? getErrorMessage(error) : 'An unknown error occurred'}</p>
          </div>

          {debugError && (
            <div className="mt-4 p-4 bg-yellow-50 text-yellow-700 rounded-md">
              <p className="font-medium">Debug Error:</p>
              <p>{debugError}</p>
            </div>
          )}

          <div className="mt-6 space-y-4">
            <div className="p-4 bg-gray-50 rounded-md text-sm">
              <h3 className="font-bold mb-2">Configuration Status:</h3>
              {debugInfo ? (
                <ul className="space-y-2">
                  <li className={debugInfo.clientId ? 'text-green-600' : 'text-red-600'}>
                    GOOGLE_CLIENT_ID: {debugInfo.clientId ? '✓' : '✗'}
                  </li>
                  <li className={debugInfo.hasSecret ? 'text-green-600' : 'text-red-600'}>
                    NEXTAUTH_SECRET: {debugInfo.hasSecret ? '✓' : '✗'}
                  </li>
                  <li>
                    NEXTAUTH_URL: {debugInfo.nextAuthUrl || 'Not set'}
                  </li>
                </ul>
              ) : (
                <p className="text-gray-600">Loading configuration status...</p>
              )}
            </div>

            <div className="p-4 bg-blue-50 text-blue-700 rounded-md">
              <h3 className="font-bold mb-2">Troubleshooting Steps:</h3>
              <ol className="list-decimal pl-4 space-y-2">
                <li>Verify your .env.local file has the required variables:
                  <pre className="mt-1 bg-blue-100 p-2 rounded text-xs">
                    NEXTAUTH_URL=http://localhost:3000{'\n'}
                    NEXTAUTH_SECRET=your-secret{'\n'}
                    GOOGLE_CLIENT_ID=your-client-id{'\n'}
                    GOOGLE_CLIENT_SECRET=your-client-secret
                  </pre>
                </li>
                <li>Check Google Cloud Console:
                  <ul className="list-disc pl-4 mt-1 space-y-1">
                    <li>Verify OAuth consent screen is configured</li>
                    <li>Confirm credentials are correct</li>
                    <li>Ensure redirect URI matches exactly:
                      <pre className="mt-1 bg-blue-100 p-2 rounded text-xs">
                        http://localhost:3000/api/auth/callback/google
                      </pre>
                    </li>
                  </ul>
                </li>
                <li>Try clearing your browser cache and cookies</li>
              </ol>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <a
              href="/auth/signin"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Return to Sign In
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}