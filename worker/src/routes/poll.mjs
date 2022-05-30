/**
 * Handles all requests to the /api/poll endpoint
 * @param {Request} request The incoming HTTP request
 * @param {*} env Object to access the environment variables and bindings
 * @param {*} ctx Object to access the context functions
 * @returns {Promise<Response>} The response to send back to the client
 */
export default async function handlePoll(request, env, ctx) {
    // Check if the request method is allowed
    if(request.method != "GET") {
        return new Response(JSON.stringify({
            error: "Method not allowed",
            code: 405
        }), {
            status: 405
        });
    }

    // Get the poll ID
    const url = new URL(request.url);
    const pollID = url.searchParams.get("id");

    // Check if the poll ID is valid
    if(!pollID || pollID.length == 0) {
        return new Response(JSON.stringify({
            error: "Invalid poll ID",
            code: 400
        }), {
            status: 400
        });
    }

    // Get the R2 object
    const r2Object = await env.R2_BUCKET.get(pollID);

    // Check if the R2 exists
    if(!r2Object) {
        return new Response(JSON.stringify({
            error: "Poll not found",
            code: 404
        }), {
            status: 404
        });
    }

    // Get the poll object
    const poll = await r2Object.json();

    // Get the user's IP address
    const requestWorker = request.headers.get("CF-Worker");
    let requestIP = request.headers.get("CF-Connecting-IP");
    // Get it from the custom header only if the request came from Pages Functions
    if(requestWorker == "publicpolls.pages.dev" && requestIP == "2a06:98c0:3600::103") {
        requestIP = request.headers.get("X-User-IP");
    }

    // Create a SHA-512 from the IP address
    requestIP = new TextEncoder().encode(requestIP);
    const digest = await crypto.subtle.digest("SHA-512", requestIP);
    const ipHash = [...new Uint8Array(digest)].map(x => {
        return x.toString(16).padStart(2, "0");
    }).join("");

    // Check if the current IP address already has voted
    poll.voted = false;
    if(poll.no_votes && poll.no_votes.includes(ipHash)) {
        poll.voted = true; 
        poll.chosen_option = -1;
    }
    for(let i = 0; i < poll.options.length; i++) {
        const option  = poll.options[i];
        if(option.votes.includes(ipHash)) {
            poll.voted = true;
            poll.chosen_option = i;
        }
        option.votes = option.votes.length; // Convert the votes to a number
    }

    // Remove the votes from the poll if the user has not voted
    if(!poll.voted) {
        poll.options.forEach(option => {
            option.votes = undefined;
        });
    }
    poll.no_votes = undefined;

    // Return the poll object
    return new Response(JSON.stringify(poll), {
        headers: {
            "Content-Type": "application/json"
        }
    });
}