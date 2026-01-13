'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/constants/routes';
import { format } from 'date-fns';

import { UploadedFile } from '@/types/upload';
import { CreateComplaintPayload, useResolver } from '@/hooks/useResolver';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ResolverMode } from '@/components/resolver/resolver-input-toggle';
import { ResolverNavigation } from '@/components/resolver/resolver-navigation';
import { Step1Complaint } from '@/components/resolver/steps/step-1-complaint';
import { Step2Documents } from '@/components/resolver/steps/step-2-documents';
import { Step3Prompt } from '@/components/resolver/steps/step-3-prompt';
import { Step4Preview } from '@/components/resolver/steps/step-4-preview';

export default function ResolverPage() {
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1 state
  const [mode, setMode] = useState<ResolverMode>('documents');
  const [complaintFiles, setComplaintFiles] = useState<UploadedFile[]>([]);
  const [complaintText, setComplaintText] = useState('');
  const [complaintDate, setComplaintDate] = useState<Date | undefined>(
    undefined
  );

  // Step 2 state
  const [supportingFiles, setSupportingFiles] = useState<UploadedFile[]>([]);

  // Step 3 state
  const [promptText, setPromptText] = useState('');

  const router = useRouter();
  const { createComplaint, uploadDocs, isCreating, isUploading } =
    useResolver();

  // Generate response and navigate to response page
  const handleGenerateResponse = async () => {
    try {
      // 1. Create the complaint
      const payload: CreateComplaintPayload = {
        subject: complaintDate
          ? `Complaint - ${format(complaintDate, 'dd MMM yyyy')}`
          : 'New Complaint',
        complaint_date: complaintDate
          ? format(complaintDate, 'yyyy-MM-dd')
          : format(new Date(), 'yyyy-MM-dd'),
        // Conditional description/document based on mode
        description:
          mode === 'text'
            ? complaintText?.slice(0, 200) || 'New Text Complaint'
            : 'New Document Complaint',
        context_text: mode === 'text' ? complaintText : undefined,
        document:
          mode === 'documents' && complaintFiles[0]
            ? complaintFiles[0].rawFile
            : undefined,
        document_mime_type:
          mode === 'documents' && complaintFiles[0]
            ? complaintFiles[0].rawFile.type
            : undefined,
        system_prompt:
          promptText ||
          'Analyze this complaint and provide a professional response.',
      };

      const creationResponse = await createComplaint(payload);

      // 2. Upload supporting documents if any
      if (supportingFiles.length > 0) {
        await uploadDocs({
          contextId: creationResponse.context_id,
          documents: supportingFiles.map((f) => f.rawFile),
        });
      }

      // 3. Navigate to the response page
      router.push(ROUTES.RESOLVER_ID(creationResponse.id));
    } catch (error) {
      console.error('Failed to generate response:', error);
    }
  };

  // Navigation handlers
  const goNext = () => {
    if (currentStep === 4) {
      handleGenerateResponse();
    } else if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const skip = () => {
    goNext();
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1Complaint
            mode={mode}
            onModeChange={setMode}
            files={complaintFiles}
            setFiles={setComplaintFiles}
            complaintText={complaintText}
            setComplaintText={setComplaintText}
            complaintDate={complaintDate}
            setComplaintDate={setComplaintDate}
          />
        );
      case 2:
        return (
          <Step2Documents
            files={supportingFiles}
            setFiles={setSupportingFiles}
          />
        );
      case 3:
        return (
          <Step3Prompt promptText={promptText} setPromptText={setPromptText} />
        );
      case 4:
        return (
          <Step4Preview
            mode={mode}
            complaintText={complaintText}
            complaintFiles={complaintFiles}
            supportingFiles={supportingFiles}
            promptText={promptText}
            complaintDate={complaintDate}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden font-poppins">
      {/* Center Column: Interactive Content */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col items-center w-full pt-6 pb-12 px-8">
          {/* Header */}
          <div className="text-center mb-16 w-full">
            <h1 className="text-3xl font-medium text-[#04338B] mb-4">
              AI Powered Compliant Resolve v1
            </h1>
            <p className="text-[#626262]">
              Compl-AI's AI Powered Complaint Handler.
            </p>
          </div>

          {/* Step Content */}
          {renderStepContent()}

          {/* Navigation Buttons */}
          <ResolverNavigation
            onBack={goBack}
            onSkip={skip}
            onNext={goNext}
            showBack={currentStep > 1}
            showSkip={currentStep === 2}
            isLastStep={currentStep === 4}
            isLoading={isCreating || isUploading}
          />
        </div>
      </ScrollArea>
    </div>
  );
}
