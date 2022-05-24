// Immediatly invoked async function expression to allow the use of await
(async () => {

    // Get a list of the polls
    const list = await fetch("/api/list");
    const json = await list.json();

    // Get the poll container DOM and make it empty (to remove the loading animation)
    const pollContainer = document.getElementById("polls");
    pollContainer.innerHTML = "";

    // Loop through the polls and add them to the DOM
    for(const poll of json) {
        // The poll container (visible as a "card" on the page)
        const div = document.createElement("div");
        div.classList.add("poll-card");
        div.setAttribute("onclick", `window.location.href = "/poll/${poll.id}"`);

        // The question
        const question = document.createElement("h3");
        question.textContent = poll.question;
        div.appendChild(question);

        // The list of additional info
        const info = document.createElement("ul");

        // The asker of the poll
        const asker = document.createElement("li");
        asker.textContent = `Asked by ${poll.name}`;
        info.appendChild(asker);

        // The amount of votes
        const votes = document.createElement("li");
        votes.textContent = `${poll.total_votes} vote${poll.total_votes == 1 ? "" : "s"} so far`;
        info.appendChild(votes);

        // The date of the poll
        const postedOn = document.createElement("li");
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
        postedOn.textContent = date;
        info.appendChild(postedOn);

        // Add the list of additional info to the poll card
        div.appendChild(info);

        // Add the poll card to the DOM
        pollContainer.appendChild(div);
    }
})();