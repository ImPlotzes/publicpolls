/**
 * Responds with the same HTML to requests to all /poll/xxxxx routes
 * @param {*} context Object containing request, enviroment and other bindings
 */
export async function onRequestGet(context) {
    const url = new URL(context.request.url);
    const origin = url.origin;
    const res = await fetch(origin + "/assets/html/poll");
    return new Response(res.body, {
        headers: {
            "Content-Type": "text/html"
        }
    });
}