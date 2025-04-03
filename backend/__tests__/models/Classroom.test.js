const mongoose = require('mongoose');
const Classroom = require('../../models/Classroom');

// Use in-memory MongoDB for testing
beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/test', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});

// Clear test database between tests
afterEach(async () => {
  await Classroom.deleteMany({});
});

describe('Classroom Model Tests', () => {
  it('should create a new classroom successfully', async () => {
    const classroomData = {
      roomNumber: 'NC101',
      type: 'NC',
      capacity: 60,
      floor: 1,
      features: {
        hasProjector: true,
        hasComputers: false,
        hasAC: true,
      },
      isAvailable: true
    };

    const classroom = new Classroom(classroomData);
    const savedClassroom = await classroom.save();

    expect(savedClassroom._id).toBeDefined();
    expect(savedClassroom.roomNumber).toBe('NC101');
    expect(savedClassroom.type).toBe('NC');
    expect(savedClassroom.capacity).toBe(60);
  });

  it('should require department field for LAB type classrooms', async () => {
    const labWithoutDepartment = new Classroom({
      roomNumber: 'LAB101',
      type: 'LAB',
      capacity: 30,
      floor: 1,
      features: {
        hasProjector: true,
        hasComputers: true,
        hasAC: true,
      },
      isAvailable: true
    });

    // This should fail validation because LAB requires department
    await expect(labWithoutDepartment.save()).rejects.toThrow();
  });

  it('should validate room type to be one of allowed values', async () => {
    const classroomWithInvalidType = new Classroom({
      roomNumber: 'INVALID101',
      type: 'INVALID', // Invalid type
      capacity: 40,
      floor: 1,
      isAvailable: true
    });

    await expect(classroomWithInvalidType.save()).rejects.toThrow();
  });

  it('should not allow floor value outside of valid range', async () => {
    const classroomWithInvalidFloor = new Classroom({
      roomNumber: 'NC999',
      type: 'NC',
      capacity: 60,
      floor: 5, // Invalid floor (max is 3)
      isAvailable: true
    });

    await expect(classroomWithInvalidFloor.save()).rejects.toThrow();
  });
});
