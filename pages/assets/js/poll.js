// Get the poll ID from the URL
const pollID = window.location.pathname.replace("/poll/", "");

// Immediately invoked async function to allow the use of await
(async () => {
    // Get needed DOM elements
    const loadingContainer = document.getElementById("loading");
    const contentContainer = document.getElementById("content-container");
    const questionElement = document.getElementById("question");
    const askerElement = document.getElementById("asker");
    const optionsElement = document.getElementById("options");

    // Get the poll (removes vote information if the IP address hasn't yet voted)
    const response = await fetch(`/api/poll?id=${pollID}`);
    const poll = await response.json();

    // Show the error message if the fetch wasn't successfull
    if(response.status != 200) {
        loadingContainer.textContent = poll.error;
        return;
    }

    // Show the question and asker in the DOM
    questionElement.textContent = poll.question;
    askerElement.textContent += poll.name;

    // Go through all the options of the poll and add them to the DOM
    for(let i = 0; i < poll.options.length; i++) {
        const option = poll.options[i];

        // Label of the input, is the container for the option in the DOM
        const labelElement = document.createElement("label");
        labelElement.setAttribute("for", `option-${i}`);

        // Element that shows the result bar (no results makes this invisible)
        const barElement = document.createElement("div");
        barElement.classList.add("bar");
        labelElement.appendChild(barElement);

        // The radio button for vote functionality 
        const inputElement = document.createElement("input");
        inputElement.setAttribute("type", "radio");
        inputElement.setAttribute("name", "option");
        inputElement.setAttribute("id", `option-${i}`);
        inputElement.setAttribute("value", i);
        labelElement.appendChild(inputElement);

        // The text of the option
        const spanElement = document.createElement("span");
        spanElement.textContent = option.value;
        labelElement.appendChild(spanElement);

        // Add the label (option) to the DOM
        optionsElement.appendChild(labelElement);
    }

    // Hide the loading container and show the content container
    loadingContainer.style.display = "none";
    contentContainer.style.display = "block";

    // Timeout to make sure the bar animations will play when the results will be shown
    setTimeout(() => {
        showPollResult(poll);
    }, 10);
})();


// Click event listener for the vote button
const voteButton = document.getElementById("vote-button");
voteButton.addEventListener("click", async () => {
    // Disable the button so they can't click it while it's doing stuff
    voteButton.disabled = true;
    
    const errorElement = document.getElementById("error-message");

    // Get the value of the selected option (0 to n-1)
    const chosenOption = document.querySelector("input[name=option]:checked")?.value;

    // Show an error message if they haven't yet chosen an option
    if(!chosenOption) {
        errorElement.style.border = "1px solid #a32f2f";
        errorElement.textContent = "Please choose an option";
        voteButton.disabled = false;
        return;
    }

    // Vote on the poll
    const response = await fetch(`/api/vote?id=${pollID}&vote=${chosenOption}`);
    const poll = await response.json();

    // Show the error message if the fetch wasn't successfull
    if(response.status != 200) {
        errorElement.style.border = "1px solid #a32f2f";
        errorElement.textContent = poll.error;
        voteButton.disabled = false;
        return;
    }

    // Say that the they voted next to the button
    errorElement.style.border = "1px solid var(--main-colour)";
    errorElement.textContent = "You voted!";

    // Show the results of the poll
    showPollResult(poll);
});


/**
 * Shows the results of the poll in the DOM (only if the person has voted)
 * @param {*} poll A poll object
 */
function showPollResult(poll) {
    // Only do stuff if the person has voted on the poll
    if(poll.voted) {
        // Get the ID of the voted option
        const chosenOption = poll.chosen_option;

        // Check the chosen option
        document.getElementById("option-" + chosenOption).checked = true;

        // Disable all inputs on the page (so they can't change the checked option)
        for(const input of document.getElementsByTagName("input")) {
            input.disabled = true;
        }

        // Get the total amount of votes
        let totalVotes = 0;
        for(const option of poll.options) {
            totalVotes += option.votes;
        }

        // Go through all the options and set the correct width of the bar
        const barElements = document.getElementsByClassName("bar");
        for(let i = 0; i < poll.options.length; i++) {
            const barElement = barElements[i];
            const option = poll.options[i];
            barElement.style.width = `${Math.round(option.votes / totalVotes * 100)}%`;
        }

        // Make sure the vote button is disabled
        document.getElementById("vote-button").disabled = true;
    }
}
