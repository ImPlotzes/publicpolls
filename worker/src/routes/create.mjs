/**
 * Handles requests to the /api/create endpoint
 * @param {Request} request The incoming HTTP request
 * @param {*} env Object to access the environment variables and bindings
 * @returns {Promise<Response>} The response to send back to the client
 */
export default async function handleCreate(request, env) {
    if(request.method != "POST") {
        return new Response(JSON.stringify({
            error: "Method not allowed",
            code: 405
        }), {
            status: 405,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        });
    }
    if(request.headers.get("Content-Type") != "application/json") {
        return new Response(JSON.stringify({
            error: "Content-Type must be application/json",
            code: 400
        }), {
            status: 400,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        });
    }

    // Parse the request body
    const body = await request.json();

    // Check if the request body is valid
    if(typeof body.question != "string" || body.question.length <= 0 || body.question.length > 128
        || typeof body.name != "string" || body.name.length <= 0 || body.name.length > 32
        || !(body.options instanceof Array) || body.options.length < 2 || body.options.length > 15
        || !body.options.every(option => {
            return typeof option == "string" && option.length > 0 && option.length <= 64;
        })) {
        return new Response(JSON.stringify({
            error: "Invalid request body",
            code: 400
        }), {
            status: 400,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        });
    }

    // Create the poll object
    const poll = {
        id: await createUniqueID(env),
        created_at: Date.now(),
        question: body.question,
        name: body.name,
        options: []
    };
    for(const option of body.options) {
        poll.options.push({
            value: option,
            votes: []
        });
    }
    
    // Add the poll to the database
    await env.R2_BUCKET.put(poll.id, JSON.stringify(poll));

    // Convert the vote arrays into numbers
    for(const option of poll.options) {
        option.votes = option.votes.length;
    }

    // Return the poll
    return new Response(JSON.stringify(poll), {
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        status: 201
    });
}


/**
 * Generates a garuanteed unique ID
 * @param {*} env Object to access the R2 Bucket object
 * @returns {Promise<string>} The unique ID
 */
async function createUniqueID(env) {
    let id = createID();
    while(await env.R2_BUCKET.get(id) != null) {
        id = createID();
    }
    return id;
}


/**
 * Generates a random ID
 * @returns {string} The random ID
 */
function createID() {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let id = "";
    for(let i = 0; i < 5; i++) {
        id += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return id;
}
