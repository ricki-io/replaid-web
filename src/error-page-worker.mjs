export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const isErrorPage = ['/404', '/404/', '/404.html'].includes(url.pathname);
    let assetRequest = request;

    if (isErrorPage) {
      url.pathname = '/404';
      url.search = '';
      const headers = new Headers(request.headers);
      for (const name of ['If-None-Match', 'If-Modified-Since', 'Range', 'If-Range']) {
        headers.delete(name);
      }
      assetRequest = new Request(url, { method: request.method === 'HEAD' ? 'HEAD' : 'GET', headers });
    }

    const response = await env.ASSETS.fetch(assetRequest);
    if (!isErrorPage && response.status !== 404) return response;

    const headers = new Headers(response.headers);
    headers.set('X-Robots-Tag', 'noindex, follow');
    headers.delete('Location');
    return new Response(request.method === 'HEAD' ? null : response.body, {
      status: 404,
      headers,
    });
  },
};
