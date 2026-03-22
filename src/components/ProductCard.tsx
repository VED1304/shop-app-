import React from 'react';
import { motion } from 'motion/react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onClick: (product: Product) => void;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(product)}
      className="bg-white border border-black/5 rounded-2xl overflow-hidden shadow-sm cursor-pointer"
    >
      <div className="aspect-square relative bg-stone-100">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        {product.stockCount <= 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white font-bold uppercase tracking-widest text-sm">Out of Stock</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="text-[10px] uppercase tracking-widest text-black/40 font-semibold mb-1">
          {product.category}
        </p>
        <h3 className="text-sm font-bold text-black truncate">{product.name}</h3>
        <p className="text-lg font-black mt-2">₹{product.price.toLocaleString()}</p>
      </div>
    </motion.div>
  );
}
