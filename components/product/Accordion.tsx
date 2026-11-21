"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

export default function Accordion({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className={`accordion${open ? " is-open" : ""}`}>
      <button className="accordion__head serif" aria-expanded={open} aria-controls={id} onClick={() => setOpen((v) => !v)}>
        <span>{title}</span>
        <span className="accordion__icon" aria-hidden="true" />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={id}
            className="accordion__body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="accordion__inner serif">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
