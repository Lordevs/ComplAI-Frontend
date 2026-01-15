'use client';

import React, { useCallback, useState } from 'react';
import Image from 'next/image';
import Cropper from 'react-easy-crop';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import 'react-easy-crop/react-easy-crop.css'; // Ensure you have the CSS

interface ProfileImageUploaderProps {
  /** The current (old) profile image URL. */
  oldImage?: string;
  /** Whether the uploader dialog is open. Controlled by the parent. */
  open: boolean;
  /** Callback to update the open state (e.g. close the dialog). */
  onOpenChange: (open: boolean) => void;
  /** Callback when the cropped image is saved.
      Receives a base64 data URL of the cropped image. */
  onSave: (croppedImage: string) => void;
  /** Custom title for the dialog. */
  title?: string;
  /** Custom description for the dialog. */
  description?: string;
}

const ProfileImageUploader: React.FC<ProfileImageUploaderProps> = ({
  oldImage,
  open,
  onOpenChange,
  onSave,
  title = 'Update Profile Picture',
  description = 'Upload a new photo and crop it to update your profile picture.',
}) => {
  // State for image source (data URL), crop parameters, and zoom
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{
    width: number;
    height: number;
    x: number;
    y: number;
  } | null>(null);

  // When a file is selected, read it as a data URL
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const imageDataUrl = await readFile(file);
      setImageSrc(imageDataUrl);
    }
  };

  // Callback from Cropper when cropping is complete (returns pixel coordinates)
  interface CroppedArea {
    x: number;
    y: number;
    width: number;
    height: number;
  }

  const onCropComplete = useCallback(
    (_: CroppedArea, croppedAreaPixels: CroppedArea): void => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  // When user clicks Save, get the cropped image and pass it to onSave callback
  const handleSave = async () => {
    if (imageSrc && croppedAreaPixels) {
      try {
        const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
        onSave(croppedImage);
        onOpenChange(false);
      } catch (error) {
        console.error('Crop failed:', error);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Hidden trigger: parent controls dialog state */}
      <DialogTrigger asChild>
        <Button className="hidden">Open Uploader</Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{title}</DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            {description}
          </DialogDescription>
        </DialogHeader>

        {/* Existing image preview */}
        {oldImage && !imageSrc && (
          <div className="flex flex-col items-center mb-4">
            <p className="mb-2 text-sm text-gray-500">Current Profile Image</p>
            <Image
              src={oldImage}
              alt="Current Profile"
              width={80}
              height={80}
              className="rounded-full object-cover"
            />
          </div>
        )}

        {/* Cropper UI */}
        {imageSrc ? (
          <div className="relative w-full h-64 bg-gray-100 mb-4">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              cropShape="round"
              showGrid={false}
            />
          </div>
        ) : (
          <div className="mb-4 text-center text-sm text-gray-500">
            No image selected yet.
          </div>
        )}

        {/* File input */}
        <div className="mb-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full text-sm"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {imageSrc && (
            <Button variant="default" onClick={handleSave} className="ml-2">
              Save
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileImageUploader;

// Helper function to read a file as data URL
function readFile(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.addEventListener(
      'load',
      () => resolve(reader.result as string),
      false
    );
    reader.readAsDataURL(file);
  });
}

// Helper function to crop the image from the data URL using canvas
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Set canvas dimensions to match the cropped area
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // To create a circular image, we use another canvas with a circular clip
  const circularCanvas = document.createElement('canvas');
  const circularCtx = circularCanvas.getContext('2d');
  if (!circularCtx) throw new Error('Could not get canvas context');

  const size = Math.min(canvas.width, canvas.height);
  circularCanvas.width = size;
  circularCanvas.height = size;

  circularCtx.beginPath();
  circularCtx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  circularCtx.closePath();
  circularCtx.clip();

  // Center the cropped image
  circularCtx.drawImage(
    canvas,
    (size - canvas.width) / 2,
    (size - canvas.height) / 2
  );

  return circularCanvas.toDataURL();
}

// Helper function to create an HTMLImageElement from a URL
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.setAttribute('crossOrigin', 'anonymous');
    image.onload = () => resolve(image);
    image.onerror = (error) => reject(error);
    image.src = url;
  });
}
