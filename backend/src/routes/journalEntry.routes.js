import express from 'express';
import { accountingService } from '../services/accounting.service.js';

const router = express.Router();

// Get all journal entries
router.get('/', async (req, res) => {
  try {
    const entries = await accountingService.getAllJournalEntries();
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get journal entry by ID
router.get('/:id', async (req, res) => {
  try {
    const entry = await accountingService.getJournalEntryById(
      parseInt(req.params.id)
    );

    if (!entry) {
      return res.status(404).json({ error: 'Journal Entry not found' });
    }

    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const entry = await accountingService.updateJournalEntry(
      parseInt(req.params.id),
      req.body
    );
    res.json(entry);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
