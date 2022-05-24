let poll = null;

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
    try {
        const apiRes = await fetch(origin + "/api/poll?id=" + pollID);
        poll = await apiRes.json();
    } catch (err) {
        const res = await fetch(origin + "/assets/html/poll");
        return new Response(res.body, {
            headers: {
                "Content-Type": "text/html",
                "X-Poll-Error": err.message
            }
        });
    }

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
        // Set the title meta tags to the poll question.
        if(element.getAttribute("name")?.includes("title")
        || element.getAttribute("property")?.includes("title")) {
            element.setAttribute("content", poll.question);
        }

        // Set the description meta tags to the poll options
        if(element.getAttribute("name")?.includes("description")
        || element.getAttribute("property")?.includes("description")) {
            element.setAttribute("content", poll.options.map(o => o.value).join(" | "));
        }
    }
}
