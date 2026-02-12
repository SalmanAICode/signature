'use client';

import { useState } from 'react';
import { EyeIcon, EyeSlashIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { ValidateApiResponse } from '@/lib/api/orgmeterImport';

interface Step1Props {
  importState: any;
  updateImportState: (updates: any) => void;
  nextStep: () => void;
  previousStep: () => void;
}

export default function Step1ApiValidation({ importState, updateImportState, nextStep }: Step1Props) {
  const [apiKey, setApiKey] = useState(importState.apiKey || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    success: boolean;
    message: string;
    data?: any;
  } | null>(null);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
    setValidationResult(null);
    
    // Reset validation state when API key changes
    updateImportState({
      apiKey: e.target.value,
      apiValidated: false
    });
  };

  const testConnection = async () => {
    if (!apiKey.trim()) {
      setValidationResult({
        success: false,
        message: 'Please enter an API key'
      });
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      const { validateOrgMeterApi } = await import('@/lib/api/orgmeterImport');
      const result = await validateOrgMeterApi({ apiKey });

      console.log('API Validation Result:', result);
      
      // If we get here without an exception, the HTTP call was successful (200)
      // Let's handle different possible response structures
      let success = false;
      let message = 'Connection failed';
      let data = null;

      if (result) {
        // Check if result has success property
        if (typeof result.success === 'boolean') {
          success = result.success;
          message = result.message || (success ? 'API key is valid and connection successful' : 'Connection failed');
          data = result.data;
        } else {
          // If no success property but we got a response, treat as success
          success = true;
          message = 'API key is valid and connection successful';
          data = result;
        }
      } else {
        // No result but no error thrown, treat as success
        success = true;
        message = 'API key is valid and connection successful';
      }
      
      setValidationResult({
        success,
        message,
        data
      });
      
      updateImportState({
        apiKey,
        apiValidated: success,
        importOrder: data?.importSteps || ['user', 'lender', 'iso', 'merchant', 'syndicator', 'advance']
      });
    } catch (error) {
      console.error('API Validation Error:', error);
      setValidationResult({
        success: false,
        message: error instanceof Error ? error.message : 'Connection failed. Please check your API key and try again.'
      });
      
      // Reset validation state when connection fails
      updateImportState({
        apiKey,
        apiValidated: false,
        importOrder: ['user', 'lender', 'iso', 'merchant', 'syndicator', 'advance']
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleNext = () => {
    if (validationResult?.success) {
      nextStep();
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Connect to OrgMeter
        </h2>
        <p className="text-gray-600">
          Enter your OrgMeter API key to establish a secure connection and validate access to your data.
        </p>
      </div>

      <div className="space-y-6">
        {/* API Key Input */}
        <div>
          <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
            OrgMeter API Key *
          </label>
          <div className="relative">
            <input
              id="apiKey"
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={handleApiKeyChange}
              placeholder="Enter your OrgMeter API key"
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
              disabled={isValidating}
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showApiKey ? (
                <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              ) : (
                <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            You can find your API key in your OrgMeter account settings under the API section.
          </p>
        </div>

        {/* Test Connection Button */}
        <div>
          <button
            onClick={testConnection}
            disabled={!apiKey.trim() || isValidating}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isValidating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Testing Connection...
              </>
            ) : (
              'Test Connection'
            )}
          </button>
        </div>

        {/* Validation Result */}
        {validationResult && (
          <div className={`p-4 rounded-lg border ${
            validationResult.success
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              {validationResult.success ? (
                <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5" />
              ) : (
                <XCircleIcon className="h-5 w-5 text-red-500 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`font-medium ${
                  validationResult.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {validationResult.success ? 'Connection Successful!' : 'Connection Failed'}
                </p>
                <p className={`text-sm mt-1 ${
                  validationResult.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {validationResult.message}
                </p>
                
                {validationResult.success && validationResult.data && (
                  <div className="mt-3 text-sm text-green-700">
                    <p><strong>Base URL:</strong> {validationResult.data.apiInfo?.baseURL}</p>
                    <p><strong>Available Import Steps:</strong> {validationResult.data.importSteps?.length || 0}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* API Key Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">How to get your API key:</h4>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Log in to your OrgMeter account</li>
            <li>Navigate to Settings → API Keys</li>
            <li>Create a new API key or copy an existing one</li>
            <li>Ensure the key has read access to the data you want to import</li>
          </ol>
        </div>

        {/* Next Button */}
        {validationResult?.success && (
          <div className="pt-4">
            <button
              onClick={handleNext}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircleIcon className="h-5 w-5" />
              Proceed to Funder Selection
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 