"use client";
import { usePlayerStore } from '@/hooks/usePlayerStore';
import { Play, SkipBack, SkipForward, Volume2, Repeat, Repeat1, Shuffle } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { formatTime } from '@/lib/utils';

const PlayerBar = () => {
  const { 
    isPlaying, 
    currentSong, 
    volume, 
    progress, 
    duration, 
    play, 
    pause, 
    next, 
    prev, 
    setVolume, 
    setProgress,
    setSeekTo,
    isShuffling,
    repeatMode,
    toggleShuffle,
    setRepeatMode
  } = usePlayerStore();

  const togglePlay = () => {
    if (isPlaying) pause();
    else play();
  };

  const toggleRepeat = () => {
    if (repeatMode === 'off') setRepeatMode('all');
    else if (repeatMode === 'all') setRepeatMode('one');
    else setRepeatMode('off');
  };

  const handleSeek = (value: number[]) => {
    setSeekTo(value[0]);
    setProgress(value[0]); // Optimistic update
  };

  if (!currentSong) return null; // Or return a disabled state

  return (
    <div className="fixed bottom-0 left-0 w-full h-20 md:h-24 glass z-50 px-4 md:px-8 flex items-center justify-between bg-black/40 backdrop-blur-md border-t border-white/10 transition-all duration-300">
      {/* Song Info */}
      <div className="flex items-center w-full md:w-1/4 pr-4 md:pr-0">
        <div className="w-12 h-12 md:w-14 md:h-14 bg-gray-800 rounded-md neon-box mr-3 md:mr-4 shrink-0 relative overflow-hidden">
            {currentSong.coverArt && <img src={currentSong.coverArt} alt="Cover" className="object-cover w-full h-full" />}
        </div>
        <div className="overflow-hidden flex-1">
          <h4 className="text-white font-medium truncate text-sm md:text-base">{currentSong.title}</h4>
          <p className="text-gray-400 text-xs md:text-sm truncate">{currentSong.artist}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center w-auto md:w-1/2 md:max-w-2xl px-0 md:px-4 absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 bottom-2 md:bottom-auto">
        <div className="flex items-center gap-4 md:gap-6 mb-1 md:mb-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className={`hidden md:inline-flex hover:bg-transparent ${isShuffling ? 'text-accent' : 'text-gray-400 hover:text-white'}`}
            onClick={toggleShuffle}
          >
            <Shuffle size={20} />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-transparent" onClick={prev}>
            <SkipBack size={20} className="md:w-6 md:h-6" />
          </Button>
          <Button 
            size="icon"
            className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-accent text-accent-foreground hover:scale-105 transition-transform neon-box hover:bg-accent/90"
            onClick={togglePlay}
          >
            {isPlaying ? <span className="font-bold">||</span> : <Play size={20} fill="currentColor" className="ml-1 md:w-6 md:h-6" />}
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-transparent" onClick={next}>
            <SkipForward size={20} className="md:w-6 md:h-6" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className={`hidden md:inline-flex hover:bg-transparent ${repeatMode !== 'off' ? 'text-accent' : 'text-gray-400 hover:text-white'}`}
            onClick={toggleRepeat}
          >
            {repeatMode === 'one' ? <Repeat1 size={20} /> : <Repeat size={20} />}
          </Button>
        </div>
        {/* Progress Bar */}
        <div className="w-64 md:w-full flex items-center gap-2 md:gap-3 text-[10px] md:text-xs text-gray-400 hidden md:flex">
          <span>{formatTime(progress)}</span>
          <Slider 
            value={[progress]} 
            onValueChange={handleSeek} 
            max={duration || 100} 
            step={1} 
            className="w-full cursor-pointer h-1.5"
          />
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Mobile Progress Bar */}
      <div className="absolute top-0 left-0 w-full md:hidden">
         <Slider 
            value={[progress]} 
            onValueChange={handleSeek} 
            max={duration || 100} 
            step={1} 
            className="w-full cursor-pointer h-1 rounded-none"
          />
      </div>

      {/* Volume */}
      <div className="hidden md:flex items-center justify-end w-1/4 gap-2">
        <Volume2 size={20} className="text-gray-400" />
        <Slider 
          value={[volume]} 
          onValueChange={(v) => setVolume(v[0])} 
          max={100} 
          step={1} 
          className="w-24 cursor-pointer"
        />
      </div>
    </div>
  );
};

export default PlayerBar;
