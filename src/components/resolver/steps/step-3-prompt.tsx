'use client';

import { PenLine } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

interface Step3PromptProps {
  promptText: string;
  setPromptText: (text: string) => void;
}

/**
 * Step 3: Write Your Prompt
 * User enters their prompt to guide the AI response generation.
 */
export function Step3Prompt({ promptText, setPromptText }: Step3PromptProps) {
  return (
    <>
      {/* Step Header */}
      <div className="self-start">
        <div className="flex items-start gap-4 mb-6">
          <Card className="w-14 h-14 bg-primary border-none rounded-full flex items-center justify-center shrink-0">
            <PenLine className="text-white h-6 w-6" />
          </Card>
          <div>
            <h3 className="text-xl font-medium text-[#04338B]">
              Write Your Prompt
            </h3>
            <p className="text-[#04338B] font-normal">
              Please select the input type for Complaint Form.
            </p>
          </div>
        </div>
      </div>

      {/* Prompt Textarea */}
      <div className="overflow-hidden flex flex-col w-full">
        <Card className="border-0 flex-1 min-h-[300px] shadow-none">
          <Textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="Apologize and explain our data policy clearly. Mention steps we're taking to fix the website content"
            className="w-full h-full min-h-[357px] text-lg leading-relaxed border-[#BDBDBD] rounded-lg focus-visible:ring-0 p-5 placeholder:text-gray-400 text-[#39393A] resize-none bg-transparent font-light"
          />
        </Card>
      </div>
    </>
  );
}
