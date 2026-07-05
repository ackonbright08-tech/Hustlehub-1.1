import { Gig, Category, LocationOption } from "./types";

export const CATEGORIES: Category[] = [
  { id: "all", name: "All Gigs", icon: "Briefcase", color: "bg-teal-50 text-teal-800 border-teal-200" },
  { id: "tech", name: "Tech & Social Media", icon: "Laptop", color: "bg-blue-50 text-blue-800 border-blue-200" },
  { id: "delivery", name: "Delivery & Transit", icon: "Truck", color: "bg-orange-50 text-orange-800 border-orange-200" },
  { id: "handywork", name: "Handywork & Repair", icon: "Wrench", color: "bg-purple-50 text-purple-800 border-purple-200" },
  { id: "fashion", name: "Fashion & Hair", icon: "Scissors", color: "bg-pink-50 text-pink-800 border-pink-200" },
  { id: "tutoring", name: "Teaching & Writing", icon: "GraduationCap", color: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  { id: "agriculture", name: "Agric & Garden", icon: "Sprout", color: "bg-amber-50 text-amber-800 border-amber-200" },
  { id: "other", name: "Other / Custom", icon: "Sliders", color: "bg-neutral-800/80 text-teal-300 border-teal-900" },
];

export const LOCATIONS: LocationOption[] = [
  { id: "accra-east", name: "East Legon, Accra", region: "Greater Accra" },
  { id: "accra-osu", name: "Osu, Accra", region: "Greater Accra" },
  { id: "accra-dansoman", name: "Dansoman, Accra", region: "Greater Accra" },
  { id: "kumasi-central", name: "Kumasi Central, Ashanti", region: "Ashanti" },
  { id: "tema-25", name: "Tema Community 25", region: "Greater Accra" },
  { id: "takoradi-market", name: "Takoradi Market Circle", region: "Western" },
  { id: "tamale", name: "Tamale Centre", region: "Northern" },
  { id: "koforidua", name: "Koforidua Town", region: "Eastern" },
  { id: "other", name: "Other / Custom", region: "Any Region" },
];

export const INITIAL_GIGS: Gig[] = [
  {
    id: "gig-1",
    title: "Urgent Dispatch Rider Needed",
    description: "We are looking for an experienced motorbike rider to deliver food orders from our kitchen in Osu to customers in Cantonments and Labone. Must have a valid rider's license, a smartphone with active GPS, and be very polite.",
    budget: 150,
    category: "delivery",
    whatsapp: "233244123456",
    location: "Osu, Accra",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
    posterName: "ChopTime Kitchen",
    duration: "1 Day (Flexible)",
    requirements: ["Valid license A", "Familiarity with Accra roads", "Has own helmet"]
  },
  {
    id: "gig-2",
    title: "WordPress Web Designer for Boutique",
    description: "I need a freelance designer to set up a clean, modern online catalog for my fashion boutique in East Legon. I already bought the domain and hosting; just need you to install the theme, set up 20 products, and link my WhatsApp and Instagram links.",
    budget: 1800,
    category: "tech",
    whatsapp: "233553987654",
    location: "East Legon, Accra",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hours ago
    posterName: "Kente Glamour Boutique",
    duration: "5 Days",
    requirements: ["WordPress expertise", "Boutique portfolio", "Good communication"]
  },
  {
    id: "gig-3",
    title: "BECE Prep Mathematics Tutor",
    description: "Looking for an energetic math tutor to guide my junior high school ward through past BECE questions for 3 weeks before the exams. Classes will hold three times a week (Tues, Thurs, Sat) at our home in Tema.",
    budget: 800,
    category: "tutoring",
    whatsapp: "233201112223",
    location: "Tema Community 25",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
    posterName: "Mr. Kwabena Mensah",
    duration: "3 Weeks",
    requirements: ["Maths teaching experience", "Patience with children", "BECE syllabus master"]
  },
  {
    id: "gig-4",
    title: "Hair Braider for Wedding Party",
    description: "Need an expert bridal hairstylist and braider to assist with styling 5 bridesmaids on Saturday morning in Kumasi. We need neat, identical cornrows/updos. Photos of previous work will be requested on WhatsApp.",
    budget: 1200,
    category: "fashion",
    whatsapp: "233547890123",
    location: "Kumasi Central, Ashanti",
    createdAt: new Date(Date.now() - 3600000 * 30).toISOString(), // ~1.5 days ago
    posterName: "De-Graft Bridal Agency",
    duration: "Half Day (Saturday)",
    requirements: ["Excellent braiding speed", "Punctuality is a MUST", "Own styling tools"]
  },
  {
    id: "gig-5",
    title: "Air Conditioner Maintenance & Gas Refill",
    description: "Two split AC units in our office are not cooling well and need full servicing, cleaning, and chemical washing. Likely needs a R410 refrigerant top-up. Looking for a certified HVAC technician.",
    budget: 450,
    category: "handywork",
    whatsapp: "233249001122",
    location: "Osu, Accra",
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(), // 2 days ago
    posterName: "Oasis Hub Office",
    duration: "One-time (2-3 hrs)",
    requirements: ["HVAC Certification", "Has own AC manifold gauge", "Invoice receipt"]
  },
  {
    id: "gig-6",
    title: "Cocoa Saplings Planting Assistant",
    description: "Looking for two energetic workers to help transplant young cocoa saplings into rows on our organic farm near Koforidua. Farm tools, boots, protective wear, and lunch will be provided.",
    budget: 350,
    category: "agriculture",
    whatsapp: "233275432109",
    location: "Koforidua Town",
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(), // 3 days ago
    posterName: "Asante Farms Ltd",
    duration: "2 Days",
    requirements: ["Physical stamina", "Willingness to learn", "Hard working"]
  }
];
