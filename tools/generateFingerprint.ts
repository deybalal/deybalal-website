import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
// ffmpeg -i input_audio.mp3 -f wav output.wav
export async function generateFingerprint(filePath: string) {
  const { stdout } = await execFileAsync("fpcalc", ["-raw", filePath]);

  const fingerprintMatch = stdout.match(/FINGERPRINT=(.+)/);
  const durationMatch = stdout.match(/DURATION=(\d+)/);

  if (!fingerprintMatch || !durationMatch) {
    throw new Error("Failed to generate fingerprint");
  }

  return {
    fingerprint: fingerprintMatch[1],
    duration: Number(durationMatch[1]),
  };
}

/*
// pages/api/upload-audio.js
import ffmpeg from 'ffmpeg'; // Assuming you have installed ffmpeg via npm install ffmpeg
import fpcalc from 'fpcalc'; // You might need to use a library or call the executable directly

export const config = {
  api: {
    bodyParser: false,
  },
};

const handler = async (req, res) => {
  if (req.method === 'POST') {
    try {
      // Assuming req.body contains raw audio data
      const rawAudioData = req.body;

      // Convert the raw audio to a supported format like WAV using ffmpeg
      let outputFilePath = '/tmp/output.wav'; // Temporary file path, adjust according to your storage
      await new Promise((resolve, reject) => {
        ffmpeg(rawAudioData).toFormat('wav').save(outputFilePath);
        ffmpeg.on('end', resolve);
        ffmpeg.on('error', reject);
      });

      // Extract fingerprint from the converted WAV file using fpcalc
      const fingerprint = await new Promise((resolve, reject) => {
        fpcalc('-length 100 -raw -fp-storable ' + outputFilePath, (err, data) => {
          if (err) return reject(err);
          resolve(data);
        });
      });

      // Store the fingerprint and other metadata in your DB
      await storeFingerprintInDB({ fingerprint, rawAudioData: req.body // or any other relevant data 
    });

      res.status(200).json({ fingerprint });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while processing the audio file.' });
    }
  } else {
    res.status(405).end(); // Method Not Allowed
  }
};

export default handler;



















function matchFingerprint(query, dbFp) {
  const q = query.split(',').map(Number);
  const d = dbFp.split(',').map(Number);

  const qLen = q.length;
  let bestScore = 0;

  for (let i = 0; i <= d.length - qLen; i++) {
    let score = 0;

    for (let j = 0; j < qLen; j++) {
      if (Math.abs(q[j] - d[i + j]) < 5) score++; // tolerance
    }

    bestScore = Math.max(bestScore, score);
  }

  return bestScore / qLen; // similarity 0–1
}



if (matchFingerprint(inputFp, storedFp) > 0.7) {
  // match
}




ffmpeg -i input.mp3 -ac 1 -ar 11025 -t 20 output.wav
ffmpeg -i input.wav -af silenceremove=1:0:-50dB output_trimmed.wav

*/
