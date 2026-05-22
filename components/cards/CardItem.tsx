"use client";
import { Card } from '../../store/db';
import CardVisual from './CardVisual';
import { motion } from 'framer-motion';
import { useUiStore } from '../../store/uiStore';

export default function CardItem({ card }: { card: Card }) {
  const { openSheet } = useUiStore();

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -6, scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={() => openSheet('cardDetail', card.id)}
      className="cursor-pointer"
    >
      <CardVisual card={card} />
    </motion.div>
  );
}
