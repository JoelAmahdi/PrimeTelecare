/**
 * Live WebRTC Media & Audio Stream Management for Prime Telecare
 * Handles real camera/microphone hardware streams, audio analysis, and screen sharing.
 */

export interface LiveMediaState {
  stream: MediaStream | null;
  videoTrack: MediaStreamTrack | null;
  audioTrack: MediaStreamTrack | null;
  hasCamera: boolean;
  hasMicrophone: boolean;
  error: string | null;
}

export async function requestUserMedia(
  video: boolean = true,
  audio: boolean = true,
  facingMode: 'user' | 'environment' = 'user'
): Promise<LiveMediaState> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return {
      stream: null,
      videoTrack: null,
      audioTrack: null,
      hasCamera: false,
      hasMicrophone: false,
      error: 'Media devices not supported in this browser environment.',
    };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: video ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode } : false,
      audio: audio ? { echoCancellation: true, noiseSuppression: true, autoGainControl: true } : false,
    });

    const videoTrack = stream.getVideoTracks()[0] || null;
    const audioTrack = stream.getAudioTracks()[0] || null;

    return {
      stream,
      videoTrack,
      audioTrack,
      hasCamera: !!videoTrack,
      hasMicrophone: !!audioTrack,
      error: null,
    };
  } catch (err: any) {
    console.warn('[LiveMedia] Camera/Mic request failed, attempting audio-only fallback:', err.message);

    // Fallback: Try audio only if video request failed (e.g. no camera attached)
    if (video) {
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        return {
          stream: audioStream,
          videoTrack: null,
          audioTrack: audioStream.getAudioTracks()[0] || null,
          hasCamera: false,
          hasMicrophone: true,
          error: 'Camera unavailable. Switched to live microphone audio stream.',
        };
      } catch (audioErr: any) {
        return {
          stream: null,
          videoTrack: null,
          audioTrack: null,
          hasCamera: false,
          hasMicrophone: false,
          error: audioErr.message || 'Camera and microphone permissions were denied.',
        };
      }
    }

    return {
      stream: null,
      videoTrack: null,
      audioTrack: null,
      hasCamera: false,
      hasMicrophone: false,
      error: err.message || 'Media permission denied.',
    };
  }
}

/**
 * Real-time microphone audio visualizer using Web Audio API
 */
export function setupAudioAnalyser(
  stream: MediaStream,
  onLevel: (level: number) => void
): () => void {
  try {
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) return () => {};

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioContextClass();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();

    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.5;
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let isRunning = true;
    let animId: number;

    const tick = () => {
      if (!isRunning) return;
      analyser.getByteFrequencyData(dataArray);

      // Compute average volume level 0 - 100
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / dataArray.length;
      const normalized = Math.min(100, Math.round((avg / 255) * 120));
      onLevel(normalized);

      animId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      isRunning = false;
      cancelAnimationFrame(animId);
      audioCtx.close().catch(() => {});
    };
  } catch (e) {
    console.warn('[LiveMedia] Could not initialize Web Audio analyser', e);
    return () => {};
  }
}

/**
 * Screen share stream using getDisplayMedia
 */
export async function startScreenShare(): Promise<MediaStream | null> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getDisplayMedia) {
    return null;
  }
  try {
    return await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true,
    });
  } catch (e) {
    console.warn('[LiveMedia] Screen share cancelled or not allowed', e);
    return null;
  }
}

/**
 * Creates a responsive live canvas video stream for the remote doctor
 * with live animated ECG vitals, audio waveform, and consultation indicators.
 */
export function createDoctorCanvasStream(doctorName: string, specialty: string): {
  stream: MediaStream;
  stop: () => void;
} {
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d')!;

  let isRunning = true;
  let frame = 0;

  // Pre-load doctor image
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=1280';

  const draw = () => {
    if (!isRunning) return;
    frame++;

    // Background
    if (img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Vignette gradient
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, 'rgba(0,0,0,0.4)');
    grad.addColorStop(0.7, 'rgba(0,0,0,0.1)');
    grad.addColorStop(1, 'rgba(0,0,0,0.85)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Live ECG Line on top right
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 3;
    ctx.beginPath();
    const ecgStartX = canvas.width - 240;
    const ecgY = 80;
    for (let x = 0; x < 200; x += 4) {
      const offset = (x + frame * 3) % 180;
      let spike = 0;
      if (offset > 70 && offset < 90) {
        spike = (offset - 80) * 3;
      } else if (offset >= 90 && offset < 100) {
        spike = -(offset - 90) * 4;
      }
      const plotX = ecgStartX + x;
      const plotY = ecgY + spike + Math.sin((x + frame) * 0.1) * 2;
      if (x === 0) ctx.moveTo(plotX, plotY);
      else ctx.lineTo(plotX, plotY);
    }
    ctx.stroke();

    // Vitals indicator text
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = 'bold 20px "Outfit", sans-serif';
    ctx.fillText('LIVE HD TELEHEALTH', 50, 60);

    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 16px "Outfit", sans-serif';
    ctx.fillText('• 74 BPM  • SpO2 99%  • 118/76 mmHg', canvas.width - 240, 50);

    requestAnimationFrame(draw);
  };

  draw();

  const stream = canvas.captureStream(30);

  return {
    stream,
    stop: () => {
      isRunning = false;
    },
  };
}

