const mockAddImage = jest.fn();
const mockSave = jest.fn();

const jsPDFMock = jest.fn().mockImplementation(() => ({
  addImage: mockAddImage,
  save: mockSave,
  internal: {
    pageSize: {
      getWidth: () => 595.28,
      getHeight: () => 841.89
    }
  }
}));

jsPDFMock.mockAddImage = mockAddImage;
jsPDFMock.mockSave = mockSave;

export default jsPDFMock;
