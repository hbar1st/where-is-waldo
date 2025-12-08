This is the client-side app that interfaces with the where-is-waldo-api

Live version: https://hbar1st.github.io/where-is-waldo/

Nice to have feature for the future:
- a way to pause and restart game play (would require the api allow that). The pause would blur the scene again. 


TODOs:
- make the Top Ten button show the top ten scores (with the current user's score highlighted and the name area editable so that they can edit their username in the list)
- add game play interactions (clicking on a character and identifying it adds a visible tag to the scene),
while clicking on the wrong character should pop up a quick X mark with message "wrong" or something like that.
- why doesn't the top ten dialog trigger when the user finds the last character? (check on the even trigger!)
- if the player is not in top ten, show their score in the top area of the top ten but above the TOP 10 header somewhow (Your Score:...)
- give feedback when the answer is correct! (maybe make the tag visible for a second?)
- make the intro text change if the game has already been solved