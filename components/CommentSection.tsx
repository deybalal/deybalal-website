"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";
import { toast } from "react-hot-toast";
import { Loader2, MessageSquare, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  isActive: boolean;
  user: {
    id: string;
    name: string;
    image: string | null;
    userSlug: string;
  };
}

interface CommentSectionProps {
  songId?: string;
  albumId?: string;
  isUserLoggedIn: boolean;
  userSlug?: string;
}

export function CommentSection({
  songId,
  albumId,
  isUserLoggedIn,
  userSlug,
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchComments() {
      try {
        const query = songId ? `songId=${songId}` : `albumId=${albumId}`;
        const res = await fetch(`/api/comments?${query}`);
        const data = await res.json();
        if (data.success) {
          setComments(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch comments", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchComments();
  }, [songId, albumId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, songId, albumId }),
      });
      const data = await res.json();
      if (data.success) {
        setComments([data.data, ...comments]);
        setContent("");
        toast.success("Comment posted");
      } else {
        toast.error(data.message || "Failed to post comment");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/comments?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setComments(comments.filter((c) => c.id !== id));
        toast.success("Comment deleted");
      } else {
        toast.error(data.message || "Failed to delete comment");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  return (
    <div className="space-y-8 mb-8">
      <div className="flex items-center gap-2 text-xl font-bold">
        <MessageSquare className="w-6 h-6 text-blue-500" />
        Comments ({comments.length})
      </div>

      {!isUserLoggedIn ? (
        <div>
          <p className="text-center text-muted-foreground">
            Please{" "}
            <Link
              className="text-xl mx-2 hover:scale-125 hover:font-bold transition-all underline underline-offset-8"
              href="/login"
            >
              Sign In
            </Link>{" "}
            to leave a comment.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="Leave a comment..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px] bg-foreground/5 border-white/10 focus:border-blue-500/50 transition-all resize-none"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="rounded-full px-8 font-semibold"
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Post Comment
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="flex gap-4 group animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden shrink-0 border border-white/10">
                {comment.user.image ? (
                  <Image
                    src={comment.user.image}
                    alt={comment.user.name}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold bg-linear-to-br from-gray-800 to-gray-900">
                    {comment.user.name[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/u/${comment.user.userSlug}`}
                      className="font-semibold text-foreground hover:text-blue-400 transition-colors cursor-pointer"
                    >
                      {comment.user.name}
                    </Link>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                    {!comment.isActive && (
                      <span className="px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-medium border border-amber-500/20 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                        Pending
                      </span>
                    )}
                  </div>
                  {userSlug === comment.user.userSlug && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="cursor-pointer transition-opacity text-red-500 hover:text-red-400 hover:bg-red-500/10 h-8 w-8"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Delete Comment</DialogTitle>
                          <DialogDescription>
                            This cannot be undone!
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4">
                          Are you sure you want to delete this comment?
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                          </DialogClose>
                          <Button
                            onClick={() => handleDelete(comment.id)}
                            className="bg-red-600 hover:bg-red-400 hover:text-foreground cursor-pointer"
                          >
                            Delete
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
                <p className="text-foreground/70 whitespace-pre-wrap leading-relaxed">
                  {comment.content}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-gray-500 bg-foreground/5 rounded-2xl border border-dashed border-white/10">
            No comments yet. Be the first to share your thoughts!
          </div>
        )}
      </div>
    </div>
  );
}
