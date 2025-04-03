// Mock window.alert
window.alert = jest.fn();

// Mock canvas
const mockCanvas = {
  getContext: () => ({
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    getImageData: jest.fn(),
    putImageData: jest.fn(),
    createImageData: jest.fn(),
    setTransform: jest.fn(),
    drawImage: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    scale: jest.fn(),
    rotate: jest.fn(),
    translate: jest.fn(),
    transform: jest.fn(),
    fill: jest.fn(),
    stroke: jest.fn()
  }),
  toDataURL: jest.fn().mockReturnValue('data:image/png;base64,test'),
  width: 1000,
  height: 500
};

HTMLCanvasElement.prototype.getContext = function() {
  return mockCanvas.getContext();
};

HTMLCanvasElement.prototype.toDataURL = mockCanvas.toDataURL;
