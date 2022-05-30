/**
 * Responds with the same HTML to requests to all /poll/xxxxx routes
 * @param {Object} context Object containing request, enviroment and other bindings
 * @return {Promise<Response>} The response to the request
 */
export async function onRequestGet({ request, env}) {
    // Get the origin
    const url = new URL(request.url);
    const origin = url.origin;

    const pollID = url.pathname.replace("/poll/", "");

    const promises = [];

    // Get poll information for the meta tags
    promises.push((async () => {
        const apiRes = await fetch(env.API_DOMAIN + "/api/poll?id=" + pollID, {
            headers: {
                "X-User-IP": request.headers.get("CF-Connecting-IP")
            }
        });
        
        // Throw an error to reject this promise if the API call failed
        if(apiRes.status != 200) {
            throw Error(apiRes.status);
        }

        // Return the JSON response
        return apiRes.json();
    })());

    // Get the HTML for the page
    promises.push(fetch(origin + "/assets/html/poll"));

    // Wait for all the promises to resolve
    const [pollPromise, html] = await Promise.allSettled(promises);

    // If the HTML fetch failed then redirect them to the error page
    if(html.status != "fulfilled") {
        return Response.redirect(origin + "/error", 307);
    }

    // If the API call failed, return the HTML page with the error message
    if(pollPromise.status != "fulfilled") {
        return new HTMLRewriter()
        .on("#error", {
            element(element) {
                let htmlError = "";
                // Show not found error if the poll wasn't found
                if(pollPromise.reason.message == 404) {
                    htmlError = "<p>This poll does not exist.</p>";
                } else {
                    const error = btoa(pollID + "-" + pollPromise.reason.message);
                    htmlError = "<p>An error occured while fetching the poll details.</p>" +
                        "<p>Error: <code>" + error + "</code></p>";
                }
                element.setInnerContent(htmlError, {html: true});
            }
        })
        .on("#content-container", {
            element(element) {
                element.remove();
            }
        })
        .transform(html.value)
    }
    // The API call was successful, so we return the rewritten HTML

    const poll = pollPromise.value;
    const res = html.value;

    // Create the description
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
        const dateObj = new Date(poll.created_at);
        date += `${months[dateObj.getMonth()]} ${dateObj.getDate()}, ${dateObj.getFullYear()}`;
    }
    const description = "Asked by " + poll.name + " | " + date;


    // Rewrite the HTML to show the poll
    return new HTMLRewriter()
    .on("meta", {           // Rewrite the meta tags
        element(element) {
            // Set the title meta tags to the poll question.
            if(element.getAttribute("name")?.includes("title")
            || element.getAttribute("property")?.includes("title")) {
                element.setAttribute("content", poll.question);
            }
    
            // Set the description meta tags to the poll options
            if(element.getAttribute("name")?.includes("description")
            || element.getAttribute("property")?.includes("description")) {
                element.setAttribute("content", description);
            }
        }
    })
    .on("#error", {         // Hide the error message
        element(element) {
            element.remove();
        }
    })
    .on("#question", {      // Rewrite the question
        element(element) {
            element.setInnerContent(poll.question);
        }
    })
    .on("#asker", {         // Rewrite the asker
        element(element) {
            element.setInnerContent("— " + poll.name);
        }
    })
    .on("#options", {       // Add the options
        async element(element) {
            let html = "";
            // Determine if the user has voted
            // If so, then show the results
            if(poll.voted) {
                let totalVotes = poll.options.reduce((acc, cur) => acc + cur.votes, 0);
                totalVotes = totalVotes == 0 ? 1 : totalVotes;
                for(let i = 0; i < poll.options.length; i++) {
                    const option = poll.options[i];
                    const percent = Math.round(option.votes / totalVotes * 100);
                    html += `
                    <label for="option-${i}">
                        <div class="bar" data-width="${percent}"></div>
                        <input type="radio" name="option" id="option-${i}" value="${i}" disabled ${poll.chosen_option==i?"checked":""}>
                        <span>${await escapedHTML(option.value)}<em>${option.votes} vote${option.votes==1?"":"s"} — ${percent}%</em></span>
                    </label>`;
                }
            } else {
                for(let i = 0; i < poll.options.length; i++) {
                    const option = poll.options[i];
                    html += `
                    <label for="option-${i}">
                        <div class="bar"></div>
                        <input type="radio" name="option" id="option-${i}" value="${i}">
                        <span>${await escapedHTML(option.value)}</span>
                    </label>`;
                }
            }
            element.setInnerContent(html, {html: true});
        }
    })
    .on("#vote-button", {   // Disable the vote button if the user has voted
        element(element) {
            if(poll.voted) {
                element.setAttribute("disabled", "true");
            }
        }
    })
    .on("#modal-button", {  // Disable the show-results button if the user has voted
        element(element) {
            if(poll.voted) {
                element.setAttribute("disabled", "true");
            }
        }
    })
    .transform(res);
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
