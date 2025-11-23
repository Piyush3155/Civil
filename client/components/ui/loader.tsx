"use client";

import Image from 'next/image';

export default function Loader() {
  return (
    <div className="flex flex-col justify-center items-center min-h-screen">
      <style jsx global>{`
        @keyframes zoomFade {
          0% { opacity: 0.5; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.1); }
          100% { opacity: 0.5; transform: scale(0.9); }
        }
        .helmet-loader {
          animation: zoomFade 2s infinite;
        }
      `}</style>
      <Image
        src="/ios/loader.png"
        alt="Loading..."
        width={128}
        height={128}
        className="helmet-loader"
      />
      <p className="mt-4 text-center text-gray-600">Loading civil engineering insights...</p>
    </div>
  );
}