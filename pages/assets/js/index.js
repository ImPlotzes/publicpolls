(async () => {
    const list = await fetch("/api/list");
    const json = await list.json();

    const pollContainer = document.getElementById("polls");
    pollContainer.innerHTML = "";

    for(const poll of json) {
        const div = document.createElement("div");
        div.classList.add("poll-card");
        div.setAttribute("onclick", `window.location.href = "/poll/${poll.id}"`);

        const question = document.createElement("h3");
        question.innerText = poll.question;
        div.appendChild(question);

        const info = document.createElement("ul");

        const asker = document.createElement("li");
        asker.innerText = `Asked by ${poll.name}`;
        info.appendChild(asker);

        let voteAmount = 0;
        for(const option of poll.options) {
            voteAmount += option.votes;
        }
        const votes = document.createElement("li");
        votes.innerText = `${voteAmount} vote${voteAmount == 1 ? "" : "s"} so far`;
        info.appendChild(votes);

        const postedOn = document.createElement("li");
        let date = "Posted ";
        if(Date.now() - poll.created_at < 86400000) {
            const diff = Date.now() - poll.created_at;
            const hours = Math.floor(diff / 3600000);
            if(hours > 0) {
                date += `${hours} hour${hours == 1 ? "" : "s"} and `;
            }
            const minutes = Math.floor((diff % 3600000) / 60000);
            date += `${minutes} minute${minutes == 1 ? "" : "s"} ago`;
        } else {
            const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            const dateObj = new Date(poll.created_at);
            date += `${months[dateObj.getMonth()]} ${dateObj.getDate()}, ${dateObj.getFullYear()}`;
        }
        postedOn.innerText = date;
        info.appendChild(postedOn);

        div.appendChild(info);

        pollContainer.appendChild(div);
    }
})();