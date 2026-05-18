import { motion } from 'framer-motion';

export default function PinDots({ pinLength, maxLength = 6 }: { pinLength: number; maxLength?: number }) {
  return (
    <div className="flex justify-center gap-4 mb-12">
      {Array.from({ length: maxLength }).map((_, i) => (
        <motion.div
          key={i}
          className={`w-4 h-4 rounded-full border-2 transition-colors ${i < pinLength ? 'bg-primary border-primary' : 'border-border bg-transparent'}`}
          initial={false}
          animate={{ scale: i === pinLength - 1 ? 1.2 : 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        />
      ))}
    </div>
  );
}
