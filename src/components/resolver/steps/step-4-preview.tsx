'use client';

import { format } from 'date-fns';
import { FileText, Folder, PenLine } from 'lucide-react';

import { FileCard } from '@/components/common/file-card';
import { ResolverMode } from '@/components/resolver/resolver-input-toggle';
import { UploadedFile } from '@/types/upload';

import { PreviewSection } from '../preview-section';

interface Step4PreviewProps {
  mode: ResolverMode;
  complaintText: string;
  complaintFiles: UploadedFile[];
  supportingFiles: UploadedFile[];
  promptText: string;
  complaintDate: Date | undefined;
}

/**
 * Step 4: Preview Your Complaint
 * Shows a summary of all entered data before generating the response.
 */
export function Step4Preview({
  mode,
  complaintText,
  complaintFiles,
  supportingFiles,
  promptText,
  complaintDate,
}: Step4PreviewProps) {
  // Format the title with date if available
  const complaintTitle = complaintDate
    ? `Your Complaint (${format(complaintDate, 'dd-MM-yyyy')})`
    : 'Your Complaint';

  return (
    <div className="space-y-4 w-full">
      {/* Your Complaint Section */}
      <PreviewSection
        title={complaintTitle}
        icon={<Folder className="text-white h-6 w-6" />}
      >
        {mode === 'text' ? (
          <div className="bg-[#F8F9FF] rounded-xl p-5">
            <p className="text-primary text-base leading-relaxed italic">
              {complaintText || 'No complaint text provided.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {complaintFiles.length > 0 ? (
              complaintFiles.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  showExtraInfo={false}
                  className="w-fit"
                  hasRemoveButton={false}
                />
              ))
            ) : (
              <p className="text-gray-400 italic">
                No complaint files uploaded.
              </p>
            )}
          </div>
        )}
      </PreviewSection>

      {/* Support Document Section */}
      <PreviewSection
        title="Support Document"
        icon={<FileText className="text-white h-5 w-5" />}
      >
        <div className="space-y-2">
          {supportingFiles.length > 0 ? (
            supportingFiles.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                showExtraInfo={false}
                className="w-fit"
                hasRemoveButton={false}
              />
            ))
          ) : (
            <p className="text-gray-400 italic">
              No supporting documents uploaded.
            </p>
          )}
        </div>
      </PreviewSection>

      {/* Prompt Section */}
      <PreviewSection
        title="Prompt"
        icon={<PenLine className="text-white h-5 w-5" />}
      >
        <div className="bg-[#F8F9FF] rounded-xl p-5">
          <p className="text-primary text-base leading-relaxed">
            {promptText || 'No prompt provided.'}
          </p>
        </div>
      </PreviewSection>
    </div>
  );
}
