let POLL = null;
const WORKER_DEV_DOMAIN = "http://localhost:8787";
//const WORKER_DEV_DOMAIN = "https://publicpolls.plotzes.workers.dev";

/**
 * Responds with the same HTML to requests to all /poll/xxxxx routes
 * @param {*} context Object containing request, enviroment and other bindings
 */
export async function onRequestGet(context) {
    // Get the origin
    const url = new URL(context.request.url);
    const origin = url.origin;

    // Get poll information for the meta tags
    const pollID = url.pathname.replace("/poll/", "");
    const apiRes = await fetch(WORKER_DEV_DOMAIN + "/api/poll?id=" + pollID, {
        headers: {
            "CF-Connecting-IP": context.request.headers.get("CF-Connecting-IP")
        }
    });

    // If the poll couldn't be fetched, return normal response
    if(apiRes.status != 200) {
        const res = await fetch(origin + "/assets/html/poll");
        return new Response(res.body, {
            headers: {
                "Content-Type": "text/html"
            }
        });
    }

    POLL = await apiRes.json();

    const res = await fetch(origin + "/assets/html/poll");

    // Rewrite the HTML to dynamically fill in the meta tags
    return new HTMLRewriter().on("meta", new ElementHandler()).transform(res);
}


/**
 * Handles incoming HTML elements for the HTMLRewriter
 */
class ElementHandler {
    /**
     * Dynamically edits the meta tags in the HTML
     * @param {*} element An incoming meta HTML tag
     */
    element(element) {
        // Include the poll object into the meta tags for the client
        if(element.getAttribute("name") == "publicpolls:poll") {
            element.setAttribute("content", JSON.stringify(POLL));
        }

        // Set the title meta tags to the poll question.
        if(element.getAttribute("name")?.includes("title")
        || element.getAttribute("property")?.includes("title")) {
            element.setAttribute("content", POLL.question);
        }

        // Set the description meta tags to the poll options
        if(element.getAttribute("name")?.includes("description")
        || element.getAttribute("property")?.includes("description")) {
            element.setAttribute("content", POLL.options.map(o => o.value).join(" | "));
        }
    }
}
