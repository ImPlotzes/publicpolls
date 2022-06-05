/**
 * Responds with the home page
 * @param {Object} context Object containing request, enviroment and other bindings
 * @return {Promise<Response>} The response to the request
 */
export async function onRequestGet(context) {
    const promises = [];

    // Get the poll list from the API
    promises.push((async () => {
        const apiRes = await fetch(context.env.API_DOMAIN + "/api/list");
        
        // Throw an error to reject this promise if the API call failed
        if(apiRes.status != 200) {
            throw Error(apiRes.status);
        }

        // Return the JSON response
        return apiRes.json();
    })());

    // Get the HTML for the page
    promises.push(context.next());

    // Wait for all the promises to resolve
    const [listPromise, html] = await Promise.allSettled(promises);

    // If the HTML fetch somehow failed then redirect them to the error page
    if(html.status != "fulfilled") {
        return Response.redirect(origin + "/error", 307);
    }

    // If the API call failed, return the HTML page with the error message
    if(listPromise.status != "fulfilled") {
        return new HTMLRewriter()
        .on("#polls", {
            element(element) {
                const error = btoa("ROOT-" + listPromise.reason.message);
                element.setInnerContent(`<h1>An error occured while fetching the polls.<br>
                Error: <code>${error}</code></h1>`, {html: true});
            }
        })
        .transform(html.value);
    }

    // Sort the polls by their creation date
    const list = listPromise.value.sort((a, b) => {
        return b.created_at - a.created_at;
     });

    // Return the HTML page with the poll list
    return new HTMLRewriter()
    .on("#polls", {
        async element(element) {
            let listHTML = "";
            for(const poll of list) {
                let date = "Posted ";
                const diff = Date.now() - poll.created_at;
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
                    const dateObj = new Date(parseInt(poll.created_at));
                    date += `on ${months[dateObj.getMonth()]} ${dateObj.getDate()}, ${dateObj.getFullYear()}`;
                }
                listHTML += `<div class="poll-card" onclick="window.location.href='/poll/${poll.id}'">
                <h3>${await escapedHTML(poll.question)}</h3>
                <ul>
                    <li>Asked by ${await escapedHTML(poll.name)}</li>
                    <li>${poll.total_votes} vote${poll.total_votes==1?"":"s"} so far</li>
                    <li>${date}</li>
                </ul>
                </div>`;
            }
            element.setInnerContent(listHTML, {html: true});
        }
    })
    .transform(html.value);
}


/**
 * Escapes HTML characters in a string
 * @param {string} text String to escape
 */
 async function escapedHTML(text) {
    // Define the HTMLRewriter that will be used to escape the HTML
    const rewriter = new HTMLRewriter().onDocument({
        end(end) {
            end.append(text);
        }
    });

    // Rewrite a single space (rewriter doesn't like fully empty responses)
    const response = rewriter.transform(new Response(" "));

    // Return the response (with that extra space removed)
    return (await response.text()).substring(1);
}
