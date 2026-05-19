export default class jsPDF {
  addImage = jest.fn().mockReturnThis();
  addPage = jest.fn().mockReturnThis();
  output = jest.fn().mockReturnValue(new Blob(['mock pdf'], { type: 'application/pdf' }));
}