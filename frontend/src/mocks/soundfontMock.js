module.exports = {
  default: {
    instrument: jest.fn().mockResolvedValue({
      play: jest.fn(),
      stop: jest.fn(),
      on: jest.fn()
    })
  }
};
