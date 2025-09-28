import React from "react";

const creators = [
  {
    name: "Sujay Babu Thota",
    role: "Full-Stack Developer",
    description: "Built and designed the website with modern UI and backend integrations.",
    image: "https://via.placeholder.com/150", // replace with real photo
  },
  {
    name: "Teammate 1",
    role: "UI/UX Designer",
    description: "Worked on crafting intuitive user interfaces and smooth user experiences.",
    image: "https://via.placeholder.com/150",
  },
  {
    name: "Teammate 2",
    role: "Backend Engineer",
    description: "Implemented secure APIs and database management for the project.",
    image: "https://via.placeholder.com/150",
  },
];

export default function CreatorsPage() {
  return (
    <div className="min-h-screen bg-[#0a192f] text-white px-6 py-12">
      <h1 className="text-4xl font-bold text-center mb-12">Meet the Creators</h1>
      <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 max-w-6xl mx-auto">
        {creators.map((creator, index) => (
          <div
            key={index}
            className="bg-gray-800 p-6 rounded-2xl shadow-lg hover:scale-105 transform transition duration-300"
          >
            <img
              src={creator.image}
              alt={creator.name}
              className="w-32 h-32 object-cover rounded-full mx-auto mb-4 border-4 border-white"
            />
            <h2 className="text-xl font-semibold text-center">{creator.name}</h2>
            <p className="text-gray-400 text-center">{creator.role}</p>
            <p className="mt-3 text-sm text-gray-300 text-center">{creator.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
