const publicWebsiteUrl = (
  import.meta.env.VITE_PUBLIC_WEBSITE_URL || 'https://bidvoraai.vercel.app'
).replace(/\/+$/, '');

const generalSettings = {
  website: `${publicWebsiteUrl}/`,
  purchase: `${publicWebsiteUrl}/#pricing`,
  pp: `${publicWebsiteUrl}/privacy-policy`,
  terms: `${publicWebsiteUrl}/terms`,
  support: `${publicWebsiteUrl}/contact`,
  faq: `${publicWebsiteUrl}/#faq`,
  about: `${publicWebsiteUrl}/`,
};

export { generalSettings };
