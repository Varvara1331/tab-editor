import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import tabsRouter from './routes/tabs';

const app = express();
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tab-editor';

app.use(cors());
app.use(express.json());

app.use('/api/tabs', tabsRouter);

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });