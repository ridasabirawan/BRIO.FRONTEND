"use client";

import { ArrowRight, ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "../ui/button";
import { AnimatedBeamMultipleOutputDemo } from "./animated-beam";
import AnimatedShinyText from "../magicui/animated-shiny-text";

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

export default function HeroSection() {
  return (
    <motion.section
      variants={container}
      initial="hidden"
      animate="show"
      className="relative flex flex-col items-center justify-center leading-6 mt-[3rem] px-4 sm:px-6 lg:px-8"
      aria-label="Brio Hero"
    >
      {/* Hero illustration — the galaxy / jellyfish artwork now lives ONLY here
          (the rest of the app uses the clean purple gradient). Edges are faded
          with a radial mask so it blends into the page background. */}
      <div className="pointer-events-none absolute inset-x-0 -top-24 -z-10 mx-auto h-[680px] w-full max-w-6xl opacity-60 dark:opacity-75 [mask-image:radial-gradient(ellipse_62%_52%_at_50%_42%,black_30%,transparent_78%)]">
        <div
          className="h-full w-full bg-cover bg-center bg-no-repeat dark:hidden"
          style={{ backgroundImage: "url('/brio_bg_white.png')" }}
        />
        <div
          className="hidden h-full w-full bg-cover bg-center bg-no-repeat dark:block"
          style={{ backgroundImage: "url('/brio_bg_black.png')" }}
        />
      </div>

      <motion.div
        variants={item}
        className={
          "mb-4 group rounded-full border border-black/5 bg-neutral-100 text-base text-white transition-all ease-in hover:cursor-pointer hover:bg-neutral-200 dark:border-white/5 dark:bg-neutral-900 dark:hover:bg-neutral-800"
        }
      >
        <AnimatedShinyText className="inline-flex items-center justify-center px-4 py-1 transition ease-out hover:text-neutral-600 hover:duration-300 hover:dark:text-neutral-400">
          <span className="text-sm sm:text-base">✨ Introducing Brio</span>
          <ArrowRightIcon className="ml-1 size-3 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
        </AnimatedShinyText>
      </motion.div>

      <motion.h1
        variants={item}
        className={`text-3xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-5xl max-w-[560px] sm:max-w-[660px] md:max-w-[760px] scroll-m-20 font-semibold tracking-tight text-center`}
      >
        Build and Deploy{" "}
        <span className="text-gradient-animated">Tailored Chatbots</span>{" "}
        Powered by Your Data
      </motion.h1>

      <motion.p
        variants={item}
        className="mx-auto max-w-[90%] sm:max-w-[80%] md:max-w-[700px] text-gray-500 text-center mt-4 text-sm sm:text-base dark:text-gray-400"
      >
        Train chatbots using your PDFs, Word documents, websites, and more.
        Empower them to deliver accurate, data-driven insights tailored to your
        needs.
      </motion.p>

      <motion.div variants={item} className="flex justify-center items-center gap-3 mt-6">
        <Link href="/sign-in">
          <Button
            variant="outline"
            className="glow-hover flex gap-1 text-sm sm:text-base"
          >
            Get Started
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Button>
        </Link>
      </motion.div>

      <motion.div
        variants={item}
        className="relative flex max-w-full sm:max-w-6xl justify-center overflow-hidden mt-8 w-full"
      >
        <AnimatedBeamMultipleOutputDemo />
      </motion.div>
    </motion.section>
  );
}
