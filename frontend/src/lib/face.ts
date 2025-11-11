// src/lib/face.ts
import * as faceapi from "face-api.js";

/**
 * Load all required face-api.js models
 * Models must be placed in /public/models/
 */
export async function loadModels() {
  const MODEL_URL = "/models";
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL), // face detection
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL), // landmarks
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL), // descriptors
  ]);
}

/**
 * Extract face descriptor from an uploaded image
 * @param file File uploaded (image)
 * @returns Float32Array | null
 */
export async function getFaceDescriptorFromImage(file: File) {
  const img = await faceapi.bufferToImage(file);
  const detection = await faceapi
    .detectSingleFace(img)
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) {
    console.warn("❌ No face detected in the uploaded image");
    return null;
  }

  return detection.descriptor;
}

/**
 * Extract face descriptor from a video frame (for webcam)
 * @param video HTMLVideoElement
 * @returns Float32Array | null
 */
export async function getFaceDescriptorFromVideo(video: HTMLVideoElement) {
  const detection = await faceapi
    .detectSingleFace(video)
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) {
    console.warn("❌ No face detected in webcam frame");
    return null;
  }

  return detection.descriptor;
}

/**
 * Compare two face descriptors
 * @param desc1 Float32Array
 * @param desc2 Float32Array
 * @param threshold number (default 0.6)
 * @returns boolean (true = same person)
 */
export function compareDescriptors(
  desc1: Float32Array,
  desc2: Float32Array,
  threshold: number = 0.6
): boolean {
  const distance = faceapi.euclideanDistance(desc1, desc2);
  return distance < threshold;
}
