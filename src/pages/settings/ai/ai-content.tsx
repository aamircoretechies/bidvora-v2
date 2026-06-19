import { Container } from '@/components/common/container';
import { AiConfiguration, KnowledgeBase } from './components';

export function AiContent() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 lg:gap-5">
      <AiConfiguration />
      <KnowledgeBase />
    </div>
  );
}
