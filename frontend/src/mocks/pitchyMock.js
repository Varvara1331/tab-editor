module.exports = {
  PitchDetector: jest.fn().mockImplementation(() => ({
    findPitch: jest.fn((data) => {
      // Mock implementation that returns frequency and clarity
      const mockFrequency = global.mockFrequency || 440;
      const mockClarity = global.mockClarity || 0.95;
      return { freq: mockFrequency, clarity: mockClarity };
    })
  }))
};
