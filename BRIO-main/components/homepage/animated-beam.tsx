"use client";

import React, { forwardRef, useRef } from "react";
import Image from "next/image";
import { Type, User } from "lucide-react";

import { cn } from "@/lib/utils";
import { AnimatedBeam } from "../ui/animated-beam";

const Circle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "z-10 flex size-14 items-center justify-center rounded-full border-2 border-border bg-white dark:bg-[linear-gradient(110deg,#000103,45%,#1e2631,55%,#000103)] bg-[length:200%_100%] transition-colors p-3 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]",
        className
      )}
    >
      {children}
    </div>
  );
});

Circle.displayName = "Circle";

export function AnimatedBeamMultipleOutputDemo({
  className,
}: {
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const div1Ref = useRef<HTMLDivElement>(null);
  const div2Ref = useRef<HTMLDivElement>(null);
  const div3Ref = useRef<HTMLDivElement>(null);
  const div4Ref = useRef<HTMLDivElement>(null);
  const div5Ref = useRef<HTMLDivElement>(null);
  const div6Ref = useRef<HTMLDivElement>(null);
  const div7Ref = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex h-[350px] w-full items-center justify-center overflow-hidden mb-[2rem] z-10",
        className
      )}
    >
      <div className="flex size-full flex-row items-stretch justify-between gap-10 max-w-xl">
        <div className="flex flex-col justify-center gap-2">
          <Circle ref={div1Ref}>
            <Icons.pdf />
          </Circle>

          <Circle ref={div2Ref}>
            <Icons.googleDocs />
          </Circle>

          <Circle ref={div3Ref}>
            <Icons.www />
          </Circle>

          <Circle ref={div4Ref}>
            <Icons.csv />
          </Circle>

          <Circle ref={div5Ref}>
            <Icons.text />
          </Circle>
        </div>

        <div className="flex flex-col justify-center">
          <Circle ref={div6Ref} className="size-16">
            <Image
              src="/brio-logo.png"
              alt="BRIO.CHAT Logo"
              width={100}
              height={100}
            />
          </Circle>
        </div>

        <div className="flex flex-col justify-center">
          <Circle ref={div7Ref}>
            <Icons.user />
          </Circle>
        </div>
      </div>

      <AnimatedBeam
        containerRef={containerRef as React.RefObject<HTMLElement>}
        fromRef={div1Ref as React.RefObject<HTMLElement>}
        toRef={div6Ref as React.RefObject<HTMLElement>}
      />

      <AnimatedBeam
        containerRef={containerRef as React.RefObject<HTMLElement>}
        fromRef={div2Ref as React.RefObject<HTMLElement>}
        toRef={div6Ref as React.RefObject<HTMLElement>}
      />

      <AnimatedBeam
        containerRef={containerRef as React.RefObject<HTMLElement>}
        fromRef={div3Ref as React.RefObject<HTMLElement>}
        toRef={div6Ref as React.RefObject<HTMLElement>}
      />

      <AnimatedBeam
        containerRef={containerRef as React.RefObject<HTMLElement>}
        fromRef={div4Ref as React.RefObject<HTMLElement>}
        toRef={div6Ref as React.RefObject<HTMLElement>}
      />

      <AnimatedBeam
        containerRef={containerRef as React.RefObject<HTMLElement>}
        fromRef={div5Ref as React.RefObject<HTMLElement>}
        toRef={div6Ref as React.RefObject<HTMLElement>}
      />

      <AnimatedBeam
        containerRef={containerRef as React.RefObject<HTMLElement>}
        fromRef={div6Ref as React.RefObject<HTMLElement>}
        toRef={div7Ref as React.RefObject<HTMLElement>}
      />
    </div>
  );
}

const Icons = {
  pdf: () => (
    <Image
      src="/pdf.png"
      alt="PDF"
      width={100}
      height={100}
      className="h-full w-full"
    />
  ),

  www: () => (
    <Image
      src="/www.png"
      alt="Website"
      width={100}
      height={100}
      className="h-full w-full"
    />
  ),

  googleDocs: () => (
    <svg
      viewBox="0 0 47 65"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
    >
      <path
        d="M29.375 0H4.406C1.983 0 0 1.994 0 4.432v56.136C0 63.006 1.983 65 4.406 65h38.188C45.017 65 47 63.006 47 60.568V17.727L29.375 0Z"
        fill="#4285F4"
      />
      <path
        d="M29.375 0v13.295c0 2.449 1.972 4.432 4.406 4.432H47L29.375 0Z"
        fill="#A1C2FA"
      />
      <path
        d="M11.75 32.5h23.5v2.955h-23.5V32.5Zm0 5.91h23.5v2.954h-23.5V38.41Zm0 5.908h23.5v2.955h-23.5v-2.955Zm0 5.91h17.625v2.954H11.75v-2.954Z"
        fill="#F1F1F1"
      />
    </svg>
  ),

  text: () => <Type className="text-purple-600" />,

  csv: () => (
    <Image
      src="/csv.png"
      alt="CSV"
      width={150}
      height={150}
      className="h-7 w-5"
    />
  ),

  user: () => <User />,
};