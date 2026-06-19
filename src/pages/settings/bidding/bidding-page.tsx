import { Fragment } from 'react';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarPageTitle,
} from '@/partials/common/toolbar';
import { useSettings } from '@/providers/settings-provider';
import { Container } from '@/components/common/container';
import { BiddingContent } from '.';

export function BiddingPage() {
  const { settings } = useSettings();

  return (
    <Fragment>
      {settings?.layout === 'demo1' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
            </ToolbarHeading>
          </Toolbar>
        </Container>
      )}
      <Container>
        <BiddingContent />
      </Container>
    </Fragment>
  );
}
