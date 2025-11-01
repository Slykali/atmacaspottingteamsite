// Demo aircraft gallery data - 1000+ photos
// For hackathon presentation

export interface AircraftPhoto {
  id: string;
  src: string;
  alt: string;
  tags: string[];
  location: string;
  date: string;
  photographer: string;
  likes_count: number;
  views: number;
}

export const aircraftGalleryData: AircraftPhoto[] = [
  {
    id: "1",
    src: "https://picsum.photos/seed/aircraft567285/800/600",
    alt: "Airbus A350 Apron yapan Ankara havalimanında",
    tags: ["Airbus A350", "Apron", "Ankara", "Wide-body", "Long-haul", "Day"],
    location: "Ankara Esenboğa",
    date: "2024-06-23",
    photographer: "Aircraft Photography Services",
    likes_count: 45,
    views: 234
  },
  {
    id: "2",
    src: "https://picsum.photos/seed/aircraft157304/800/600",
    alt: "Boeing 787-10 Taksi yapan Trabzon havalimanında",
    tags: ["Boeing 787-10", "Taksi", "Trabzon", "Wide-body", "Long-haul", "Day"],
    location: "Trabzon Havalimanı",
    date: "2024-08-18",
    photographer: "Aviation Collection",
    likes_count: 67,
    views: 312
  },
  {
    id: "3",
    src: "https://picsum.photos/seed/aircraft531596/800/600",
    alt: "Embraer E190 İniş yapan Ankara havalimanında",
    tags: ["Embraer E190", "İniş", "Ankara", "Regional", "Short-haul", "Night"],
    location: "Ankara Esenboğa",
    date: "2024-12-01",
    photographer: "SkyView Photography",
    likes_count: 32,
    views: 178
  },
  {
    id: "4",
    src: "https://picsum.photos/seed/aircraft497509/800/600",
    alt: "ATR 72 Kalkış yapan Trabzon havalimanında",
    tags: ["ATR 72", "Kalkış", "Trabzon", "Regional", "Turboprop", "Day"],
    location: "Trabzon Havalimanı",
    date: "2024-01-09",
    photographer: "Aviation Collection",
    likes_count: 28,
    views: 156
  },
  {
    id: "5",
    src: "https://picsum.photos/seed/aircraft476058/800/600",
    alt: "F-4 Phantom II Yaklaşma yapan Ankara havalimanında",
    tags: ["F-4 Phantom II", "Yaklaşma", "Ankara", "Fighter", "Turkish Air Force", "Day"],
    location: "Ankara Esenboğa",
    date: "2024-08-04",
    photographer: "SkyView Photography",
    likes_count: 89,
    views: 445
  },
  {
    id: "6",
    src: "https://picsum.photos/seed/aircraft862279/800/600",
    alt: "Boeing 737-800 Yaklaşma yapan Adana havalimanında",
    tags: ["Boeing 737-800", "Yaklaşma", "Adana", "Narrow-body", "Short-haul", "Day"],
    location: "Adana Şakirpaşa",
    date: "2024-03-31",
    photographer: "Aviation Collection",
    likes_count: 54,
    views: 267
  },
  {
    id: "7",
    src: "https://picsum.photos/seed/aircraft71097/800/600",
    alt: "Airbus A330-300 Apron yapan Bodrum havalimanında",
    tags: ["Airbus A330-300", "Apron", "Bodrum", "Wide-body", "Medium-haul", "Day"],
    location: "Bodrum Milas",
    date: "2024-07-09",
    photographer: "Wing Photography",
    likes_count: 42,
    views: 199
  },
  {
    id: "8",
    src: "https://picsum.photos/seed/aircraft944871/800/600",
    alt: "Airbus A380 Kapı yapan Bodrum havalimanında",
    tags: ["Airbus A380", "Kapı", "Bodrum", "Wide-body", "Superjumbo", "Long-haul", "Day"],
    location: "Bodrum Milas",
    date: "2024-01-02",
    photographer: "Plane Spotter Pro",
    likes_count: 156,
    views: 892
  },
  {
    id: "9",
    src: "https://picsum.photos/seed/aircraft274481/800/600",
    alt: "Boeing 787-10 Yaklaşma yapan Antalya havalimanında",
    tags: ["Boeing 787-10", "Yaklaşma", "Antalya", "Wide-body", "Long-haul", "Day"],
    location: "Antalya Havalimanı",
    date: "2024-09-04",
    photographer: "Wing Photography",
    likes_count: 73,
    views: 389
  },
  {
    id: "10",
    src: "https://picsum.photos/seed/aircraft484003/800/600",
    alt: "Cessna Citation XLS+ Taksi yapan Antalya havalimanında",
    tags: ["Cessna Citation XLS+", "Taksi", "Antalya", "Business Jet", "Light", "Day"],
    location: "Antalya Havalimanı",
    date: "2024-09-16",
    photographer: "Aero Image",
    likes_count: 38,
    views: 201
  }
];

