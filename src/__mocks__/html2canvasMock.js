const html2canvas = jest.fn().mockResolvedValue({
  width: 1000,
  height: 500,
  toDataURL: () => 'data:image/png;base64,test'
});

export default html2canvas;
