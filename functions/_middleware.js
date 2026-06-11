export async function onRequest(context) {
  const requestUrl = new URL(context.request.url);

  if (requestUrl.hostname === 'webgamearcades.pages.dev') {
    
    requestUrl.hostname = 'webgamearcades.com';
    
    return Response.redirect(requestUrl.toString(), 301);
  }

  return context.next();
}