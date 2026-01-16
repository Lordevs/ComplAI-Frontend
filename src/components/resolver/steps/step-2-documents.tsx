'use client';

import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from '@/constants/upload';
import { FileText } from 'lucide-react';

import { UploadedFile } from '@/types/upload';
import { Card } from '@/components/ui/card';
import { FileUpload } from '@/components/common/file-upload';
import UploadedFiles from '@/components/common/uploaded-files';

interface Step2DocumentsProps {
  files: UploadedFile[];
  setFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
}

/**
 * Step 2: Upload Your Supporting Complaint Documents
 * User can upload supporting documents for their complaint.
 */
export function Step2Documents({ files, setFiles }: Step2DocumentsProps) {
  const handleUpload = (newFiles: File[]) => {
    const formattedFiles: UploadedFile[] = newFiles.map((file) => {
      const uploadedFile = file as unknown as UploadedFile;
      uploadedFile.id = Math.random().toString(36).substring(7);
      uploadedFile.rawFile = file;
      uploadedFile.progress = 100;
      return uploadedFile;
    });
    setFiles((prev) => [...prev, ...formattedFiles]);
  };

  return (
    <>
      {/* Step Header */}
      <div className="self-start">
        <div className="flex items-start gap-4 mb-6">
          <Card className="w-14 h-14 bg-primary border-none rounded-full flex items-center justify-center shrink-0">
            <FileText className="text-white h-6 w-6" />
          </Card>
          <div>
            <h3 className="text-xl font-medium text-[#04338B]">
              Attach related documents.
            </h3>
            <p className="text-[#04338B] font-normal">
              Attach documents related to the complaint.
            </p>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div className="overflow-hidden flex flex-col w-full">
        <Card className="border-0 bg-white flex flex-col items-center justify-center py-6 relative rounded-[22px] shadow-[0px_0px_24px_0px_rgba(0,0,0,0.02)] flex-1 min-h-[150px]">
          <div className="w-full flex-1 flex flex-col">
            {files.length > 0 ? (
              <div className="flex-1">
                <UploadedFiles
                  uploadedFiles={files}
                  setUploadedFiles={setFiles}
                  onUpload={handleUpload}
                  containerClassName="bg-[#F8F9FF] px-12 py-7"
                  className="text-[#04338B] text-xl font-medium"
                  filesContainerClassName="h-full"
                  maxSize={MAX_FILE_SIZE}
                  allowedTypes={ALLOWED_FILE_TYPES}
                />
              </div>
            ) : (
              <FileUpload
                onUpload={handleUpload}
                maxSize={MAX_FILE_SIZE}
                allowedTypes={ALLOWED_FILE_TYPES}
                title="Drag and drop here"
                subtitle="File type must be (TXT, PDF and Word Doc)"
                className="border-0 bg-[#F8F9FF] rounded-xl"
                titleClassName="text-[#1D1E4A] text-xl font-medium"
                subtitleClassName="text-[#73726D] text-sm font-light"
              />
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
