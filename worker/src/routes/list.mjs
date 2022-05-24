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

    // Get the polls from the database
    const r2Objects = (await env.R2_BUCKET.list()).objects;

    // Create the array of polls
    const polls = [];
    for(const r2Object of r2Objects) {
        const poll = r2Object.customMetadata;
        poll.id = r2Object.key;
        polls.push(poll);
    }

    // Return the polls
    return new Response(JSON.stringify(polls), {
        headers: {
            "Content-Type": "application/json"
        }
    });
}
