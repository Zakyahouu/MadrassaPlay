import React, { useEffect, useState, useRef } from 'react';
import { ArrowLeft, Play, Pause, Volume2, VolumeX, Maximize, Minimize, Repeat } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TutorialVideo = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLooping, setIsLooping] = useState(false);

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Auto-play when loaded
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(err => {
        console.log('Auto-play prevented:', err);
      });
    }
  }, []);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const toggleLoop = () => {
    if (videoRef.current) {
      videoRef.current.loop = !isLooping;
      setIsLooping(!isLooping);
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        const videoContainer = videoRef.current.parentElement;
        if (videoContainer.requestFullscreen) {
          await videoContainer.requestFullscreen();
        } else if (videoContainer.webkitRequestFullscreen) {
          await videoContainer.webkitRequestFullscreen();
        } else if (videoContainer.msRequestFullscreen) {
          await videoContainer.msRequestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          await document.msExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Error attempting to toggle fullscreen:', err);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(progress);
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleProgressClick = (e) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const clickedValue = (x / rect.width) * videoRef.current.duration;
      videoRef.current.currentTime = clickedValue;
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center">
        <button
          onClick={() => window.close()}
          className="text-white hover:text-gray-300 flex items-center gap-2 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Close</span>
        </button>
      </div>

      {/* Video Container */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative w-full max-w-6xl aspect-video group">
          {/* Video Element */}
          <video
            ref={videoRef}
            className="w-full h-full rounded-lg shadow-2xl"
            playsInline
            onClick={togglePlay}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            preload="auto"
            loop={isLooping}
          >
            <source src="/assets/tuto.mp4" type="video/mp4" />
          </video>

          {/* Play/Pause Overlay */}
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity cursor-pointer"
            onClick={togglePlay}
          >
            {!isPlaying && (
              <div className="bg-white/20 backdrop-blur-sm p-6 rounded-full">
                <Play className="w-12 h-12 text-white" />
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Progress Bar */}
            <div 
              className="w-full h-1 bg-gray-600 rounded-full mb-4 cursor-pointer"
              onClick={handleProgressClick}
            >
              <div 
                className="h-full bg-purple-500 rounded-full relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-purple-300 rounded-full shadow-lg"></div>
              </div>
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-4">
                {/* Play/Pause */}
                <button onClick={togglePlay} className="hover:text-purple-400 transition-colors">
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </button>

                {/* Volume */}
                <div className="flex items-center gap-2">
                  <button onClick={toggleMute} className="hover:text-purple-400 transition-colors">
                    {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-20 accent-purple-500"
                  />
                </div>

                {/* Time */}
                <div className="text-sm font-medium">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Loop button */}
                <button 
                  onClick={toggleLoop} 
                  className={`hover:text-purple-400 transition-colors ${isLooping ? 'text-purple-400' : ''}`}
                  title={isLooping ? 'Disable loop' : 'Enable loop'}
                >
                  <Repeat className="w-6 h-6" />
                </button>

                {/* Fullscreen */}
                <button 
                  onClick={toggleFullscreen} 
                  className="hover:text-purple-400 transition-colors"
                  title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                >
                  {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialVideo;