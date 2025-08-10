import React, { useState } from 'react';
import { useApiConnection } from '../../hooks/useApiConnection';
import ApiConnectionStatus from '../common/ApiConnectionStatus';
import { API_URLS } from '../../config/api.config';

const ApiDebugPanel: React.FC = () => {
  const { config, isLoading, error, isConnected, connectionStatus, retryConnection } = useApiConnection();
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState(false);

  const testEndpoint = async (url: string, endpoint: string) => {
    try {
      const response = await fetch(`${url}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch (error) {
      console.error(`Test failed for ${url}${endpoint}:`, error);
      return false;
    }
  };

  const runTests = async () => {
    setTesting(true);
    const results: Record<string, boolean> = {};

    // Test des différentes URLs
    for (const [env, url] of Object.entries(API_URLS)) {
      console.log(`Testing ${env}: ${url}`);
      results[`${env}_ping`] = await testEndpoint(url, '/ping');
      results[`${env}_health`] = await testEndpoint(url, '/health');
    }

    setTestResults(results);
    setTesting(false);
  };

  if (!process.env.NODE_ENV || process.env.NODE_ENV === 'production') {
    return null; // Ne pas afficher en production
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-md z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">Debug API</h3>
        <ApiConnectionStatus showDetails />
      </div>

      <div className="space-y-2 text-sm">
        <div>
          <strong>Configuration actuelle:</strong>
          {config && (
            <div className="ml-2 text-xs text-gray-600">
              <div>URL: {config.baseUrl}</div>
              <div>Env: {config.environment}</div>
              <div>Timeout: {config.timeout}ms</div>
            </div>
          )}
        </div>

        {error && (
          <div className="text-red-600 text-xs">
            <strong>Erreur:</strong> {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={retryConnection}
            disabled={isLoading}
            className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? 'Test...' : 'Tester'}
          </button>
          
          <button
            onClick={runTests}
            disabled={testing}
            className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 disabled:opacity-50"
          >
            {testing ? 'Tests...' : 'Tests complets'}
          </button>
        </div>

        {Object.keys(testResults).length > 0 && (
          <div className="border-t pt-2 mt-2">
            <strong className="text-xs">Résultats des tests:</strong>
            <div className="grid grid-cols-2 gap-1 text-xs mt-1">
              {Object.entries(testResults).map(([test, success]) => (
                <div key={test} className={`flex items-center ${success ? 'text-green-600' : 'text-red-600'}`}>
                  <span className="mr-1">{success ? '✅' : '❌'}</span>
                  <span>{test}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t pt-2 mt-2 text-xs text-gray-500">
          <div>URLs disponibles:</div>
          {Object.entries(API_URLS).map(([env, url]) => (
            <div key={env} className="ml-2">
              <strong>{env}:</strong> {url}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ApiDebugPanel;
