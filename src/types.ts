export interface Member {
  id: string;
  fullName: string;
  fatherName: string;
  dob: string;
  gender: string;
  address: string;
  mobileNumber: string;
  email: string;
  country: string;
  passportNumber?: string;
  occupation: string;
  photoUrl: string; // Base64 or storage url
  citizenshipUrl: string; // Base64 or storage url
  bloodGroup: string;
  joinDate: string;
  status: 'pending' | 'approved' | 'suspended';
  membershipId?: string; // e.g. SMYC-2026-001
  createdAt: string;
}

export interface Contribution {
  id: string;
  memberId: string;
  memberName: string;
  amount: number; // e.g. 10 Riyals
  month: string; // e.g. "January", "Asar"
  year: number; // e.g. 2026
  datePaid: string;
  status: 'paid' | 'unpaid' | 'due';
  paymentMethod?: string;
  transactionId?: string;
}

export interface Meeting {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string;
  venue: string;
  agenda: string;
  minutes?: string;
  attendance: string[]; // List of member IDs who attended
  status: 'upcoming' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface Notice {
  id: string;
  title: string;
  description: string;
  category: 'notice' | 'news' | 'event' | 'emergency';
  date: string;
  imageUrl?: string;
  postedBy: string;
}

export interface Suggestion {
  id: string;
  senderName: string;
  senderContact: string;
  messageType: 'suggestion' | 'complaint' | 'feedback';
  details: string;
  date: string;
  status: 'pending' | 'reviewed';
}

export interface SocialService {
  id: string;
  title: string;
  description: string;
  category: 'financial_support' | 'emergency_assistance' | 'temple_service' | 'community_service' | 'awareness';
  date: string;
  imageUrl?: string;
  videoUrl?: string;
}

export interface GalleryItem {
  id: string;
  imageUrl: string;
  description: string;
  date: string;
  albumName: string;
}
