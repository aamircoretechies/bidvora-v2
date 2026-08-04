const FREELANCER_ACCOUNTS_ORIGIN = 'https://accounts.freelancer.com';

export const DEFAULT_FREELANCER_REDIRECT_URI =
  'https://bidvora.coretechiestest.org/callback';

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

  const authorizeUrl = new URL(serverAuthorizeUrl);

  if (authorizeUrl.origin !== FREELANCER_ACCOUNTS_ORIGIN) {
    throw new Error('Invalid Freelancer authorization URL');
  }

  const state = authorizeUrl.searchParams.get('state');
  if (!state) {
    throw new Error('Freelancer authorization state is missing');
  }

  // Keep the backend-generated URL intact so state, advanced scopes, and any
  // future OAuth security parameters are not lost. Force a fresh login rather
  // than Freelancer's remembered-account picker, whose "different account"
  // action can be disabled when only one session is cached.
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('client_id', normalizedClientId);
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  if (!authorizeUrl.searchParams.has('scope')) {
    authorizeUrl.searchParams.set('scope', 'basic');
  }
  authorizeUrl.searchParams.set('prompt', 'login consent');

  return authorizeUrl.toString();
};
