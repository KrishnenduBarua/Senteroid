import React from "react";

const TestSimulation: React.FC = () => {
  const testSimulation = () => {
    // Test the simulation workflow
    console.log("Testing asteroid simulation...");

    // Mock location
    const testLocation = {
      latitude: 40.7128,
      longitude: -74.006,
      populationDensity: 8000,
      cityName: "New York City",
    };

    // Mock asteroid parameters
    const testAsteroid = {
      type: "stony" as const,
      diameter: 100,
      speed: 20,
      angle: 45,
    };

    console.log("Test Location:", testLocation);
    console.log("Test Asteroid:", testAsteroid);

    // This would normally be called by the simulation
    // const physics = new ImpactPhysics();
    // const results = physics.calculateImpact(testAsteroid, testLocation);
    // console.log('Test Results:', results);
  };

  return (
    <div className="p-4 bg-slate-800 text-white rounded">
      <h3 className="text-lg font-bold mb-4">Simulation Test</h3>
      <button
        onClick={testSimulation}
        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
      >
        Test Simulation Logic
      </button>
      <div className="mt-4 text-sm text-gray-300">
        Check browser console for test output
      </div>
    </div>
  );
};

export default TestSimulation;
