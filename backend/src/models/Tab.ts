import mongoose from 'mongoose';

const NoteSchema = new mongoose.Schema({
  fret: Number,
  bend: Boolean,
  slide: String,
  hammer: Boolean,
  pull: Boolean,
  vibrato: Boolean,
  duration: Number,
});

const TabStringSchema = new mongoose.Schema({
  stringNumber: Number,
  notes: [NoteSchema],
});

const TabMeasureSchema = new mongoose.Schema({
  id: String,
  strings: [TabStringSchema],
  tempo: Number,
  timeSignature: [Number],
});

const TabSchema = new mongoose.Schema({
  title: { type: String, required: true },
  artist: String,
  tuning: [String],
  measures: [TabMeasureSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const Tab = mongoose.model('Tab', TabSchema);