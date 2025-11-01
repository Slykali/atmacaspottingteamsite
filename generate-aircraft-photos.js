
const aircraftTypes = [
  { models: ['Boeing 737', 'Boeing 737-800', 'Boeing 737 MAX'], type: 'Commercial', tags: ['Narrow-body', 'Short-haul'] },
  { models: ['Airbus A320', 'Airbus A320neo', 'Airbus A321'], type: 'Commercial', tags: ['Narrow-body', 'Short-haul'] },
  { models: ['Boeing 777', 'Boeing 777-300ER'], type: 'Commercial', tags: ['Wide-body', 'Long-haul'] },
  { models: ['Airbus A350', 'Airbus A350-900', 'Airbus A350-1000'], type: 'Commercial', tags: ['Wide-body', 'Long-haul'] },
  { models: ['Boeing 787', 'Boeing 787-9', 'Boeing 787-10'], type: 'Commercial', tags: ['Wide-body', 'Long-haul'] },
  { models: ['Airbus A330', 'Airbus A330-300'], type: 'Commercial', tags: ['Wide-body', 'Medium-haul'] },
  { models: ['Embraer E190', 'Embraer E195'], type: 'Regional', tags: ['Regional', 'Short-haul'] },
  { models: ['ATR 72'], type: 'Regional', tags: ['Regional', 'Turboprop'] },
  { models: ['Boeing 747', 'Boeing 747-8'], type: 'Commercial', tags: ['Wide-body', 'Freighter', 'Jumbo'] },
  { models: ['Airbus A380'], type: 'Commercial', tags: ['Wide-body', 'Superjumbo', 'Long-haul'] },
  { models: ['Gulfstream G650', 'Gulfstream G550'], type: 'Business', tags: ['Business Jet', 'Executive'] },
  { models: ['Cessna Citation', 'Cessna Citation XLS+'], type: 'Business', tags: ['Business Jet', 'Light'] },
  { models: ['Bombardier Global'], type: 'Business', tags: ['Business Jet', 'Long-range'] },
  { models: ['F-16 Fighting Falcon'], type: 'Military', tags: ['Fighter', 'Turkish Air Force'] },
  { models: ['F-4 Phantom II'], type: 'Military', tags: ['Fighter', 'Turkish Air Force'] },
];

const airports = [
  { name: 'İstanbul Havalimanı', code: 'IST', city: 'İstanbul' },
  { name: 'Sabiha Gökçen Havalimanı', code: 'SAW', city: 'İstanbul' },
  { name: 'Antalya Havalimanı', code: 'AYT', city: 'Antalya' },
  { name: 'Ankara Esenboğa', code: 'ESB', city: 'Ankara' },
  { name: 'İzmir Adnan Menderes', code: 'ADB', city: 'İzmir' },
  { name: 'Adana Şakirpaşa', code: 'ADA', city: 'Adana' },
  { name: 'Trabzon Havalimanı', code: 'TZX', city: 'Trabzon' },
  { name: 'Bodrum Milas', code: 'BJV', city: 'Bodrum' },
  { name: 'Dalaman Havalimanı', code: 'DLM', city: 'Dalaman' },
  { name: 'Gaziantep Oğuzeli', code: 'GZT', city: 'Gaziantep' },
];

const actions = [
  { action: 'Takeoff', direction: 'Kalkış', timeOfDay: 'Day' },
  { action: 'Takeoff', direction: 'Kalkış', timeOfDay: 'Sunset' },
  { action: 'Landing', direction: 'İniş', timeOfDay: 'Day' },
  { action: 'Landing', direction: 'İniş', timeOfDay: 'Night' },
  { action: 'Taxiing', direction: 'Taksi', timeOfDay: 'Day' },
  { action: 'Approach', direction: 'Yaklaşma', timeOfDay: 'Day' },
  { action: 'At Gate', direction: 'Kapı', timeOfDay: 'Day' },
  { action: 'On Ground', direction: 'Apron', timeOfDay: 'Day' },
];

const photographers = [
  'Aircraft Photography Services',
  'Aviation Collection',
  'Spotting Team Turkey',
  'SkyView Photography',
  'Plane Spotter Pro',
  'Airport Lens',
  'Wing Photography',
  'Aero Image',
];

function randomDate() {
  const start = new Date(2024, 0, 1);
  const end = new Date(2024, 11, 31);
  const random = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return random.toISOString().split('T')[0];
}

function generatePhotoData() {
  const aircraft = aircraftTypes[Math.floor(Math.random() * aircraftTypes.length)];
  const model = aircraft.models[Math.floor(Math.random() * aircraft.models.length)];
  const airport = airports[Math.floor(Math.random() * airports.length)];
  const action = actions[Math.floor(Math.random() * actions.length)];
  const photographer = photographers[Math.floor(Math.random() * photographers.length)];
  
  const photoId = Math.floor(Math.random() * 1000000);
  const src = `https://picsum.photos/seed/aircraft${photoId}/800/600`;
  
  const alt = `${model} ${action.direction} yapan ${airport.city} havalimanında`;
  const tags = [model, action.direction, airport.city, ...aircraft.tags, action.timeOfDay];
  
  return {
    src,
    alt,
    tags,
    location: airport.name,
    date: randomDate(),
    photographer,
  };
}

const photos = [];
for (let i = 0; i < 1000; i++) {
  photos.push(generatePhotoData());
}

console.log(JSON.stringify(photos, null, 2));

