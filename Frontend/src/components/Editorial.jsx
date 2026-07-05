import { useState, useRef, useEffect } from 'react';
import { Pause, Play, Maximize } from 'lucide-react';

const TOPIC_HIGHLIGHTS = {
  'dp': [
    "Identify recursive subproblems and check for overlapping states.",
    "Define your state transitions clearly (e.g., dp[i] represents the optimal solution at index i).",
    "Consider a bottom-up iterative approach to optimize stack recursion overhead."
  ],
  'linkedlist': [
    "Handle edge cases like empty lists, single node lists, or head modifications carefully.",
    "Use dummy head pointers to simplify insertion/deletion logic.",
    "Try two-pointer techniques (like fast/slow pointers) to find the middle or detect cycles."
  ],
  'tree': [
    "Formulate recursive base cases carefully (e.g., handling null root nodes).",
    "Choose the right traversal model: Pre-order, In-order, Post-order, or Level-order BFS.",
    "Verify balance factors or key structural properties (like BST) at each recursive level."
  ],
  'graph': [
    "Check for cycles in cyclic graph inputs using color marking or visited sets.",
    "Use Breadth-First Search (BFS) for shortest path exploration in unweighted graph edges.",
    "Optimize adjacency list representations to avoid quadratic memory allocations."
  ],
  'array': [
    "Validate index ranges to prevent off-by-one errors during loop sweeps.",
    "Try sorting the array first if the order doesn't violate problem constraints.",
    "Consider two-pointer or sliding-window models to optimize runtime from O(N²) to O(N)."
  ],
  'string': [
    "Check boundaries for empty inputs or string index limits.",
    "Use hash maps or frequency arrays to store character counts efficiently.",
    "Consider sliding window protocols for substring pattern searches."
  ]
};

const Editorial = ({ secureUrl, thumbnailUrl, duration, tags }) => {

  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  // Format seconds to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if (videoRef.current.webkitRequestFullscreen) {
        videoRef.current.webkitRequestFullscreen();
      }
    }
  };

  // Update current time during playback
  useEffect(() => {
    const video = videoRef.current;

    const handleTimeUpdate = () => {
      if (video) setCurrentTime(video.currentTime);
    };

    if (video) {
      video.addEventListener('timeupdate', handleTimeUpdate);
      return () => video.removeEventListener('timeupdate', handleTimeUpdate);
    }
  }, []);

  // Extract dynamic highlights based on problem tags
  const getHighlights = () => {
    if (!tags) return {
      topic: "General",
      tips: [
        "Analyze constraints to select between O(N) linear time and O(N log N) sorting solutions.",
        "Check index ranges to prevent off-by-one errors during boundary traversals.",
        "Verify logic behavior against edge cases such as empty values or null arrays."
      ]
    };

    // Find matching tag in the list of tags
    const tagsList = Array.isArray(tags) ? tags : [tags];
    const matchedTag = tagsList.find(t =>
      TOPIC_HIGHLIGHTS[t.toLowerCase()]
    );

    if (matchedTag) {
      return {
        topic: matchedTag,
        tips: TOPIC_HIGHLIGHTS[matchedTag.toLowerCase()]
      };
    }

    return {
      topic: "General",
      tips: [
        "Analyze constraints to select between O(N) linear time and O(N log N) sorting solutions.",
        "Check index ranges to prevent off-by-one errors during boundary traversals.",
        "Verify logic behavior against edge cases such as empty values or null arrays."
      ]
    };
  };

  const highlights = getHighlights();

  if (!secureUrl) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border border-dashed border-base-300 rounded-2xl text-center gap-4 bg-base-200/20 max-w-md mx-auto my-6 select-none">
        <span className="text-3xl">🎬</span>
        <div>
          <h4 className="font-bold text-base text-base-content mb-1">No Video Editorial Available</h4>
          <p className="text-base-content/50 text-xs px-4">
            Our creators are working on video tutorials for this problem. Check back later!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 select-none">
        <span className="text-lg">🎬</span>
        <span className="text-xs font-black tracking-wider uppercase text-base-content/60">Video Solution Walkthrough</span>
      </div>

      <div
        className="relative w-full max-w-2xl mx-auto rounded-2xl overflow-hidden shadow-lg border border-base-300 bg-black"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Video Element */}
        <video
          ref={videoRef}
          src={secureUrl}
          poster={thumbnailUrl}
          onClick={togglePlayPause}
          className="w-full aspect-video bg-black cursor-pointer"
        />

        {/* Video Controls Overlay */}
        <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity flex flex-col gap-2 ${isHovering || !isPlaying ? 'opacity-100' : 'opacity-0'
            }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Play/Pause Button */}
              <button
                onClick={togglePlayPause}
                className="btn btn-circle btn-primary btn-sm text-white font-bold flex items-center justify-center"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              </button>
              <span className="text-white text-xs font-bold font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="btn btn-circle btn-ghost btn-xs text-white hover:bg-white/20 flex items-center justify-center"
              aria-label="Toggle Fullscreen"
            >
              <Maximize size={14} />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center w-full">
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={(e) => {
                if (videoRef.current) {
                  videoRef.current.currentTime = Number(e.target.value);
                }
              }}
              className="range range-primary range-xs flex-1 accent-primary"
            />
          </div>
        </div>
      </div>

      {/* Editorial Tips */}
      <div className="bg-base-200/40 border border-base-300 rounded-2xl p-4 space-y-2">
        <h4 className="text-xs font-black tracking-wider uppercase text-base-content/85 select-none">
          💡 {highlights.topic} Highlights
        </h4>
        <ul className="list-disc pl-5 text-xs text-base-content/65 space-y-1">
          {highlights.tips.map((tip, idx) => (
            <li key={idx}>{tip}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};


export default Editorial;