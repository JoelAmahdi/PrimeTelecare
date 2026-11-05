import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import firebaseApp, { auth as firebaseAuth } from '../firebase';
export { firebaseApp, firebaseAuth };

// IN-MEMORY TOKEN STORAGE (CRITICAL: Per workspace-integration rules, do NOT store tokens in localStorage/sessionStorage)
let inMemoryAccessToken: string | null = null;
let inMemoryCalendarUser: {
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  uid: string;
} | null = null;

// Setup Google Calendar Provider
const calendarProvider = new GoogleAuthProvider();
calendarProvider.addScope('https://www.googleapis.com/auth/calendar.events');
calendarProvider.addScope('https://www.googleapis.com/auth/calendar.readonly');
calendarProvider.setCustomParameters({
  prompt: 'consent',
  access_type: 'offline',
});

// Broadcast auth change events
function emitCalendarAuthChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('google-calendar-auth-changed', {
        detail: {
          isConnected: isGoogleCalendarConnected(),
          user: inMemoryCalendarUser,
        },
      })
    );
  }
}

// Track auth state
if (typeof window !== 'undefined') {
  onAuthStateChanged(firebaseAuth, (user) => {
    if (!user) {
      inMemoryAccessToken = null;
      inMemoryCalendarUser = null;
      emitCalendarAuthChanged();
    } else {
      inMemoryCalendarUser = {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        uid: user.uid,
      };
      emitCalendarAuthChanged();
    }
  });
}

/**
 * Returns true if a valid Google Calendar access token is held in-memory
 */
export function isGoogleCalendarConnected(): boolean {
  return inMemoryAccessToken !== null && inMemoryCalendarUser !== null;
}

/**
 * Returns current authenticated Google user
 */
export function getGoogleCalendarUser() {
  return inMemoryCalendarUser;
}

/**
 * Returns current in-memory access token
 */
export function getGoogleCalendarToken(): string | null {
  return inMemoryAccessToken;
}

/**
 * Initiates client-side OAuth popup using Firebase Auth GoogleAuthProvider
 */
