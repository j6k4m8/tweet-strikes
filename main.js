/**
 * This module is the main entrypoint for the Tweet-Strikes browser extension.
 *
 * This browser extension provides a scratch-pad for each twitter user in a
 * user's timeline, and has a three-strikes feature that allows a user to
 * prompt themselves to unfollow a user in the future if they see additional
 * low-quality tweets. (I use this to flag people for hocking NFTs, and then
 * unfollow them if they do it again.)
 *
 */

function getTwitterUserProfilePictureElements() {
    /**
     * Get a list of all twitter user elements on the current page.
     *
     * @return {Array} An array of twitter user Element objects.
     */
    return Array.from(document.querySelectorAll('article [style="height: 48px; width: 48px;"]'));
}

function getTweetText() {
    return getTwitterUserProfilePictureElements().map(i => i.parentElement.parentElement.parentElement.parentElement.innerText);
}

function getUsers() {
    return getTweetText().map(i => {
        // Regex match a line of text that starts with @
        let match = i.match(/@[a-zA-Z0-9_]+/gi);
        if (match) {
            return match[0];
        }
        return null;
    })
}

function getZippedPictureElementsAndUsers() {
    let u = getUsers();
    return getTwitterUserProfilePictureElements().map((i, j) => [i, u[j]]);
}


class TwitterUserNotes {
    /**
     * A class to keep track of user notes.
     *
    */

    constructor() {
        /**
         * Create a new instance of the TwitterUserNotes class.
         */
        this.notes = {};
        this.loadFromBrowserStorage();
    }

    loadFromBrowserStorage() {
        /**
         * Load the user notes from browser storage.
         */
        this.notes = JSON.parse(localStorage.getItem('userNotes'));
        if (this.notes === null) {
            this.notes = {};
        }
    }

    saveToBrowserStorage() {
        /**
         * Save the user notes to browser storage.
         */
        localStorage.setItem('userNotes', JSON.stringify(this.notes));
    }

    getNote(username) {
        /**
         * Get the note for a given username.
         *
         * @param {string} username The username to get the note for.
         * @return {object} The note and strikes for the given username.
         */
        return this.notes[username] || {
            note: "",
            strikes: 0
        };
    }

    setNote(username, note, strikes) {
        /**
         * Set the note for a given username.
         *
         * @param {string} username The username to set the note for.
         * @param {string} note The note to set.
         * @param {number} strikes The number of strikes to set.
         */
        this.notes[username] = {
            note: note,
            strikes: strikes
        };
        this.saveToBrowserStorage();
    }

    removeNote(username) {
        /**
         * Remove the note for a given username.
         *
         * @param {string} username The username to remove the note for.
         */
        delete this.notes[username];
        this.saveToBrowserStorage();
    }

    getStrikeCount(username) {
        /**
         * Get the number of strikes for a given username.
         *
         * @param {string} username The username to get the strike count for.
         * @return {number} The number of strikes for the given username.
         */
        return (this.notes[username] || {
            strikes: 0
        }).strikes;
    }

    incrementStrikeCount(username) {
        /**
         * Increment the strike count for a given username.
         *
         * @param {string} username The username to increment the strike count for.
         */
        this.setNote(username, this.getNote(username).note, this.getStrikeCount(username) + 1);
    }

    decrementStrikeCount(username) {
        /**
         * Decrement the strike count for a given username.
         *
         * @param {string} username The username to increment the strike count for.
         */
        this.setNote(username, this.getNote(username).note, Math.max(0, this.getStrikeCount(username) - 1));
    }
}




notes = new TwitterUserNotes();

function incrementStrikeCount(username) {
    /**
     * Increment the strike count for a given username.
     * @param {string} username The username to increment the strike count for.
     * @return {number} The number of strikes for the given username.
     */
    notes.incrementStrikeCount(username);
}


function decrementStrikeCount(username) {
    /**
     * Increment the strike count for a given username.
     * @param {string} username The username to increment the strike count for.
     * @return {number} The number of strikes for the given username.
     */
    notes.decrementStrikeCount(username);
}



function populateUI() {

    // Add styles to the page.
    let style = document.createElement('style');
    style.innerHTML = `
    /* Style the emoji buttons: */
    .strike-count {
        text-align: center;
    }
    .strike-count-add {
        display: flex;
        justify-content: space-between;
    }

    .dec-strike-count {
        background-color: #579b49;
        border: none;
        border-radius: 50%;
        padding: 0.3em 0.5em;
        opacity: 0.05;
        transition: opacity 0.1s ease-in-out;
    }
    .dec-strike-count:hover {
        opacity: 1;
    }
    .inc-strike-count {
        background-color: #9b4958;
        border: none;
        border-radius: 50%;
        padding: 0.3em 0.5em;
        opacity: 0.05;
        transition: opacity 0.1s ease-in-out;
    }
    .inc-strike-count:hover {
        opacity: 1;
    }
    `;
    document.head.appendChild(style);

    //  Get all the user profile pictures on the page.
    let userProfilePictures = getTwitterUserProfilePictureElements();

    // Get all the user names on the page.
    let userNames = getUsers();

    // Get all the user strikes.
    let userStrikes = userNames.map(i => notes.getStrikeCount(i));

    // Put the number of strikes inside the picture element:
    userProfilePictures.forEach((i, j) => {
        let strikeEmojis = "";
        for (let k = 0; k < userStrikes[j]; k++) {
            strikeEmojis += "❌";
        }

        // Check for existing .strike-count:
        let parent = i.parentElement;
        let strikeCount = parent.querySelector(".strike-count");
        if (strikeCount) {
            strikeCount.innerText = strikeEmojis;
        } else {
            // Create a new .strike-count:
            parent.innerHTML += `<div class="strike-count">${strikeEmojis}</div><div class="strike-count-add"><button class='dec-strike-count'>👍</button><button class='inc-strike-count'>👎</button></div>`;

            // Add event listeners to the buttons:
            parent.parentElement.querySelector(".strike-count-add").querySelector(".inc-strike-count").addEventListener("click", () => {
                incrementStrikeCount(userNames[j]);
                populateUI();
            });

            parent.parentElement.querySelector(".strike-count-add").querySelector(".dec-strike-count").addEventListener("click", () => {
                decrementStrikeCount(userNames[j]);
                populateUI();
            });

        }
    });
}

// Rerun populateUI every second.
setInterval(populateUI, 1000);
