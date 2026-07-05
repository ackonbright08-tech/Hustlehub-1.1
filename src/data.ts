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

export const INITIAL_GIGS: Gig[] = [];