export async function signInWithGoogleCalendar(): Promise<{
  success: boolean;
  user?: typeof inMemoryCalendarUser;
  error?: string;
}> {
  try {
    const result = await signInWithPopup(firebaseAuth, calendarProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;

    if (!token) {
      throw new Error('No access token returned by Google OAuth provider.');
    }

    // Retain strictly in memory
    inMemoryAccessToken = token;
    inMemoryCalendarUser = {
      email: result.user.email,
      displayName: result.user.displayName,
      photoURL: result.user.photoURL,
      uid: result.user.uid,
    };

    emitCalendarAuthChanged();

    return {
      success: true,
      user: inMemoryCalendarUser,
    };
  } catch (error: any) {
    console.error('Google Calendar sign-in error:', error);
    return {
      success: false,
      error: error?.message || 'Authentication failed. Please verify popup permissions.',
    };
  }
}

/**
 * Disconnects Google Calendar and clears in-memory credentials
 */
export async function disconnectGoogleCalendar(): Promise<void> {
  try {
    await firebaseSignOut(firebaseAuth);
  } catch (e) {
    console.warn('Error signing out of Firebase Auth:', e);
  } finally {
    inMemoryAccessToken = null;
    inMemoryCalendarUser = null;
    emitCalendarAuthChanged();
  }
}

export interface CalendarEventPayload {
  id?: string;
  doctorName: string;
  doctorSpecialty?: string;
  patientName?: string;
  consultationType: 'Video' | 'Voice' | 'Chat' | string;
  dateStr: string; // e.g. "Wed, Oct 24, 2026" or "Today, Oct 24, 2026"
  timeSlot: string; // e.g. "10:30 AM"
  durationMinutes?: number;
  meetingLink?: string;
  notes?: string;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  htmlLink?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  location?: string;
  conferenceData?: any;
}

/**
 * Parses application date/time strings into ISO 8601 strings
 */
export function parseAppointmentToIsoDates(
  dateStr: string,
  timeSlot: string,
  durationMinutes = 30
): { startIso: string; endIso: string } {
  const now = new Date();
  let targetYear = now.getFullYear();

  // Extract clean date tokens
  // Strip "Today, ", "Tomorrow, ", "Wed, "
  const cleanedDate = dateStr
    .replace(/^(Today|Tomorrow|Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s*/i, '')
    .trim();

  // Try parsing directly
  let dateObj = new Date(cleanedDate);
  if (isNaN(dateObj.getTime())) {
    dateObj = new Date();
  }

  // Parse timeSlot e.g. "10:30 AM" or "02:15 PM"
  const timeMatch = timeSlot.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  let hours = 10;
  let minutes = 30;

  if (timeMatch) {
    hours = parseInt(timeMatch[1], 10);
    minutes = parseInt(timeMatch[2], 10);
    const meridiem = timeMatch[3]?.toUpperCase();
    if (meridiem === 'PM' && hours < 12) {
      hours += 12;
    } else if (meridiem === 'AM' && hours === 12) {
      hours = 0;
    }
  }

  const startDate = new Date(dateObj);
  startDate.setHours(hours, minutes, 0, 0);

  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

  return {
    startIso: startDate.toISOString(),
    endIso: endDate.toISOString(),
  };
}

/**
 * Creates a consultation appointment event in the user's primary Google Calendar
 */
export async function addConsultationToGoogleCalendar(
  payload: CalendarEventPayload
): Promise<{ success: boolean; event?: GoogleCalendarEvent; error?: string }> {
  // If not yet authenticated, trigger sign in
  if (!inMemoryAccessToken) {
    const authResult = await signInWithGoogleCalendar();
    if (!authResult.success || !inMemoryAccessToken) {
      return {
        success: false,
        error: authResult.error || 'Google Calendar authorization is required.',
      };
    }
  }

  const { startIso, endIso } = parseAppointmentToIsoDates(
    payload.dateStr,
    payload.timeSlot,
    payload.durationMinutes || 30
  );

  const eventBody = {
    summary: `🩺 Telehealth Consult: Dr. ${payload.doctorName} (${payload.consultationType})`,
    description: [
      `Prime Telecare Telehealth Consultation`,
      `• Doctor: Dr. ${payload.doctorName} (${payload.doctorSpecialty || 'General Practice'})`,
      `• Patient: ${payload.patientName || 'Ada Okonkwo'}`,
      `• Modality: ${payload.consultationType} Teleconsultation`,
      `• Scheduled Slot: ${payload.timeSlot} (${payload.dateStr})`,
      payload.notes ? `• Clinical Notes/Symptoms: ${payload.notes}` : '',
      `• Telehealth Portal: https://primetelecare.health/consultation`,
    ]
      .filter(Boolean)
      .join('\n'),
    start: {
      dateTime: startIso,
      timeZone: 'Africa/Lagos',
    },
    end: {
      dateTime: endIso,
      timeZone: 'Africa/Lagos',
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 15 },
        { method: 'popup', minutes: 60 },
        { method: 'email', minutes: 120 },
      ],
    },
    location: 'Prime Telecare Encrypted Video Room',
  };

  try {
    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${inMemoryAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventBody),
      }
    );

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      const errMsg = errJson?.error?.message || `HTTP ${response.status} ${response.statusText}`;
      if (response.status === 401) {
        // Token expired
        inMemoryAccessToken = null;
        emitCalendarAuthChanged();
      }
      return { success: false, error: errMsg };
    }

    const createdEvent = (await response.json()) as GoogleCalendarEvent;
    return { success: true, event: createdEvent };
  } catch (error: any) {
    console.error('Error inserting event to Google Calendar:', error);
    return {
      success: false,
      error: error?.message || 'Failed to communicate with Google Calendar API.',
    };
  }
}

/**
 * Lists upcoming events from user's primary calendar
 */
export async function listUpcomingGoogleCalendarEvents(
  maxResults = 10
): Promise<{ success: boolean; events?: GoogleCalendarEvent[]; error?: string }> {
  if (!inMemoryAccessToken) {
    return {
      success: false,
      error: 'Google Calendar is not connected.',
    };
  }

  try {
    const timeMin = new Date().toISOString();
    const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
    url.searchParams.set('timeMin', timeMin);
    url.searchParams.set('singleEvents', 'true');
    url.searchParams.set('orderBy', 'startTime');
    url.searchParams.set('maxResults', String(maxResults));

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${inMemoryAccessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        inMemoryAccessToken = null;
        emitCalendarAuthChanged();
      }
      const errJson = await response.json().catch(() => ({}));
      return { success: false, error: errJson?.error?.message || 'Failed to list events.' };
    }

    const data = await response.json();
    return { success: true, events: data.items || [] };
  } catch (error: any) {
    console.error('Error querying Google Calendar:', error);
    return { success: false, error: error?.message || 'Failed to query calendar.' };
  }
}

/**
 * Deletes an event from Google Calendar (Requires confirmation in UI)
 */
export async function deleteCalendarEvent(
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  if (!inMemoryAccessToken) {
    return { success: false, error: 'Google Calendar not connected.' };
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${inMemoryAccessToken}`,
        },
      }
    );

    if (!response.ok && response.status !== 204) {
      const errJson = await response.json().catch(() => ({}));
      return { success: false, error: errJson?.error?.message || 'Failed to delete event.' };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Delete request failed.' };
  }
}
