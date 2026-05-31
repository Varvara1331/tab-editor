module.exports = {
  getContext: jest.fn(() => ({
    resume: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
    state: 'running'
  })),
  setContext: jest.fn(),
  start: jest.fn().mockResolvedValue(undefined),
  Transport: {
    start: jest.fn(),
    stop: jest.fn(),
    pause: jest.fn(),
    position: 0,
    schedule: jest.fn(),
    cancel: jest.fn(),
    seconds: 0,
    bpm: { value: 120 }
  },
  Draw: {
    schedule: jest.fn()
  },
  Sampler: jest.fn().mockImplementation(() => ({
    toDestination: jest.fn(),
    triggerAttackRelease: jest.fn(),
    dispose: jest.fn(),
    connect: jest.fn(),
    setNote: jest.fn(),
    releaseAll: jest.fn()
  })),
  Synth: jest.fn().mockImplementation(() => ({
    toDestination: jest.fn(),
    triggerAttackRelease: jest.fn(),
    dispose: jest.fn()
  })),
  PolySynth: jest.fn().mockImplementation(() => ({
    toDestination: jest.fn(),
    triggerAttackRelease: jest.fn(),
    dispose: jest.fn()
  })),
  now: jest.fn(() => 0),
  Destination: {
    volume: { value: 0, rampTo: jest.fn() }
  }
};
