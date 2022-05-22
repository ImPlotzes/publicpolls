// Import the route handlers
import create from "./routes/create.mjs";
import list from "./routes/list.mjs";


// Define all the routes and their handler
const routes = {
    "create": create,
    "list": list
};


export default {
    /**
     * Handles all HTTP requests
     * @param {Request} request The incoming HTTP request
     * @param {*} env Object to access the environment variables and bindings
     * @returns {Response} The response to send back to the client
     */
    async fetch(request, env) {
        const url = new URL(request.url);
        const path = url.pathname.replace("/api/", "");

        // Return any OPTIONS request
        if(request.method == "OPTIONS") {
            return new Response(null, {
                headers: {
                    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type"
                }
            });
        }

        // Check if the route exists
        if(!(path in routes)) {
            return new Response(JSON.stringify({
                error: "Unknown endpoint",
                code: 404
            }), {
                status: 404
            });
        }

        // Return the generated response from the route handler
        return routes[path](request, env);
    }
}
