import { useState, useMemo } from 'react';
import { Globe } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { RiCheckboxCircleFill } from '@remixicon/react';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';

interface QuestionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionsRaw?: string;
  projectId?: number | string;
}

export function QuestionsModal({ open, onOpenChange, questionsRaw, projectId }: QuestionsModalProps) {
  const { copyToClipboard } = useCopyToClipboard();

  const questions = useMemo(() => {
    if (!questionsRaw) return [];
    try {
      const parsed = JSON.parse(questionsRaw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (e) {
      // ignore
    }
    // fallback to splitting by newline if not json array
    return questionsRaw.split('\n').filter((q) => q.trim().length > 0);
  }, [questionsRaw]);

  const handleCopy = (text: string) => {
    copyToClipboard(text);
    toast.custom(
      (t) => (
        <Alert variant="mono" icon="success" close={false} onClose={() => toast.dismiss(t)}>
          <AlertIcon>
            <RiCheckboxCircleFill />
          </AlertIcon>
          <AlertTitle>Question copied to clipboard!</AlertTitle>
        </Alert>
      ),
      { position: 'top-center' }
    );
  };

  const handleOpenProject = () => {
    if (projectId) {
      window.open(`https://www.freelancer.com/projects/${projectId}`, '_blank');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="px-6 py-4 border-b m-0 flex flex-row items-center justify-between">
          <DialogTitle className="text-xl">Clarification Questions</DialogTitle>
        </DialogHeader>

        <DialogBody className="px-6 py-5">
          <p className="text-sm text-secondary-foreground mb-6">
            Copy these questions and paste them on the Freelancer project board to engage the client.
          </p>

          <div className="flex flex-col">
            {questions.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No questions available.</p>
            ) : (
              questions.map((q, index) => (
                <div
                  key={index}
                  className={`flex flex-row items-start justify-between gap-6 py-4 ${
                    index !== questions.length - 1 ? 'border-b border-border' : ''
                  }`}
                >
                  <p className="text-sm leading-relaxed text-foreground">{q}</p>
                  <Button variant="outline" size="sm" onClick={() => handleCopy(q)} className="shrink-0">
                    Copy
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogBody>

        <DialogFooter className="px-6 py-4 border-t bg-muted/30 sm:justify-between items-center flex-row">
          <DialogClose asChild>
            <Button variant="outline" className="w-auto">
              Close
            </Button>
          </DialogClose>
          <Button variant="primary" onClick={handleOpenProject} className="gap-2 w-auto">
            <Globe className="size-4" />
            Open Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
