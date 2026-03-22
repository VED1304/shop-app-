export interface User {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'customer';
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrl: string;
  stockCount: number;
  description: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  createdAt: string;
}

export interface StockUpdate {
  id: string;
  message: string;
  createdAt: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
