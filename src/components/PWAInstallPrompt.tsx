/**
 * PWA Install Prompt Component
 * Shows install prompts and update notifications for the PWA
 */

import React, { useState, useEffect } from 'react';
import { 
  ArrowDownTrayIcon, 
  XMarkIcon, 
  ArrowPathIcon,
  SignalIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { pwaHelper, useNetworkStatus } from '../utils/pwaHelpers';

interface PWAInstallPromptProps {
  className?: string;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ className = '' }) => {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const networkStatus = useNetworkStatus();

  useEffect(() => {
    // Check initial states
    setCanInstall(pwaHelper.canInstall());
    setIsInstalled(pwaHelper.isInstalled());
    setHasUpdate(pwaHelper.hasUpdate());

    // Setup update listener
    pwaHelper.onUpdateAvailable((updateAvailable) => {
      setHasUpdate(updateAvailable);
    });

    // Show install prompt after a delay if not dismissed and can install
    const timer = setTimeout(() => {
      if (pwaHelper.canInstall() && !pwaHelper.isInstalled() && !dismissed) {
        setShowInstallPrompt(true);
      }
    }, 5000); // Show after 5 seconds

    // Setup network listeners for offline sync
    pwaHelper.setupNetworkListeners();

    return () => clearTimeout(timer);
  }, [dismissed]);

  const handleInstall = async () => {
    setInstalling(true);
    try {
      const outcome = await pwaHelper.promptInstall();
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setShowInstallPrompt(false);
        setCanInstall(false);
        
        // Show success notification
        await pwaHelper.showNotification('NFL Pick\'em App Installed!', {
          body: 'The app has been added to your home screen. You can now access it quickly anytime!',
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
        });
      } else {
        setDismissed(true);
        setShowInstallPrompt(false);
      }
    } catch (error) {
      console.error('Installation failed:', error);
    } finally {
      setInstalling(false);
    }
  };

  const handleUpdate = () => {
    pwaHelper.applyUpdate();
  };

  const dismissInstallPrompt = () => {
    setDismissed(true);
    setShowInstallPrompt(false);
  };

  const getNetworkStatusIcon = () => {
    switch (networkStatus) {
      case 'offline':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
      case 'slow':
        return <SignalIcon className="h-4 w-4 text-yellow-500" />;
      case 'online':
        return <SignalIcon className="h-4 w-4 text-green-500" />;
    }
  };

  const getNetworkStatusText = () => {
    switch (networkStatus) {
      case 'offline':
        return 'Offline - Picks will sync when reconnected';
      case 'slow':
        return 'Slow Connection - Some features may be limited';
      case 'online':
        return 'Online';
    }
  };

  return (
    <div className={`pwa-install-prompt ${className}`}>
      {/* Update Available Banner */}
      {hasUpdate && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white px-4 py-3">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <div className="flex items-center space-x-2">
              <ArrowPathIcon className="h-5 w-5" />
              <span className="text-sm font-medium">App update available!</span>
            </div>
            <button
              onClick={handleUpdate}
              className="px-3 py-1 bg-blue-700 hover:bg-blue-800 rounded text-sm font-medium transition-colors"
            >
              Update
            </button>
          </div>
        </div>
      )}

      {/* Network Status Indicator */}
      {(networkStatus === 'offline' || networkStatus === 'slow') && (
        <div className="fixed top-16 left-4 right-4 z-40 mx-auto max-w-md">
          <div className={`px-3 py-2 rounded-lg shadow-lg flex items-center space-x-2 text-sm ${
            networkStatus === 'offline' 
              ? 'bg-red-100 text-red-800 border border-red-200' 
              : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
          }`}>
            {getNetworkStatusIcon()}
            <span>{getNetworkStatusText()}</span>
          </div>
        </div>
      )}

      {/* Install Prompt Modal */}
      {showInstallPrompt && canInstall && !isInstalled && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <ArrowDownTrayIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Install NFL Pick'em
                  </h3>
                  <p className="text-sm text-gray-600">
                    Add to home screen for quick access
                  </p>
                </div>
              </div>
              <button
                onClick={dismissInstallPrompt}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Works offline after installation</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Fast loading and better performance</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Quick access from home screen</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Perfect for game-day picks</span>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={dismissInstallPrompt}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={installing}
              >
                Maybe Later
              </button>
              <button
                onClick={handleInstall}
                disabled={installing}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {installing ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    <span>Installing...</span>
                  </>
                ) : (
                  <>
                    <ArrowDownTrayIcon className="h-4 w-4" />
                    <span>Install</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Install Button for Header/Navigation */}
      {canInstall && !isInstalled && !showInstallPrompt && !dismissed && (
        <button
          onClick={() => setShowInstallPrompt(true)}
          className="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md transition-colors"
          title="Install NFL Pick'em App"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Install App</span>
        </button>
      )}
    </div>
  );
};

/**
 * Compact PWA Status Indicator for navigation bars
 */
export const PWAStatusIndicator: React.FC<{ className?: string }> = ({ className = '' }) => {
  const networkStatus = useNetworkStatus();
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    setIsInstalled(pwaHelper.isInstalled());
  }, []);

  const getNetworkStatusIcon = () => {
    switch (networkStatus) {
      case 'offline':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
      case 'slow':
        return <SignalIcon className="h-4 w-4 text-yellow-500" />;
      case 'online':
        return <SignalIcon className="h-4 w-4 text-green-500" />;
    }
  };

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {getNetworkStatusIcon()}
      {isInstalled && (
        <span className="text-xs text-gray-500 hidden sm:inline">PWA</span>
      )}
    </div>
  );
};

export default PWAInstallPrompt;