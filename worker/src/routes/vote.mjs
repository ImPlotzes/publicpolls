/**
 * Handles all requests to the /api/vote endpoint
 * @param {Request} request The incoming HTTP request
 * @param {*} env Object to access the environment variables and bindings
 * @param {*} ctx Object to access the context functions
 * @returns {Promise<Response>} The response to send back to the client
 */
export default async function handleVote(request, env, ctx) {
    // Check if the request method is allowed
    if(request.method != "GET") {
        return new Response(JSON.stringify({
            error: "Method not allowed",
            code: 405
        }), {
            status: 405
        });
    }

    // Get the poll ID and their vote
    const url = new URL(request.url);
    const pollID = url.searchParams.get("id");
    const vote = parseInt(url.searchParams.get("vote"));

    // Check if the poll ID is valid and if the vote is valid
    if(!pollID || pollID.length == 0) {
        return new Response(JSON.stringify({
            error: "Invalid poll ID",
            code: 400
        }), {
            status: 400
        });
    } else if(isNaN(vote) || vote < 0) {
        return new Response(JSON.stringify({
            error: "Invalid vote",
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

    // Check if the vote is valid
    if(vote > poll.options.length) {
        return new Response(JSON.stringify({
            error: "Invalid vote",
            code: 400
        }), {
            status: 400
        });
    }

    // Create the IP address hash
    let requestIP = request.headers.get("CF-Connecting-IP");
    if(requestIP == "2a06:98c0:3600::103") {
        requestIP = request.headers.get("X-User-IP");
    }
    requestIP = new TextEncoder().encode(requestIP);
    const digest = await crypto.subtle.digest("SHA-512", requestIP);
    const ipHash = [...new Uint8Array(digest)].map(x => {
        return x.toString(16).padStart(2, "0");
    }).join("");

    // Check if the current IP address already has voted for this poll
    for(const option of poll.options) {
        // Return 403 (Forbidden) if the user has already voted
        if(option.votes.includes(ipHash)) {
            return new Response(JSON.stringify({
                error: "You already have voted",
                code: 403
            }), {
                status: 403
            });
        }
    }

    // Add their vote to the poll
    poll.options[vote].votes.push(ipHash);

    // Save the poll
    ctx.waitUntil(env.R2_BUCKET.put(pollID, JSON.stringify(poll), {
        customMetadata: {
            created_at: poll.created_at,
            name: poll.name,
            question: poll.question,
            total_votes: poll.options.reduce((total, option) => total + option.votes.length, 0)
        }
    }));

    // Hide the voters IP address hashes from the poll
    poll.options.forEach(option => {
        option.votes = option.votes.length;
    });

    poll.voted = true;
    poll.chosen_option = vote;

    // Return the poll object
    return new Response(JSON.stringify(poll), {
        headers: {
            "Content-Type": "application/json"
        }
    });
}