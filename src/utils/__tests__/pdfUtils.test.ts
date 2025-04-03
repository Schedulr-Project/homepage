// Jest mock declarations must come first, before any imports
jest.mock('html2canvas');
jest.mock('jspdf', () => {
  const mockAddImage = jest.fn();
  const mockSave = jest.fn();
  const mockGetImageProperties = jest.fn().mockReturnValue({
    width: 1000,
    height: 500
  });

  // Create a constructor function mock
  const mockConstructor = jest.fn().mockImplementation(() => ({
    addImage: mockAddImage,
    save: mockSave,
    getImageProperties: mockGetImageProperties,
    internal: {
      pageSize: {
        getWidth: () => 595.28,
        getHeight: () => 841.89
      }
    }
  }));

  // Attach the mock functions to the constructor for test access
  (mockConstructor as any).mockAddImage = mockAddImage;
  (mockConstructor as any).mockSave = mockSave;

  return mockConstructor;
});

// Now import modules and the function being tested
import { generatePDF } from '../pdfUtils';
import html2canvas from 'html2canvas';

describe('PDF Generation Utils', () => {
  let testElement: HTMLElement;
  let mockAddImage: jest.Mock;
  let mockSave: jest.Mock;

  beforeEach(() => {
    // Create test element
    testElement = document.createElement('div');
    testElement.id = 'test-element';
    document.body.appendChild(testElement);

    // Get mock functions directly from the jsPDF mock
    const jsPDFMock = jest.requireMock('jspdf');
    mockAddImage = jsPDFMock.mockAddImage;
    mockSave = jsPDFMock.mockSave;

    // Mock html2canvas to return a canvas-like object
    (html2canvas as jest.Mock).mockResolvedValue({
      width: 1000,
      height: 500,
      toDataURL: jest.fn().mockReturnValue('data:image/png;base64,test')
    });
  });

  afterEach(() => {
    document.body.removeChild(testElement);
    jest.clearAllMocks();
  });

  it('should call html2canvas with correct arguments', async () => {
    await generatePDF(testElement, 'test.pdf');

    expect(html2canvas).toHaveBeenCalledWith(
      testElement,
      expect.objectContaining({ scale: 1.5 })
    );
  });

  it('should properly create and save PDF', async () => {
    await generatePDF(testElement, 'test.pdf');

    expect(mockAddImage).toHaveBeenCalled();
    expect(mockSave).toHaveBeenCalledWith('test.pdf');
  });
});
