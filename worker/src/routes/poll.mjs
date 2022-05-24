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

    // Check if the current IP address already voted
    const requestIP = request.headers.get("CF-Connecting-IP");
    poll.voted = false;
    for(let i = 0; i < poll.options.length; i++) {
        const option  = poll.options[i];
        if(option.votes.includes(requestIP)) {
            poll.voted = true;
            poll.chosen_option = i;
        }
        option.votes = option.votes.length;
    }

    // Remove the votes from the poll if the user has not voted
    if(!poll.voted) {
        poll.options.forEach(option => {
            option.votes = undefined;
        });
    }

    // Return the poll object
    return new Response(JSON.stringify(poll), {
        headers: {
            "Content-Type": "application/json",
            "X-your-ip": requestIP
        }
    });
}