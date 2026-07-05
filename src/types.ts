export interface Gig {
  id: string;
  title: string;
  description: string;
  budget: number; // in GHS (Ghana Cedis)
  category: string;
  whatsapp: string; // poster's WhatsApp number
  location: string;
  createdAt: string;
  posterName: string;
  duration?: string;
  requirements?: string[];
  customCategory?: string;
  expiresAt?: string; // ISO string indicating expiration time
}

export interface ApplicationFormData {
  name: string;
  message: string;
  experience?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string; // Lucide icon name or emoji
  color: string;
}

export interface LocationOption {
  id: string;
  name: string;
  region: string;
}
