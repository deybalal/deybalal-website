"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ListMusic, X, GripVertical, Trash2 } from "lucide-react";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import Image from "next/image";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Song } from "@/types/types";

interface SortableSongItemProps {
  song: Song;
  index: number;
  isPriority: boolean;
  onRemove: (index: number) => void;
}

function SortableSongItem({
  song,
  index,
  isPriority,
  onRemove,
}: SortableSongItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: isPriority ? `priority-${index}` : `main-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800/50 group transition-colors ${
        isDragging ? "bg-zinc-800" : ""
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 text-zinc-500 hover:text-white"
      >
        <GripVertical className="w-4 h-4" />
      </div>
      <div className="relative w-10 h-10 rounded overflow-hidden shrink-0">
        <Image
          src={song.coverArt || "/images/default-album-art.png"}
          alt={song.title || "Song"}
          fill
          className={`object-cover ${!isPriority ? "opacity-60" : ""}`}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div
          className={`font-medium truncate text-sm ${
            !isPriority ? "text-zinc-400" : "text-white"
          }`}
        >
          {song.title}
        </div>
        <div className="text-xs text-zinc-500 truncate">{song.artist}</div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="opacity-0 group-hover:opacity-100 h-8 w-8 text-zinc-400 hover:text-red-400"
        onClick={() => onRemove(index)}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}

export default function QueueDrawer() {
  const {
    queue,
    priorityQueue,
    currentSong,
    currentIndex,
    removeFromQueue,
    removeFromMainQueue,
    reorderPriorityQueue,
    moveSongInQueue,
    clearPriorityQueue,
  } = usePlayerStore();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const nextFromPlaylist = queue.slice(currentIndex + 1);

  const handleDragEndPriority = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = parseInt(active.id.toString().split("-")[1]);
      const newIndex = parseInt(over.id.toString().split("-")[1]);
      reorderPriorityQueue(oldIndex, newIndex);
    }
  };

  const handleDragEndMain = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldRelativeIndex = parseInt(active.id.toString().split("-")[1]);
      const newRelativeIndex = parseInt(over.id.toString().split("-")[1]);

      const oldIndex = currentIndex + 1 + oldRelativeIndex;
      const newIndex = currentIndex + 1 + newRelativeIndex;

      moveSongInQueue(oldIndex, newIndex);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ListMusic className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        dir="rtl"
        side="left"
        className="w-10/12 sm:w-[400px] overflow-y-auto bg-background border-zinc-900 text-foreground"
      >
        <SheetHeader
          dir="ltr"
          className="mb-6 flex flex-row items-center justify-between space-y-0"
        >
          <SheetTitle className="text-right text-xl font-bold">
            صف پخش
          </SheetTitle>
          {priorityQueue.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-zinc-500 hover:text-red-400 transition-colors"
              onClick={clearPriorityQueue}
            >
              <Trash2 className="w-4 h-4 me-2" />
              پاکسازی
            </Button>
          )}
        </SheetHeader>

        <div className="space-y-8  mx-1">
          {/* Now Playing */}
          {currentSong && (
            <div>
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">
                در حال پخش
              </h3>
              <div className="flex items-center gap-4 p-3 rounded-xl bg-muted-foreground border border-white/5">
                <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 shadow-lg">
                  <Image
                    src={
                      currentSong.coverArt || "/images/default-album-art.png"
                    }
                    alt={currentSong.title || "Song"}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate text-foreground">
                    {currentSong.title}
                  </div>
                  <div className="text-sm text-foreground/80 truncate">
                    {currentSong.artist}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* User Queue (Priority) */}
          <div>
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">
              بعدی در صف{" "}
              {priorityQueue.length > 0 && `(${priorityQueue.length})`}
            </h3>
            {priorityQueue.length === 0 ? (
              <p className="text-sm text-zinc-600 italic">صف خالی است</p>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEndPriority}
              >
                <SortableContext
                  items={priorityQueue.map((_, i) => `priority-${i}`)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-1">
                    {priorityQueue.map((song, index) => (
                      <SortableSongItem
                        key={`priority-${song.id}-${index}`}
                        song={song}
                        index={index}
                        isPriority={true}
                        onRemove={removeFromQueue}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>

          {/* Original Playlist Queue */}
          {nextFromPlaylist.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">
                بعدی از: پلی لیست
              </h3>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEndMain}
              >
                <SortableContext
                  items={nextFromPlaylist.map((_, i) => `main-${i}`)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-1">
                    {nextFromPlaylist.map((song, index) => (
                      <SortableSongItem
                        key={`main-${song.id}-${index}`}
                        song={song}
                        index={index}
                        isPriority={false}
                        onRemove={(idx) =>
                          removeFromMainQueue(currentIndex + 1 + idx)
                        }
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
