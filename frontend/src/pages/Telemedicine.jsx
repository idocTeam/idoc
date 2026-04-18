import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  Users,
  Settings,
  Loader2,
  AlertCircle,
  Stethoscope,
  ChevronLeft,
  Clock,
} from 'lucide-react';
import { telemedicineService } from '../services';
import { getStoredUser } from '../utils/session';

const Telemedicine = () => {
  const [searchParams] = useSearchParams();
  const appointmentId = searchParams.get('appointmentId');
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [controls, setControls] = useState({ mic: true, video: true });
  const jitsiContainerRef = useRef(null);
  const jitsiApiRef = useRef(null);
  const navigate = useNavigate();
  const user = getStoredUser();

  useEffect(() => {
    if (!appointmentId) {
      setError('No appointment ID provided.');
      setLoading(false);
      return;
    }

    fetchSession();

    return () => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
        jitsiApiRef.current = null;
      }
    };
  }, [appointmentId]);

  useEffect(() => {
    if (isJoined && session && !jitsiApiRef.current) {
      const api = new window.JitsiMeetExternalAPI('meet.jit.si', {
        roomName: session.jitsiRoomId,
        width: '100%',
        height: '100%',
        parentNode: jitsiContainerRef.current,
        configOverwrite: {
          prejoinPageEnabled: false,
          startWithAudioMuted: !controls.mic,
          startWithVideoMuted: !controls.video,
        },
        interfaceConfigOverwrite: {
          // You can add interface customizations here
        },
        userInfo: {
          displayName: user?.name || 'User',
        },
      });

      jitsiApiRef.current = api;

      api.addEventListener('videoConferenceLeft', () => {
        setIsJoined(false);
        if (jitsiApiRef.current) {
          jitsiApiRef.current.dispose();
          jitsiApiRef.current = null;
        }
        navigate('/dashboard', { state: { message: 'Session ended successfully.' } });
      });
    }

    return () => {
      // No-op here, handled by the cleanup in the other useEffect or conference left
    };
  }, [isJoined, session, controls.mic, controls.video, user?.name, navigate]);

  const fetchSession = async () => {
    try {
      setLoading(true);
      const { data } = await telemedicineService.getSession(appointmentId);
      setSession(data.session);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not find a valid telemedicine session. Make sure payment is completed first.');
    } finally {
      setLoading(false);
    }
  };

  const loadJitsiScript = () => {
    return new Promise((resolve) => {
      if (window.JitsiMeetExternalAPI) {
        resolve();
        return;
      }

      const existing = document.querySelector('script[data-jitsi="true"]');
      if (existing) {
        existing.addEventListener('load', resolve, { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      script.dataset.jitsi = 'true';
      script.onload = resolve;
      document.body.appendChild(script);
    });
  };

  const startMeeting = async () => {
    if (!session) return;
    await loadJitsiScript();
    setIsJoined(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white space-y-6">
        <Loader2 className="w-12 h-12 animate-spin text-primary-500" />
        <p className="text-xl font-medium animate-pulse">Initializing secure session...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full card text-center space-y-6 py-12">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="text-red-500 w-10 h-10" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Session Unavailable</h2>
            <p className="text-slate-500 mt-2 font-medium">{error}</p>
          </div>
          <Link to="/dashboard" className="btn btn-primary inline-flex">Return to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col pt-20">
      <div className="bg-slate-900 border-b border-slate-800 py-4 px-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/dashboard" className="p-2 text-slate-400 hover:text-white transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <Video className="text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="text-white font-bold leading-none tracking-tight">Telemedicine Consultation</h1>
              <p className="text-primary-500 text-xs font-bold uppercase tracking-widest mt-1">Encrypted Session</p>
            </div>
          </div>
        </div>
        <div className="hidden md:flex items-center space-x-6">
          <div className="flex items-center space-x-2 text-slate-400">
            <Clock className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">{session?.startTime}</span>
          </div>
          <div className="h-4 w-px bg-slate-700" />
          <div className="flex items-center space-x-2 text-green-500">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider">Live</span>
          </div>
        </div>
      </div>

      <div className="flex-grow relative overflow-hidden flex flex-col lg:flex-row">
        <div className="flex-grow relative bg-black min-h-[70vh]">
          {!isJoined ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-8 bg-slate-950">
              <div className="relative">
                <div className="w-40 h-40 bg-slate-900 rounded-full flex items-center justify-center border-4 border-slate-800 shadow-2xl relative overflow-hidden group">
                  {controls.video ? (
                    <div className="absolute inset-0 bg-slate-800 animate-pulse flex items-center justify-center">
                      <Stethoscope className="w-16 h-16 text-primary-500 opacity-20" />
                    </div>
                  ) : (
                    <VideoOff className="w-16 h-16 text-slate-700" />
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-primary-600 p-2 rounded-xl border-4 border-slate-950 shadow-xl">
                  <Video className="w-5 h-5 text-white" />
                </div>
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold text-white tracking-tight">Ready to join?</h3>
                <p className="text-slate-500 font-medium">Test your camera and microphone before entering.</p>
              </div>

              <div className="flex items-center space-x-4">
                <button onClick={() => setControls((c) => ({ ...c, mic: !c.mic }))} className={`p-4 rounded-2xl transition-all shadow-xl ${controls.mic ? 'bg-slate-800 text-white' : 'bg-red-500 text-white shadow-red-500/20'}`}>
                  {controls.mic ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                </button>
                <button onClick={() => setControls((c) => ({ ...c, video: !c.video }))} className={`p-4 rounded-2xl transition-all shadow-xl ${controls.video ? 'bg-slate-800 text-white' : 'bg-red-500 text-white shadow-red-500/20'}`}>
                  {controls.video ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                </button>
                <button onClick={startMeeting} className="btn btn-primary !px-12 !py-4 text-lg shadow-2xl shadow-primary-600/20">Join Meeting</button>
              </div>
            </div>
          ) : (
            <div ref={jitsiContainerRef} className="w-full h-full min-h-[70vh]" />
          )}
        </div>

        <div className="hidden lg:flex w-80 bg-slate-900 flex-col border-l border-slate-800">
          <div className="p-6 border-b border-slate-800">
            <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-6">Session Summary</h4>
            <div className="space-y-4">
              <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                <p className="text-[10px] text-primary-500 font-bold uppercase mb-1">Appointment ID</p>
                <p className="text-sm text-slate-300 font-medium leading-relaxed break-all">{session?.appointmentId}</p>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                <p className="text-[10px] text-primary-500 font-bold uppercase mb-1">Date & Time</p>
                <p className="text-sm text-slate-300 font-medium leading-relaxed">{session?.appointmentDate} at {session?.startTime}</p>
              </div>
            </div>
          </div>

          <div className="flex-grow p-6 flex flex-col justify-end space-y-6">
            <div className="flex items-center space-x-4 p-4 bg-primary-900/20 rounded-3xl border border-primary-500/20">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-600/20">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-primary-400 font-bold uppercase tracking-wider">Participants</p>
                <p className="text-sm text-white font-bold">Doctor & Patient</p>
              </div>
            </div>
            <button type="button" className="w-full btn btn-outline !border-slate-800 !text-slate-400 hover:!bg-slate-800 flex items-center justify-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Session Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Telemedicine;
