import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import JitsiMeet from './JitsiMeet';
import { useLanguage } from '../../contexts/LanguageContext';
import { 
  Video, 
  Users, 
  Clock, 
  Mic, 
  MicOff, 
  Video as VideoIcon, 
  VideoOff,
  Phone,
  PhoneOff,
  Settings,
  MessageSquare,
  Share2
} from 'lucide-react';

const LiveSession = ({ lectureId, userRole, userInfo }) => {
  const { t } = useLanguage();
  const [isInMeeting, setIsInMeeting] = useState(false);
  const [meetingInfo, setMeetingInfo] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMeetingInfo();
  }, [lectureId]);

  const fetchMeetingInfo = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/lectures/${lectureId}/meeting`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMeetingInfo(data);
      } else {
        setError('Failed to load meeting information');
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const joinMeeting = () => {
    if (!meetingInfo) return;
    
    const roomName = `smart-classroom-${lectureId}-${Date.now()}`;
    setIsInMeeting(true);
  };

  const leaveMeeting = () => {
    setIsInMeeting(false);
  };

  const toggleAudio = () => {
    // Jitsi API will handle this
  };

  const toggleVideo = () => {
    // Jitsi API will handle this
  };

  const shareScreen = () => {
    // Jitsi API will handle this
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>{t('loading')}...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert className="mb-4">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (isInMeeting && meetingInfo) {
    return (
      <div className="w-full h-screen">
        <JitsiMeet
          roomName={`smart-classroom-${lectureId}`}
          userInfo={userInfo}
          isModerator={userRole === 'faculty' || userRole === 'admin'}
          onMeetingEnd={leaveMeeting}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Meeting Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            {t('liveSession')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {meetingInfo ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{meetingInfo.title}</h3>
                  <p className="text-gray-600">{meetingInfo.description}</p>
                </div>
                <Badge variant={meetingInfo.status === 'live' ? 'default' : 'secondary'}>
                  {meetingInfo.status === 'live' ? t('live') : t('scheduled')}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">
                    {new Date(meetingInfo.scheduledTime?.start).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">
                    {participants.length} {t('participants')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  <span className="text-sm">
                    {meetingInfo.settings?.allowRecording ? t('recordingEnabled') : t('recordingDisabled')}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={joinMeeting} className="flex-1">
                  <Video className="h-4 w-4 mr-2" />
                  {t('joinMeeting')}
                </Button>
                {(userRole === 'faculty' || userRole === 'admin') && (
                  <Button variant="outline" onClick={shareScreen}>
                    <Share2 className="h-4 w-4 mr-2" />
                    {t('shareScreen')}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Video className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">{t('noMeetingScheduled')}</h3>
              <p className="text-gray-600 mb-4">{t('noMeetingDescription')}</p>
              {(userRole === 'faculty' || userRole === 'admin') && (
                <Button onClick={joinMeeting}>
                  <Video className="h-4 w-4 mr-2" />
                  {t('startMeeting')}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Meeting Controls Preview */}
      <Card>
        <CardHeader>
          <CardTitle>{t('meetingControls')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center gap-4">
            <Button variant="outline" size="sm" onClick={toggleAudio}>
              <Mic className="h-4 w-4 mr-2" />
              {t('mute')}
            </Button>
            <Button variant="outline" size="sm" onClick={toggleVideo}>
              <VideoIcon className="h-4 w-4 mr-2" />
              {t('video')}
            </Button>
            <Button variant="outline" size="sm">
              <MessageSquare className="h-4 w-4 mr-2" />
              {t('chat')}
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              {t('settings')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveSession;
