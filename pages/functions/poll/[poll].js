let POLL = null;
let DESCRIPTION = null;
const WORKER_DEV_DOMAIN = "https://publicpolls.plotzes.workers.dev";

/**
 * Responds with the same HTML to requests to all /poll/xxxxx routes
 * @param {*} context Object containing request, enviroment and other bindings
 */
export async function onRequestGet(context) {
    // Get the origin
    const url = new URL(context.request.url);
    const origin = url.origin;

    const pollID = url.pathname.replace("/poll/", "");

    const promises = [];

    // Get poll information for the meta tags
    promises.push((async () => {
        const apiRes = await fetch(WORKER_DEV_DOMAIN + "/api/poll?id=" + pollID, {
            headers: {
                "X-User-IP": context.request.headers.get("CF-Connecting-IP")
            }
        });
        
        // Throw an error to reject this promise if the API call failed
        if(apiRes.status != 200) {
            throw new Error("API call failed");
        }

        // Return the JSON response
        return apiRes.json();
    })());

    // Get the HTML for the page
    promises.push(fetch(origin + "/assets/html/poll"));

    // Wait for all the promises to resolve
    const [poll, html] = await Promise.allSettled(promises);

    // If the API call failed, return the normal HTML page
    if(poll.status != "fulfilled") {
        return new Response(html.value.body, {
            headers: {
                "Content-Type": "text/html"
            }
        });
    }
    // The API call was successful, so we return the rewritten HTML

    POLL = poll.value;
    const res = html.value;

    // Create the description
    let date = "Posted ";
    const diff = Date.now() - POLL.created_at;

    // Show relative hours and minutes if the poll was posted less than 24h ago
    if(diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        if(hours > 0) {
            date += `${hours} hour${hours == 1 ? "" : "s"} and `;
        }
        const minutes = Math.floor((diff % 3600000) / 60000);
        date += `${minutes} minute${minutes == 1 ? "" : "s"} ago`;

    // Show relative days and hours if the poll was posted less than a week ago
    } else if(diff < 604800000) {
        const days = Math.floor(diff / 86400000);
        date += `${days} day${days == 1 ? "" : "s"}`;
        const hours = Math.floor((diff % 86400000) / 3600000);
        date += ` and ${hours} hour${hours == 1 ? "" : "s"} ago`;

    // Show absolute date if the poll was posted more than a week ago
    } else {
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const dateObj = new Date(POLL.created_at);
        date += `${months[dateObj.getMonth()]} ${dateObj.getDate()}, ${dateObj.getFullYear()}`;
    }
    DESCRIPTION = "Asked by " + POLL.name + " | " + date;

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
            element.setAttribute("content", DESCRIPTION);
        }
    }
}
