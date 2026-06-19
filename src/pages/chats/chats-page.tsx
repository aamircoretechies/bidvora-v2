import { Fragment } from 'react';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@/partials/common/toolbar';
import { useSettings } from '@/providers/settings-provider';
import { Container } from '@/components/common/container';
import { ChatsContent } from '.';

export function ChatsPage() {
  const { settings } = useSettings();

  return (
    <Fragment>
      {settings?.layout === 'demo1' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle title="Active Conversations" />
            </ToolbarHeading>
          </Toolbar>
        </Container>
      )}
      <Container>
        <ChatsContent />
      </Container>
    </Fragment>
  );
}
