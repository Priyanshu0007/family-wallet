"use client";
import { useState } from 'react';
import { Card } from '../../store/db';
import CardVisual from './CardVisual';
import { motion, AnimatePresence } from 'framer-motion';
import { useUiStore } from '../../store/uiStore';

export default function CardItem({ card }: { card: Card }) {
  const { openSheet } = useUiStore();

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => openSheet('cardDetail', card.id)}
      className="cursor-pointer"
    >
      <CardVisual card={card} />
    </motion.div>
  );
}
