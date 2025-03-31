const mongoose = require('mongoose');

const ClassroomSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['NC', 'NR', 'LAB'],
  },
  capacity: {
    type: Number,
    required: true
  },
  department: {
    type: String,
    required: function() {
      return this.type === 'LAB'; // Department is required only for LAB rooms
    }
  },
  floor: {
    type: Number,
    required: true,
    min: 1,
    max: 3
  },
  features: {
    hasProjector: { type: Boolean, default: true },
    hasComputers: { type: Boolean, default: false },
    hasAC: { type: Boolean, default: true }
  },
  isAvailable: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.model('Classroom', ClassroomSchema);
