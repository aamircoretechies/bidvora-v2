'use client';

import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BrainCircuit, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { RiCheckboxCircleFill, RiCloseCircleFill } from '@remixicon/react';
import { knowledgeService } from '@/services/knowledge.service';

const KnowledgeBase = () => {
  const [type, setType] = useState('RULE');
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAdd = async () => {
    if (!text.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await knowledgeService.addKnowledge({ type, text });

      toast.custom(
        (t) => (
          <Alert variant="mono" icon="success" close={false} onClose={() => toast.dismiss(t)}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>{response.meta?.message || 'Knowledge added successfully!'}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );

      setText(''); // clear content on success
    } catch (err: any) {
      const message = err.message || 'Failed to add knowledge';
      toast.custom(
        (t) => (
          <Alert variant="mono" icon="destructive" close={false} onClose={() => toast.dismiss(t)}>
            <AlertIcon>
              <RiCloseCircleFill />
            </AlertIcon>
            <AlertTitle>{message}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="bg-transparent rounded-t-xl px-5 py-3">
        <CardTitle className="text-foreground text-base font-semibold">Add New Knowledge</CardTitle>
      </CardHeader>
      <CardContent className="p-5 flex flex-col gap-6 flex-1">
        <div className="grid gap-1.5">
          <Label className="text-sm font-semibold text-foreground">Knowledge Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="RULE">🏢 Company Fact (e.g. Tech Stack, Hours)</SelectItem>
              <SelectItem value="COMPLIANCE">⚖️ Compliance Rule (e.g. Payment Terms)</SelectItem>
              <SelectItem value="CONVERSATION">💬 Past Conversation (Good Response Example)</SelectItem>
            </SelectContent>
          </Select>
          <div>
            <p className="text-xs text-secondary-foreground">
              Categorizing helps the AI retrieve the right info at the right time.
            </p>
          </div>
        </div>
        <div className="grid gap-1.5">

          <Label className="text-sm font-semibold text-foreground">Content</Label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. We specialize in Node.js, React, and Python. We do not take projects under $500..."
            rows={15}
            className="text-sm resize-none"
          />
        </div>
      </CardContent>
      <CardFooter className="p-5 pt-0 border-0">
        <Button
          variant="primary"
          className="w-full gap-2"
          size="lg"
          onClick={handleAdd}
          disabled={isLoading || !text.trim()}
        >
          {isLoading ? <Loader2 className="size-4 animate-spin" /> : <BrainCircuit className="size-4" />}
          Add to Brain
        </Button>
      </CardFooter>
    </Card>
  );
};

export { KnowledgeBase };