// Generate 990 more photos programmatically for total of 1000
export function generateMoreAircraftPhotos(): AircraftPhoto[] {
  const photos: AircraftPhoto[] = [];
  const aircraftTypes = [
    { models: ['Boeing 737', 'Boeing 737-800', 'Boeing 737 MAX'], tags: ['Narrow-body', 'Short-haul'] },
    { models: ['Airbus A320', 'Airbus A320neo', 'Airbus A321'], tags: ['Narrow-body', 'Short-haul'] },
    { models: ['Boeing 777', 'Boeing 777-300ER'], tags: ['Wide-body', 'Long-haul'] },
    { models: ['Airbus A350', 'Airbus A350-900', 'Airbus A350-1000'], tags: ['Wide-body', 'Long-haul'] },
    { models: ['Boeing 787', 'Boeing 787-9', 'Boeing 787-10'], tags: ['Wide-body', 'Long-haul'] },
    { models: ['Airbus A330', 'Airbus A330-300'], tags: ['Wide-body', 'Medium-haul'] },
    { models: ['Embraer E190', 'Embraer E195'], tags: ['Regional', 'Short-haul'] },
    { models: ['ATR 72'], tags: ['Regional', 'Turboprop'] },
    { models: ['Boeing 747', 'Boeing 747-8'], tags: ['Wide-body', 'Freighter', 'Jumbo'] },
    { models: ['Airbus A380'], tags: ['Wide-body', 'Superjumbo', 'Long-haul'] },
  ];
  const airports = [
    { name: 'İstanbul Havalimanı', city: 'İstanbul' },
    { name: 'Sabiha Gökçen Havalimanı', city: 'İstanbul' },
    { name: 'Antalya Havalimanı', city: 'Antalya' },
    { name: 'Ankara Esenboğa', city: 'Ankara' },
    { name: 'İzmir Adnan Menderes', city: 'İzmir' },
    { name: 'Adana Şakirpaşa', city: 'Adana' },
    { name: 'Trabzon Havalimanı', city: 'Trabzon' },
    { name: 'Bodrum Milas', city: 'Bodrum' },
  ];
  const actions = ['Kalkış', 'İniş', 'Taksi', 'Yaklaşma', 'Kapı', 'Apron'];
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

  for (let i = 11; i <= 1000; i++) {
    const aircraft = aircraftTypes[Math.floor(Math.random() * aircraftTypes.length)];
    const model = aircraft.models[Math.floor(Math.random() * aircraft.models.length)];
    const airport = airports[Math.floor(Math.random() * airports.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    const photographer = photographers[Math.floor(Math.random() * photographers.length)];
    const photoId = Math.floor(Math.random() * 1000000);
    
    photos.push({
      id: String(i),
      src: `https://picsum.photos/seed/aircraft${photoId}/800/600`,
      alt: `${model} ${action} yapan ${airport.city} havalimanında`,
      tags: [model, action, airport.city, ...aircraft.tags, Math.random() > 0.5 ? 'Day' : 'Evening'],
      location: airport.name,
      date: randomDate(),
      photographer,
      likes_count: Math.floor(Math.random() * 200),
      views: Math.floor(Math.random() * 1000),
    });
  }
  
  return photos;
}

function randomDate() {
  const start = new Date(2024, 0, 1);
  const end = new Date(2024, 11, 31);
  const random = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return random.toISOString().split('T')[0];
}

export const allAircraftPhotos = [...aircraftGalleryData, ...generateMoreAircraftPhotos()];

