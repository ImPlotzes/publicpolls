/**
 * Handle requests to the /api/list endpoint
 * @param {Request} request The incoming HTTP request
 * @param {*} env Object to access the environment variables and bindings
 * @param {*} ctx Object to access the context functions
 * @returns {Promise<Response>} The response to send back to the client
 */
export default async function handleList(request, env, ctx) {
    // Check if the request method is allowed
    if(request.method != "GET") {
        return new Response(JSON.stringify({
            error: "Method not allowed",
            code: 405
        }), {
            status: 405
        });
    }

    // Get the amount of polls to return
    const url = new URL(request.url);
    const amount = parseInt(url.searchParams.get("limit") ?? 25);

    // Check if the amount is valid
    if(isNaN(amount) || amount <= 0 || amount > 25) {
        return new Response(JSON.stringify({
            error: "Invalid limit",
            code: 400
        }), {
            status: 400
        });
    }

    // Get the polls from the database
    const r2Objects = (await env.R2_BUCKET.list({
        limit: amount
    })).objects;

    // Get the poll objects
    const promises = await Promise.allSettled(r2Objects.map(poll => getPoll(env, poll)));
    const polls = [];
    for(const poll of promises) {
        if(poll.status == "fulfilled") {
            polls.push(poll.value);
        }
    }

    // Return the polls
    return new Response(JSON.stringify(polls), {
        headers: {
            "Content-Type": "application/json"
        }
    });
}


/**
 * Gets the poll object from an R2Object ready to be sent to the client
 * @param {*} env Object to access the R2 bucket
 * @param {*} poll The poll object
 * @returns {Promise<Object>} The poll object
 */
async function getPoll(env, poll) {
    const json = await (await env.R2_BUCKET.get(poll.key)).json();
    json.total_votes = 0;
    while(json.options.length != 0) {
        const option = json.options.pop();
        json.total_votes += option.votes.length;
    }
    json.options = undefined;
    return json;
}
