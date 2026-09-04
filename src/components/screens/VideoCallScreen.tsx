import React, { useState, useEffect } from 'react';
import { Video, VideoOff, Mic, MicOff, PhoneOff, MessageSquare, Share2 } from 'lucide-react';
import { ScreenId } from '../../types';
import { StatusBar } from '../common/StatusBar';

interface VideoCallScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

export const VideoCallScreen: React.FC<VideoCallScreenProps> = ({ onNavigate }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [seconds, setSeconds] = useState(654); // 10:54

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="relative h-screen w-full bg-slate-950 overflow-hidden text-white flex flex-col justify-between font-nunito">
      <StatusBar dark className="relative z-20 w-full" />

      {/* Background Doctor Video Stream */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=1000"
          alt="Dr. Sarah Johnson Video Stream"
          className="w-full h-full object-cover object-center filter brightness-95"
        />
        {/* Subtle Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none"></div>
      </div>

      {/* Top Bar: Timer & Recording Indicator */}
      <div className="relative z-10 p-6 flex justify-center items-center">
        <div className="flex items-center space-x-2 bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20">
          <span className="text-sm font-bold font-data tracking-wide">{formatTime(seconds)}</span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
        </div>
      </div>

      {/* Floating Self/Family Picture-in-Picture Preview */}
      <div className="absolute top-14 right-5 z-20 w-28 h-36 rounded-2xl overflow-hidden border-2 border-white/80 shadow-2xl bg-slate-800">
        {!isVideoOff ? (
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300"
            alt="Patient PIP"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-900 text-xs text-slate-400 font-bold">
            Camera Off
          </div>
        )}
      </div>

      {/* Bottom Overlay Info & Controls */}
      <div className="relative z-10 p-6 space-y-6">
        {/* Doctor Identity */}
        <div className="text-center">
          <h2 className="text-2xl font-bold font-outfit text-white drop-shadow-md">Dr. Sarah Johnson</h2>
          <p className="text-sm text-slate-200 font-medium drop-shadow-sm">Pediatrician, Prime Telecare</p>
        </div>

        {/* Video Call Controls Toolbar */}
        <div className="bg-white/95 backdrop-blur-xl rounded-full p-3 shadow-2xl flex items-center justify-around border border-white/40 max-w-sm mx-auto">
          {/* Camera Toggle */}
          <button
            onClick={() => setIsVideoOff(!isVideoOff)}
            className={`p-3.5 rounded-full border border-slate-300 transition-all ${
              isVideoOff ? 'bg-red-500 text-white border-red-500' : 'bg-white text-[#022434] hover:bg-slate-100'
            }`}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>

          {/* Mic Toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-3.5 rounded-full border border-slate-300 transition-all ${
              isMuted ? 'bg-red-500 text-white border-red-500' : 'bg-white text-[#022434] hover:bg-slate-100'
            }`}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* End Call Button */}
          <button
            onClick={() => onNavigate('patient-home')}
            className="p-4 rounded-full bg-red-600 text-white shadow-lg hover:bg-red-700 transition-all transform active:scale-95"
            title="End Call"
          >
            <PhoneOff className="w-6 h-6" />
          </button>

          {/* Chat Button */}
          <button
            onClick={() => onNavigate('active-chat')}
            className="p-3.5 rounded-full bg-white text-[#022434] border border-slate-300 hover:bg-slate-100 transition-all"
            title="Open Chat"
          >
            <MessageSquare className="w-5 h-5" />
          </button>

          {/* Share Button */}
          <button
            onClick={() => alert('Sharing screen / documents during call')}
            className="p-3.5 rounded-full bg-white text-[#022434] border border-slate-300 hover:bg-slate-100 transition-all"
            title="Share"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
