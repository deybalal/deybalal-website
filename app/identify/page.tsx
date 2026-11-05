"use client";
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";

const IdentifyPage = () => {
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const mediaRecorderRef = useRef<null | MediaRecorder>(null);

  const recordAudio = async () => {
    try {
      // Request permission to capture audio
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create a MediaRecorder instance with the stream
      mediaRecorderRef.current = new MediaRecorder(stream);

      // Listen for data available event
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks((prev) => [...prev, event.data]);
        }
      };

      // Start recording
      mediaRecorderRef.current.start();
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = async () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();

      // Convert Blob to WAV format for compatibility with your API
      const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
      const audioArrayBuffer = await audioBlob.arrayBuffer();

      // Send the audio data to your API endpoint
      const response = await fetch("http://example.com/api/record", {
        method: "POST",
        headers: {
          "Content-Type": "audio/wav",
        },
        body: audioArrayBuffer,
      });

      if (response.ok) {
        console.log("Audio recorded and sent successfully");
      } else {
        console.error("Failed to send audio:", response.statusText);
      }
    }
  };

  return (
    <div className="container mx-auto ps-4 pe-4 py-8 space-y-8 h-max">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Record</h1>
        <p className="text-muted-foreground text-lg">Record Audio</p>
      </div>
      <div className="text-center">
        <Button onClick={recordAudio}>Record</Button>
        <Button onClick={stopRecording} style={{ marginLeft: "1rem" }}>
          Stop Recording
        </Button>
      </div>
    </div>
  );
};

export default IdentifyPage;
