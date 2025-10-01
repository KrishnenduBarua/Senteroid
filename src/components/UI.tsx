import React from "react";

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

export const Section: React.FC<SectionProps> = ({ title, children }) => {
  return (
    <section className="mb-6 p-4 rounded-lg">
      <h2 className="text-lg font-bold mb-2">{title}</h2>
      {children}
    </section>
  );
};
