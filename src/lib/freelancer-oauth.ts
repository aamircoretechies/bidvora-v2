const FREELANCER_AUTHORIZE_URL =
  'https://accounts.freelancer.com/oauth/authorize';

export const isFreelancerClientId = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value.trim(),
  );

export const buildFreelancerAuthorizeUrl = ({
  clientId,
  redirectUri,
  serverAuthorizeUrl,
}: {
  clientId: string;
  redirectUri: string;
  serverAuthorizeUrl: string;
}): string => {
  const normalizedClientId = clientId.trim();

  if (!isFreelancerClientId(normalizedClientId)) {
    throw new Error(
      'Invalid Freelancer Client ID. Enter the UUID from your Freelancer Developer App, not an email address.',
    );
  }

  const state = new URL(serverAuthorizeUrl).searchParams.get('state');
  if (!state) {
    throw new Error('Freelancer authorization state is missing');
  }

  const authorizeUrl = new URL(FREELANCER_AUTHORIZE_URL);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('client_id', normalizedClientId);
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('scope', 'basic');
  authorizeUrl.searchParams.set('prompt', 'select_account consent');
  authorizeUrl.searchParams.set('state', state);

  return authorizeUrl.toString();
};
