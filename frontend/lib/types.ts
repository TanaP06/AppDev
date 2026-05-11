export interface User {
  id: number;
  name: string;
  email: string;
  is_verified: boolean;
  profile_pic: string | null;
  created_at: string;
  avg_rating?: number | null;
  rating_count?: number;
  active_listings_count?: number;
  sold_listings_count?: number;
}

export interface SellerSummary {
  id: number;
  name: string;
  profile_pic: string | null;
  avg_rating: number | null;
  rating_count: number;
}

export type Category = 'books' | 'electronics' | 'furniture' | 'other';
export type Condition = 'new' | 'like_new' | 'used';

export interface Listing {
  id: number;
  seller_id: number;
  title: string;
  description: string | null;
  price: number;
  category: Category;
  item_condition: Condition;
  is_sold: boolean;
  created_at: string;
  images: string[];
  seller: SellerSummary;
}

export interface ListingsResponse {
  items: Listing[];
  page: number;
  per_page: number;
  total: number;
}

export interface Message {
  id: number;
  listing_id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  sent_at: string;
}

export interface Thread {
  listing_id: number;
  listing_title: string;
  listing_image: string | null;
  counterpart: { id: number; name: string; profile_pic: string | null };
  last_message: string;
  last_sent_at: string;
}

export interface Rating {
  id: number;
  reviewer_id: number;
  reviewer_name: string;
  seller_id: number;
  listing_id: number;
  score: number;
  review_text: string | null;
  created_at: string;
}
