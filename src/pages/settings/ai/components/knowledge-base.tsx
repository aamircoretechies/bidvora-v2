'use client';

import { useState } from 'react';
import { BrainCircuit, Loader2 } from 'lucide-react';
import { RiCheckboxCircleFill, RiCloseCircleFill } from '@remixicon/react';
import { toast } from 'sonner';
import { useAddKnowledge } from '@/hooks/use-add-knowledge';
import type { KnowledgeType } from '@/services/knowledge.service';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const KnowledgeBase = () => {
  const [type, setType] = useState<KnowledgeType>('RULE');
  const [text, setText] = useState('');
  const addKnowledge = useAddKnowledge();

  const handleAdd = async () => {
    const normalizedText = text.trim();
    if (!normalizedText || addKnowledge.isPending) return;

    try {
      const response = await addKnowledge.mutateAsync({
        type,
        text: normalizedText,
      });

      toast.custom(
        (toastId) => (
          <Alert
            variant="mono"
            icon="success"
            close={false}
            onClose={() => toast.dismiss(toastId)}
          >
            <AlertIcon><RiCheckboxCircleFill /></AlertIcon>
            <AlertTitle>
              {response.meta?.message || 'Knowledge added successfully!'}
            </AlertTitle>
          </Alert>
        ),
        { position: 'top-center' },
      );

      setText('');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to add knowledge';
      toast.custom(
        (toastId) => (
          <Alert
            variant="mono"
            icon="destructive"
            close={false}
            onClose={() => toast.dismiss(toastId)}
          >
            <AlertIcon><RiCloseCircleFill /></AlertIcon>
            <AlertTitle>{message}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' },
      );
    }
  };

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="rounded-t-xl bg-transparent px-5 py-3">
        <CardTitle className="text-base font-semibold text-foreground">
          Add New Knowledge
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-6 p-5">
        <div className="grid gap-1.5">
          <Label className="text-sm font-semibold text-foreground">
            Knowledge Type
          </Label>
          <Select
            value={type}
            onValueChange={(value) => setType(value as KnowledgeType)}
            disabled={addKnowledge.isPending}
          >
            <SelectTrigger aria-label="Knowledge type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="RULE">
                Company Fact (e.g. Tech Stack, Hours)
              </SelectItem>
              <SelectItem value="COMPLIANCE">
                Compliance Rule (e.g. Payment Terms)
              </SelectItem>
              <SelectItem value="CONVERSATION">
                Past Conversation (Good Response Example)
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-secondary-foreground">
            Categorizing helps the AI retrieve the right information at the right time.
          </p>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="knowledge-content" className="text-sm font-semibold text-foreground">
            Content
          </Label>
          <Textarea
            id="knowledge-content"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="e.g. We specialize in Node.js, React, and Python. We do not take projects under $500..."
            rows={15}
            className="resize-none text-sm"
            disabled={addKnowledge.isPending}
          />
        </div>
      </CardContent>
      <CardFooter className="border-0 p-5 pt-0">
        <Button
          variant="primary"
          className="w-full gap-2"
          size="lg"
          onClick={handleAdd}
          disabled={addKnowledge.isPending || !text.trim()}
        >
          {addKnowledge.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <BrainCircuit className="size-4" />
          )}
          Add to Brain
        </Button>
      </CardFooter>
    </Card>
  );
};

export { KnowledgeBase };
