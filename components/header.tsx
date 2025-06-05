"use client";

import Image from "next/image";
// import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo and App Name */}
          <div className="flex items-center">
            {/*<Link href="/" className="flex items-center space-x-2">*/}
              <Image 
                src="/tensora_logo.png" 
                alt="Tensora Logo" 
                width={100} 
                height={100}
                className="h-auto"
              />
              <span className="font-semibold text-xl text-tensora-dark">Count</span>
            {/*</Link>*/}
          </div>
        </div>
      </div>
    </header>
  );
}