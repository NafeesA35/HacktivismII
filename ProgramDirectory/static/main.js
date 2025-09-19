document.addEventListener('DOMContentLoaded', function() {

    const S_FORM = document.getElementById('storyForm');

    // If there is content on the form
    if(S_FORM){

        S_FORM.addEventListener('submit', async function(e){
            e.preventDefault(); // Prevent default submission

            const locationTag = document.getElementById('locationTag').value;
            
            try {
                // Get coordinates from the location
                const COORDINATES = await getCoordinates(locationTag);
                
                if (!COORDINATES) {
                    alert("Could not find coordinates for the location. Please check the location name.");
                    return;
                }

                const FORM_CONTENT = {
                    author_name: document.getElementById('authorName').value,
                    story_title: document.getElementById('storyTitle').value,
                    story_text: document.getElementById('storyContent').value,
                    location_tag: locationTag,
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
});