// Location page: minimal comments for developers

(function(){
  document.addEventListener('DOMContentLoaded', init);

  // Constants
  const DECADE_FILTER_ID = 'decadeFilter';
  const STORY_WALL_ID = 'storyWall';
  const DECADE_ALL = 'all';

  // cache stories for client-side decade filtering
  let allStories = [];

  async function init(){
    const params = new URLSearchParams(window.location.search);
    const lat = params.get('latitude');
    const lng = params.get('longitude');

    if(!lat || !lng){
      renderMessage('Missing coordinates. Use the map to choose a pin.');
      return;
    }

    await fetchAndRender(lat, lng);

    const decadeSelect = document.getElementById(DECADE_FILTER_ID);
    if(decadeSelect){
      decadeSelect.addEventListener('change', () => applyStoryFilter());
    }
  }

  async function fetchAndRender(lat, lng){
    try{
      const url = `/api/stories?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lng)}`;
      const res = await fetch(url);
      if(!res.ok){
        throw new Error(`Failed to fetch stories (${res.status})`);
      }
      allStories = await res.json();
      applyStoryFilter();
    }catch(err){
      console.error(err);
      renderMessage('Could not load stories for this location.');
    }
  }

  function applyStoryFilter(){
    const select = document.getElementById(DECADE_FILTER_ID);
    const decade = select ? select.value : DECADE_ALL;
    let filtered = allStories;
    if(decade && decade !== DECADE_ALL){
      filtered = allStories.filter(s => s.decade_tag === decade);
    }
    renderStories(filtered);
  }

  function renderStories(stories){
    const wall = document.getElementById(STORY_WALL_ID);
    wall.innerHTML = '';

    if(!stories || stories.length === 0){
      renderMessage('No Stories Available For This Selection!');
      return;
    }

    for(const story of stories){
      wall.appendChild(createCard(story));
    }
  }

  function createCard(story){
    const card = document.createElement('div');
    card.className = 'storyCard';

    const title = document.createElement('h3');
    title.textContent = story.story_title;

    const info = document.createElement('div');
    info.className= 'infoContent';

    const author = document.createElement('p');
    author.innerHTML = `<strong>By: </strong> ${story.author_name}`;

    const locationTag = document.createElement('p');
    locationTag.innerHTML = `<strong>Location: </strong> ${story.location_tag ?? ''}`;

    const decade = document.createElement('p');
    decade.innerHTML = `<strong>Decade: </strong> ${story.decade_tag ?? ''}`;

    const text = document.createElement('p');
    text.textContent = story.story_text;

    info.append(author, locationTag, decade)
    card.append(title, info, text);
    return card;
  }

  function renderMessage(msg){
    const wall = document.getElementById(STORY_WALL_ID);
    wall.innerHTML = '';
    const p = document.createElement('p');
    p.className = 'emptyMessage';
    p.textContent = msg;
    wall.appendChild(p);
  }
})();
