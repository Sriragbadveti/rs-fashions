import { motion } from "framer-motion";

interface MarqueeProps {
  text: string;
  speed?: number;
}

function Marquee({
  text,
  speed = 22,
}: MarqueeProps) {
  const repeatedText = Array.from(
    { length: 8 },
    () => text
  );

  return (
    <section className="overflow-hidden border-y border-black/[0.07] bg-[#efe8df] py-4">
      <motion.div
        className="flex w-max whitespace-nowrap"
        animate={{
          x: ["0%", "-50%"],
        }}
        transition={{
          duration: speed,
          ease: "linear",
          repeat: Infinity,
        }}
      >
        {[...repeatedText, ...repeatedText].map(
          (item, index) => (
            <span
              key={index}
              className="flex items-center gap-6 px-4 font-display text-xl tracking-wide sm:text-2xl"
            >
              {item}

              <span className="text-[#8e3d51]">
                ✦
              </span>
            </span>
          )
        )}
      </motion.div>
    </section>
  );
}

export default Marquee;
