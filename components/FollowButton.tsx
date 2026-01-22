"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

interface FollowButtonProps {
  artistId: string;
}

export function FollowButton({ artistId }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    async function checkFollowStatus() {
      try {
        const res = await fetch(`/api/artists/${artistId}/follow`);
        const data = await res.json();
        if (data.success) {
          setIsFollowing(data.isFollowing);
        }
      } catch (error) {
        console.error("Failed to check follow status", error);
      } finally {
        setIsLoading(false);
      }
    }

    checkFollowStatus();
  }, [artistId]);

  const toggleFollow = async () => {
    setIsToggling(true);
    try {
      const res = await fetch(`/api/artists/${artistId}/follow`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setIsFollowing(data.isFollowing);
        toast.success(
          data.isFollowing ? "Followed artist" : "Unfollowed artist"
        );
      } else {
        toast.error(data.message || "Failed to toggle follow");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsToggling(false);
    }
  };

  if (isLoading) {
    return (
      <Button
        variant="outline"
        disabled
        size="sm"
        className="rounded-full px-6"
      >
        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
        Loading
      </Button>
    );
  }

  return (
    <Button
      variant={isFollowing ? "secondary" : "default"}
      size="sm"
      onClick={toggleFollow}
      disabled={isToggling}
      className="rounded-full px-6 font-semibold transition-all hover:scale-105 active:scale-95"
    >
      {isToggling ? (
        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
      ) : isFollowing ? (
        <UserCheck className="ml-2 h-4 w-4" />
      ) : (
        <UserPlus className="ml-2 h-4 w-4" />
      )}
      {isFollowing ? "Following" : "Follow"}
    </Button>
  );
}
