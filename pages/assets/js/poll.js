// Get the poll ID from the URL
const pollID = window.location.pathname.replace("/poll/", "");

// Animate the poll bars if there are results
window.onload = () => {
    const barElements = document.getElementsByClassName("bar");
    for(const bar of barElements) {
        const width = bar.getAttribute("data-width");
        if(width) {
            bar.style.width = width + "%";
        }
    }
};

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
            const percent = Math.round(option.votes / totalVotes * 100);
            barElement.style.width = `${percent}%`;
            
            // Show the votes and percentage of the option
            const emElement = document.createElement("em");
            emElement.textContent = `${option.votes} vote${option.votes==1?"":"s"} — ${percent}%`;
            barElement.nextElementSibling.nextElementSibling.append(emElement);
        }

        // Make sure the vote button is disabled
        document.getElementById("vote-button").disabled = true;
    }
}
