import express from 'express';
import { Tab } from '../models/Tab';

const router = express.Router();

// Получить все табулатуры
router.get('/', async (req, res) => {
  try {
    const tabs = await Tab.find().sort({ updatedAt: -1 });
    res.json(tabs);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении табулатур' });
  }
});

// Получить одну табулатуру
router.get('/:id', async (req, res) => {
  try {
    const tab = await Tab.findById(req.params.id);
    if (!tab) {
      return res.status(404).json({ error: 'Табулатура не найдена' });
    }
    res.json(tab);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при получении табулатуры' });
  }
});

// Создать новую табулатуру
router.post('/', async (req, res) => {
  try {
    const tab = new Tab({
      ...req.body,
      updatedAt: new Date(),
    });
    await tab.save();
    res.status(201).json(tab);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при создании табулатуры' });
  }
});

// Обновить табулатуру
router.put('/:id', async (req, res) => {
  try {
    const tab = await Tab.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!tab) {
      return res.status(404).json({ error: 'Табулатура не найдена' });
    }
    res.json(tab);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при обновлении табулатуры' });
  }
});

// Удалить табулатуру
router.delete('/:id', async (req, res) => {
  try {
    const tab = await Tab.findByIdAndDelete(req.params.id);
    if (!tab) {
      return res.status(404).json({ error: 'Табулатура не найдена' });
    }
    res.json({ message: 'Табулатура удалена' });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка при удалении табулатуры' });
  }
});

export default router;