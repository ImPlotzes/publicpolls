export async function onRequestGet({ request, env}) {
    // Get all the polls
    const apiRes = await fetch(env.API_DOMAIN + "/api/list");
    if(apiRes.status != 200) {
        return new Response(null, { status: apiRes.status });
    }

    // Parse the JSON response
    const list = await apiRes.json();

    // Get the origin
    const origin = new URL(request.url).origin;

    // Create the sitemap beginning with root, /about and /create paths
    let sitemap = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
    + "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">"
    + "<url><loc>" + origin + "</loc><priority>1.0</priority></url>"
    + "<url><loc>" + origin + "/about</loc><priority>0.8</priority></url>"
    + "<url><loc>" + origin + "/create</loc><priority>0.8</priority></url>"

    // Add a URL for each poll
    for(const poll of list) {
        sitemap += "<url>"
        + "<loc>" + origin + "/poll/" + poll.id + "</loc>"
        + "<lastmod>" + new Date(parseInt(poll.created_at)).toISOString() + "</lastmod>"
        + "<priority>0.5</priority>"
        + "</url>";
    }
    sitemap += "</urlset>";

    // Return the sitemap
    return new Response(sitemap, {
        headers: {
            "Content-Type": "application/xml"
        }
    });
}