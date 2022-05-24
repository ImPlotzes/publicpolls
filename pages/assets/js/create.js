// Keep count of how many options there are
let optionCount = 2;

// Add a new option when the add option button is clicked
document.getElementById("add-option-button").addEventListener("click", () => {
    // Make sure they don't add more than 15 options
    if(optionCount >= 15) {
        alert("You can only have 15 options.");
        return;
    }
    optionCount++;
    
    // Create a new option element for in the DOM
    const element = document.createElement("div");
    element.classList.add("input-container");
    element.innerHTML = `
<label for="option${optionCount}">Option ${optionCount}
    <svg onclick="removeOption(this)" height="1.3em" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
        <path fill="#a32f2f" d="M35 5V25H55A1 1 0 0155 35H35V55A1 1 0 0125 55V35H5A1 1 0 015 25H25V5A1 1 0 0135 5Z"/>
    </svg></label>
<input id="option${optionCount}" type="text" maxlength="64" placeholder="Ex. Green">`;

    // Add the new option to the DOM
    document.getElementById("options").appendChild(element);
});


/**
 * Removes an option from the DOM
 * @param {SVGAElement} element The delete icon that was clicked
 */
function removeOption(element) {
    optionCount--;

    // The parent of the parent of the delete icon is the input container
    element.parentElement.parentElement.remove();

    // Go through all the remaining options and update their IDs
    const optionsContainer = document.getElementById("options");
    for(let i = 1; i <= optionsContainer.children.length; i++) {
        const option = optionsContainer.children[i - 1];
        const label = option.getElementsByTagName("label")[0];
        if(i > 2) {
            label.innerHTML = `
            Option ${i}
            <svg onclick="removeOption(this)" height="1.3em" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
                <path fill="#a32f2f" d="M35 5V25H55A1 1 0 0155 35H35V55A1 1 0 0125 55V35H5A1 1 0 015 25H25V5A1 1 0 0135 5Z"/>
            </svg>`;
        } else {
            label.innerHTML = `Option ${i}`;
        }
        label.setAttribute("for", "option" + i);
        option.getElementsByTagName("input")[0].setAttribute("id", "option" + i);
    }
}


// Create a poll when the create button is clicked
const errMessage = document.getElementById("error-message");
const button = document.getElementById("create-button");
button.addEventListener("click", async () => {
    // Empty the error message and disable the button
    errMessage.textContent = "";
    errMessage.style.border = "2px solid #1F1F27";
    button.disabled = true;

    // Get the values from the DOM
    const question = document.getElementById("question").value;
    const name = document.getElementById("name").value;
    const options = [];
    for(let i = 1; i <= optionCount; i++) {
        const option = document.getElementById("option" + i);
        if(option.value) {
            options.push(option.value);
        }
    }

    // Add the values into a single object
    const data = {
        question: question,
        name: name,
        options: options
    }

    // If statement to make sure the user has entered every field in the DOM
    if(question && name && options.length == optionCount && options.length > 1) {
        // Create the poll
        const response = await fetch("/api/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        // Send the user to the poll page if the poll was created successfully
        if(response.status == 201) {
            const poll = await response.json();
            window.location.href = `/poll/${poll.id}`;

        // Otherwise, display an error message
        } else {
            errMessage.textContent = "An error occurred. Please try again. (Error code: " + response.status + ")";
            errMessage.style.border = "1px solid #a32f2f";
            button.disabled = false;
        }

    // Otherwise, say that they need to fill out all the fields
    } else {
        errMessage.textContent = "Please fill out all fields.";
        errMessage.style.border = "1px solid #a32f2f";
        button.disabled = false;
    }
});
