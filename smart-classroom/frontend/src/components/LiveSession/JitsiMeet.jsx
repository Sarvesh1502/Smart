import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

const JitsiMeet = ({ roomName, userInfo, onMeetingEnd, isModerator = false }) => {
  const jitsiContainerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!roomName || !userInfo) return;

    const loadJitsiScript = () => {
      return new Promise((resolve, reject) => {
        if (window.JitsiMeetExternalAPI) {
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://meet.jit.si/external_api.js';
        script.async = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    const initializeJitsi = async () => {
      try {
        setIsLoading(true);
        setError(null);

        await loadJitsiScript();

        const domain = process.env.REACT_APP_JITSI_DOMAIN || 'meet.jit.si';
        
        const options = {
          roomName: roomName,
          width: '100%',
          height: '100%',
          parentNode: jitsiContainerRef.current,
          userInfo: {
            displayName: userInfo.name,
            email: userInfo.email
          },
          configOverwrite: {
            startWithAudioMuted: !isModerator,
            startWithVideoMuted: !isModerator,
            enableWelcomePage: false,
            prejoinPageEnabled: false,
            disableModeratorIndicator: !isModerator,
            startScreenSharing: false,
            enableEmailInStats: false
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: [
              'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
              'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
              'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
              'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
              'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone'
            ],
            SETTINGS_SECTIONS: ['devices', 'language', 'moderator', 'profile', 'calendar'],
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            SHOW_BRAND_WATERMARK: false,
            SHOW_POWERED_BY: false
          }
        };

        const api = new window.JitsiMeetExternalAPI(domain, options);

        api.addEventListeners({
          readyToClose: () => {
            onMeetingEnd && onMeetingEnd();
          },
          participantLeft: (participant) => {
            console.log('Participant left:', participant);
          },
          participantJoined: (participant) => {
            console.log('Participant joined:', participant);
          },
          videoConferenceJoined: () => {
            console.log('Video conference joined');
            setIsLoading(false);
          },
          videoConferenceLeft: () => {
            console.log('Video conference left');
            onMeetingEnd && onMeetingEnd();
          },
          error: (error) => {
            console.error('Jitsi error:', error);
            setError('Failed to join meeting. Please try again.');
            setIsLoading(false);
          }
        });

        // Store API reference for cleanup
        jitsiContainerRef.current.jitsiApi = api;

      } catch (err) {
        console.error('Failed to initialize Jitsi:', err);
        setError('Failed to load meeting interface. Please check your internet connection.');
        setIsLoading(false);
      }
    };

    initializeJitsi();

    // Cleanup function
    return () => {
      if (jitsiContainerRef.current?.jitsiApi) {
        jitsiContainerRef.current.jitsiApi.dispose();
      }
    };
  }, [roomName, userInfo, isModerator, onMeetingEnd]);

  if (error) {
    return (
      <Card className="p-6 text-center">
        <div className="text-red-600 mb-4">
          <h3 className="text-lg font-semibold">Connection Error</h3>
          <p>{error}</p>
        </div>
        <Button onClick={() => window.location.reload()}>
          Retry Connection
        </Button>
      </Card>
    );
  }

  return (
    <div className="w-full h-full relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Joining meeting...</p>
          </div>
        </div>
      )}
      <div 
        ref={jitsiContainerRef} 
        className="w-full h-full"
        style={{ minHeight: '500px' }}
      />
    </div>
  );
};

export default JitsiMeet;
