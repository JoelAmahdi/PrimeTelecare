import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Trash2,
  X,
  RefreshCw,
  LogOut,
  Bell,
  Clock,
  Shield,
  Check,
} from 'lucide-react';
import {
  isGoogleCalendarConnected,
  getGoogleCalendarUser,
  signInWithGoogleCalendar,
  disconnectGoogleCalendar,
  addConsultationToGoogleCalendar,
  listUpcomingGoogleCalendarEvents,
  deleteCalendarEvent,
  GoogleCalendarEvent,
  CalendarEventPayload,
} from '../../services/googleCalendar';
import { triggerHaptic } from '../../utils/haptics';
import { showToast } from '../../utils/toast';

interface GoogleCalendarSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingAppointment?: CalendarEventPayload | null;
  onEventSynced?: (event: GoogleCalendarEvent) => void;
}

export const GoogleCalendarSyncModal: React.FC<GoogleCalendarSyncModalProps> = ({
  isOpen,
  onClose,
  pendingAppointment,
  onEventSynced,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [googleUser, setGoogleUser] = useState<ReturnType<typeof getGoogleCalendarUser>>(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncedEvent, setSyncedEvent] = useState<GoogleCalendarEvent | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<GoogleCalendarEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<GoogleCalendarEvent | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state with service
  const refreshAuthState = () => {
    setIsConnected(isGoogleCalendarConnected());
    setGoogleUser(getGoogleCalendarUser());
  };

  useEffect(() => {
    refreshAuthState();

    const handleAuthChange = () => {
      refreshAuthState();
    };

    window.addEventListener('google-calendar-auth-changed', handleAuthChange);
    return () => window.removeEventListener('google-calendar-auth-changed', handleAuthChange);
  }, [isOpen]);

  // Load upcoming events if connected
  useEffect(() => {
    if (isOpen && isConnected) {
      loadCalendarEvents();
    }
  }, [isOpen, isConnected]);

  const loadCalendarEvents = async () => {
    setIsLoadingEvents(true);
    setErrorMsg(null);
    const res = await listUpcomingGoogleCalendarEvents(6);
    if (res.success && res.events) {
      setUpcomingEvents(res.events);
    } else if (res.error) {
      setErrorMsg(res.error);
    }
    setIsLoadingEvents(false);
  };

  const handleConnect = async () => {
    triggerHaptic('medium');
    setIsAuthorizing(true);
    setErrorMsg(null);

    const res = await signInWithGoogleCalendar();
    setIsAuthorizing(false);

    if (res.success) {
      triggerHaptic('success');
      showToast('Google Calendar connected successfully!');
      refreshAuthState();
      loadCalendarEvents();

      // If there is a pending appointment to sync, do it immediately
      if (pendingAppointment) {
        handleSyncAppointment(pendingAppointment);
      }
    } else {
      triggerHaptic('heavy');
      setErrorMsg(res.error || 'Failed to authorize Google Calendar.');
    }
  };

  const handleDisconnect = async () => {
    triggerHaptic('light');
    await disconnectGoogleCalendar();
    refreshAuthState();
    setUpcomingEvents([]);
    setSyncedEvent(null);
    showToast('Google Calendar disconnected.');
  };

  const handleSyncAppointment = async (appt: CalendarEventPayload) => {
    triggerHaptic('medium');
    setIsSyncing(true);
    setErrorMsg(null);

    const res = await addConsultationToGoogleCalendar(appt);
    setIsSyncing(false);

    if (res.success && res.event) {
      triggerHaptic('success');
      setSyncedEvent(res.event);
      showToast('Consultation synced to your Google Calendar!');
      if (onEventSynced) onEventSynced(res.event);
      loadCalendarEvents();
    } else {
      triggerHaptic('heavy');
      setErrorMsg(res.error || 'Failed to add appointment to Google Calendar.');
    }
  };

  const confirmDeleteEvent = async () => {
    if (!eventToDelete) return;
    triggerHaptic('heavy');

    const res = await deleteCalendarEvent(eventToDelete.id);
    if (res.success) {
      triggerHaptic('success');
      showToast('Event removed from Google Calendar.');
      setEventToDelete(null);
      loadCalendarEvents();
    } else {
      setErrorMsg(res.error || 'Failed to delete event from Google Calendar.');
      setEventToDelete(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold font-outfit text-sm text-[#0f172a]">
                Google Calendar Integration
              </h3>
              <p className="text-[11px] text-slate-500 font-nunito">
                Automated clinical schedules & reminders
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 font-nunito">
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl flex items-start space-x-2 text-xs text-rose-800 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block">Calendar Error</span>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {!isConnected ? (
            /* Unconnected State */
            <div className="text-center py-2 space-y-4">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
                <CalendarIcon className="w-8 h-8" />
              </div>

              <div>
                <h4 className="font-bold font-outfit text-base text-[#0f172a]">
                  Sync with Google Calendar
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Automatically add your telehealth consultations and receive Google notifications on all your devices.
                </p>
              </div>

              {/* Feature Points */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-left space-y-2.5 text-xs text-slate-600">
                <div className="flex items-center space-x-2.5">
                  <Bell className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Dual alerts: 15 minutes and 1 hour before consult</span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Automatic time zone synchronization (WAT/GMT)</span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <Shield className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Encrypted session room link in event details</span>
                </div>
              </div>

              {/* Official Google Sign-in Button */}
              <button
                type="button"
                onClick={handleConnect}
                disabled={isAuthorizing}
                className="w-full py-3 px-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold font-outfit text-xs rounded-2xl shadow-xs transition-all flex items-center justify-center space-x-2.5 cursor-pointer disabled:opacity-50"
              >
                {isAuthorizing ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>{isAuthorizing ? 'Authorizing Google...' : 'Sign in with Google'}</span>
              </button>
            </div>
          ) : (
            /* Connected State */
            <div className="space-y-4">
              {/* Account Card */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center space-x-3 min-w-0">
                  {googleUser?.photoURL ? (
                    <img
                      src={googleUser.photoURL}
                      alt={googleUser.displayName || 'Google User'}
                      className="w-10 h-10 rounded-full border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                      {googleUser?.email?.charAt(0).toUpperCase() || 'G'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <h4 className="font-bold font-outfit text-xs text-[#0f172a] truncate">
                        {googleUser?.displayName || 'Google Calendar'}
                      </h4>
                      <span className="bg-emerald-100 text-[#006c44] text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                        CONNECTED
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">{googleUser?.email}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
                  title="Disconnect Google Calendar"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {/* Action Banner for Pending Appointment */}
              {pendingAppointment && (
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase text-[#006c44] tracking-wider block">
                        Ready to Sync
                      </span>
                      <h4 className="font-bold font-outfit text-sm text-[#0f172a] mt-0.5">
                        Consultation with Dr. {pendingAppointment.doctorName}
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {pendingAppointment.dateStr} at {pendingAppointment.timeSlot} ({pendingAppointment.consultationType})
                      </p>
                    </div>
                    <div className="p-2 rounded-xl bg-emerald-100 text-[#006c44]">
                      <CalendarIcon className="w-4 h-4" />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSyncAppointment(pendingAppointment)}
                    disabled={isSyncing}
                    className="w-full py-2.5 bg-[#006c44] hover:bg-[#005536] text-white font-bold font-outfit text-xs rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSyncing ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>{isSyncing ? 'Adding to Calendar...' : 'Add to Google Calendar Now'}</span>
                  </button>
                </div>
              )}

              {/* Synced Confirmation */}
              {syncedEvent && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 flex items-start space-x-3 text-xs text-blue-900">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <span className="font-bold block">{syncedEvent.summary}</span>
                    <span className="text-blue-700 block mt-0.5">
                      Event successfully added to your Google Calendar.
                    </span>
                    {syncedEvent.htmlLink && (
                      <a
                        href={syncedEvent.htmlLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-bold mt-1.5"
                      >
                        <span>Open in Google Calendar</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Upcoming Google Calendar Events */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold font-outfit text-xs text-[#0f172a] uppercase tracking-wider">
                    Upcoming Calendar Events
                  </h4>
                  <button
                    onClick={loadCalendarEvents}
                    disabled={isLoadingEvents}
                    className="text-[11px] text-[#006c44] hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingEvents ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                {isLoadingEvents ? (
                  <div className="py-6 text-center text-xs text-slate-400">Loading schedule...</div>
                ) : upcomingEvents.length === 0 ? (
                  <div className="py-5 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    No upcoming events in primary calendar
                  </div>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {upcomingEvents.map((ev) => {
                      const startTime = ev.start.dateTime
                        ? new Date(ev.start.dateTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ev.start.date;

                      const startDate = ev.start.dateTime
                        ? new Date(ev.start.dateTime).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })
                        : '';

                      return (
                        <div
                          key={ev.id}
                          className="p-2.5 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between text-xs hover:border-slate-300 transition-colors"
                        >
                          <div className="min-w-0 pr-2">
                            <span className="font-semibold text-[#0f172a] block truncate">
                              {ev.summary || '(Untitled Event)'}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              {startDate} {startTime}
                            </span>
                          </div>

                          <div className="flex items-center space-x-1 shrink-0">
                            {ev.htmlLink && (
                              <a
                                href={ev.htmlLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                                title="Open in Google"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                triggerHaptic('medium');
                                setEventToDelete(ev);
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                              title="Delete from calendar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center space-x-1">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Encrypted OAuth via Google</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 font-bold font-outfit rounded-xl text-[#0f172a] transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>

      {/* Confirmation Dialog for Destructive Mutation (Per workspace-integration requirements) */}
      {eventToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start space-x-3">
              <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold font-outfit text-sm text-[#0f172a]">
                  Remove Calendar Event?
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to delete <strong className="text-[#0f172a]">"{eventToDelete.summary}"</strong> from your Google Calendar?
                </p>
              </div>
            </div>

            <div className="flex space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setEventToDelete(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold font-outfit text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteEvent}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold font-outfit text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
