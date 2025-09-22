document.addEventListener('DOMContentLoaded', function() {

    const S_FORM = document.getElementById('storyForm');

    // If there is content on the form
    if(S_FORM){

        S_FORM.addEventListener('submit', async function(e){
            e.preventDefault(); // Prevent default submission

            // Get form fields
            let authorName = document.getElementById('authorName');
            let storyTitle = document.getElementById('storyTitle');
            let storyContent = document.getElementById('storyContent');
            let locationTag = document.getElementById('locationTag');

            // Add input event listeners to clear red background when user starts typing
            [authorName, storyTitle, storyContent, locationTag].forEach(field => {
                field.addEventListener('input', function() {
                    this.style.backgroundColor = "white";
                });
            });

            // Validation check
            if(authorName.value.trim() == "" || storyTitle.value.trim() == "" || storyContent.value.trim() == "" || locationTag.value.trim() == "") {

                if(authorName.value.trim() == "" && storyTitle.value.trim() == "" && storyContent.value.trim() == "" && locationTag.value.trim() == "") {
                    authorName.style.backgroundColor = "#9200002d";
                    storyTitle.style.backgroundColor = "#9200002d";
                    storyContent.style.backgroundColor = "#9200002d";
                    locationTag.style.backgroundColor = "#9200002d";
                }else if(authorName.value.trim() == "") {
                    authorName.style.backgroundColor = "#9200002d";
                }else if(storyTitle.value.trim() == "") {
                    storyTitle.style.backgroundColor = "#9200002d";
                }else if(storyContent.value.trim() == "") {
                    storyContent.style.backgroundColor = "#9200002d";
                }else{
                    locationTag.style.backgroundColor = "#9200002d";
                }

                alert("Fill the form out");
                return;
            }

            // Reset backgrounds to white
            authorName.style.backgroundColor = "white";
            storyTitle.style.backgroundColor = "white";
            storyContent.style.backgroundColor = "white";
            locationTag.style.backgroundColor = "white";
            
            try {
                // Get coordinates from the location
                const COORDINATES = await getCoordinates(locationTag.value);
                
                if (!COORDINATES) {
                    alert("Could not find coordinates for the location. Please check the location name.");
                    return;
                }

                const FORM_CONTENT = {
                    author_name: authorName.value,
                    story_title: storyTitle.value,
                    story_text: storyContent.value,
                    location_tag: locationTag.value,
                    latitude: parseFloat(COORDINATES.latitude),
                    longitude: parseFloat(COORDINATES.longitude),
                    decade_tag: document.getElementById('decadeNum').value
                };

                console.log('Sending data:', FORM_CONTENT); // Debug log

                const RESPONSE = await fetch('/api/stories', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(FORM_CONTENT)
                });

                const RESULT = await RESPONSE.json();
                console.log('Server response:', RESULT); // Debug log

                if(RESPONSE.ok){
                    alert("Submission Successful!");
                    // Redirect to home page
                    window.location.href = '/';
                } else {
                    alert("Submission error: " + (RESULT.error || 'Unknown error'));
                }

            } catch(error) {
                console.error('Error:', error);
                alert("Error: " + error.message);
            }
        });
    }

    async function getCoordinates(name){
        const PLACE_NAME = name;

        if (!PLACE_NAME) {
            throw new Error("Please enter the name of your place");
        }

        const URL = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(PLACE_NAME)}`;

        try{
            const RESPONSE = await fetch(URL);

            const J_RESPONSE = await RESPONSE.json();

            if (!J_RESPONSE || J_RESPONSE.length === 0){
                return null; // Location not found
            } else {
                return {
                    latitude: J_RESPONSE[0].lat,
                    longitude: J_RESPONSE[0].lon
                };
            }

        } catch(err) {
            console.error('Geocoding error:', err);
            throw err;
        }

    }

    //Create A Card For The Story
    function createCard(story){
        let card = document.createElement('div');
        card.className = 'storyCard';

        let title = document.createElement('h3');
        title.textContent = story.story_title;

        let authorName = document.createElement('p');
        authorName.innerHTML = `<strong>By: </strong> ${story.author_name}`;

        let locationTag = document.createElement('p');
        locationTag.innerHTML = `<strong>Location: </strong> ${story.location_tag}`;
        
        let decadeTag = document.createElement('p');
        decadeTag.innerHTML = `<strong>Decade: </strong> ${story.decade_tag}`;
 
        let storyContent = document.createElement('p');
        storyContent.textContent = story.story_text;

        card.append(title);
        card.append(authorName);
        card.append(locationTag);
        card.append(decadeTag)
        card.append(storyContent);

        return card;
       
    }

    //Render All Stories Onto The Page
    function renderStories(stories){
        let storyWall = document.getElementById('storyWall');
        storyWall.innerHTML = ''; // clear old stories

        //Check if there is any stories
        if(stories.length === 0){
            let checkMessage = document.createElement('p');
            checkMessage.textContent = "No Stories Available For This Selection!";
            storyWall.appendChild(checkMessage);
            return;
        }

        stories.forEach((story) => {
            let card = createCard(story);
            card.id = `story-${story.id}`;
            storyWall.appendChild(card);
        })
    }

    //Apply Filter For The Stories
    function applyStoryFilter(stories){
        let decadeFilter = document.getElementById('decadeFilter').value;
        let filtered = stories;

        if(decadeFilter!= "all"){
            filtered = stories.filter(st => st.decade_tag === decadeFilter);
        }
      

        renderStories(filtered);
    }


    //Load Stories From API
    async function loadStories(){
        try{
            let res = await fetch('/api/stories');
            if(!res.ok){
                throw new Error('Network Error!');
            }
            let stories = await res.json();
            renderStories(stories);

            let filterSelect = document.getElementById('decadeFilter');
            if(filterSelect){
                filterSelect.addEventListener('change', ()=> applyStoryFilter(stories));
            }

        }
        catch(err){
            console.error(err);
        }
    }

    loadStories();
});