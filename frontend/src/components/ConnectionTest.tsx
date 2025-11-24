import React, { useState } from 'react';
import { apiService } from '../lib/apiService';

interface TestResult {
  endpoint: string;
  status: 'pending' | 'success' | 'error';
  response?: any;
  error?: string;
}

const ConnectionTest: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const endpoints = [
    { name: 'Health Check', test: () => apiService.healthCheck() },
    { name: 'Test Connection', test: () => apiService.testConnection() },
    { name: 'Get User Profile', test: () => apiService.getUserProfile() },
    { name: 'Get Usage', test: () => apiService.getUsage() },
    { name: 'Get Job (test)', test: () => apiService.getJob('test-job-123') },
  ];

  const runTests = async () => {
    setIsRunning(true);
    const results: TestResult[] = [];

    for (const endpoint of endpoints) {
      const result: TestResult = {
        endpoint: endpoint.name,
        status: 'pending'
      };
      
      results.push(result);
      setTestResults([...results]);

      try {
        const response = await endpoint.test();
        result.status = 'success';
        result.response = response;
      } catch (error) {
        result.status = 'error';
        result.error = error instanceof Error ? error.message : 'Unknown error';
      }

      setTestResults([...results]);
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between tests
    }

    setIsRunning(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'pending': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'pending': return '⏳';
      default: return '⚪';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Frontend ↔ Backend Connection Test
      </h2>
      
      <div className="mb-6">
        <button
          onClick={runTests}
          disabled={isRunning}
          className={`px-6 py-3 rounded-lg font-semibold ${
            isRunning
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isRunning ? 'Running Tests...' : 'Test All Endpoints'}
        </button>
      </div>

      {testResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">Test Results:</h3>
          
          {testResults.map((result, index) => (
            <div key={index} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-800">
                  {getStatusIcon(result.status)} {result.endpoint}
                </h4>
                <span className={`font-semibold ${getStatusColor(result.status)}`}>
                  {result.status.toUpperCase()}
                </span>
              </div>
              
              {result.response && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 mb-1">Response:</p>
                  <pre className="bg-green-50 p-2 rounded text-xs overflow-x-auto">
                    {JSON.stringify(result.response, null, 2)}
                  </pre>
                </div>
              )}
              
              {result.error && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 mb-1">Error:</p>
                  <pre className="bg-red-50 p-2 rounded text-xs text-red-700">
                    {result.error}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">Connection Status:</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <p>• Backend Server: <span className="font-mono">http://localhost:8000</span></p>
          <p>• Frontend Server: <span className="font-mono">http://localhost:5173</span></p>
          <p>• Proxy Configuration: <span className="text-green-600">✅ Active</span></p>
          <p>• CORS Configuration: <span className="text-green-600">✅ Configured</span></p>
        </div>
      </div>
    </div>
  );
};

export default ConnectionTest;
