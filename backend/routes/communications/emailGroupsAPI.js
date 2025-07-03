import express from 'express';
import { EmailGroupService } from '../../services/communications/emailGroupService.js';

const router = express.Router();
const emailGroupService = new EmailGroupService();

// Get all email groups
router.get('/', async (req, res) => {
  try {
    const groups = await emailGroupService.getAllGroups();
    res.json({ success: true, data: groups });
  } catch (error) {
    console.error('❌ Error fetching email groups:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single email group
router.get('/:id', async (req, res) => {
  try {
    const group = await emailGroupService.getGroup(req.params.id);
    if (!group) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }
    res.json({ success: true, data: group });
  } catch (error) {
    console.error('❌ Error fetching email group:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create email group
router.post('/', async (req, res) => {
  try {
    const { name, description, members, isActive } = req.body;
    
    if (!name || !members || !Array.isArray(members)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name and members array are required' 
      });
    }

    const group = await emailGroupService.createGroup({
      name,
      description,
      members,
      isActive: isActive ?? true
    });

    res.status(201).json({ success: true, data: group });
  } catch (error) {
    console.error('❌ Error creating email group:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update email group
router.put('/:id', async (req, res) => {
  try {
    const updated = await emailGroupService.updateGroup(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('❌ Error updating email group:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete email group
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await emailGroupService.deleteGroup(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }
    res.json({ success: true, message: 'Group deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting email group:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add member to group
router.post('/:id/members', async (req, res) => {
  try {
    const { email, name } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email is required' 
      });
    }

    const updated = await emailGroupService.addMember(req.params.id, { email, name });
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('❌ Error adding member:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Remove member from group
router.delete('/:id/members/:email', async (req, res) => {
  try {
    const updated = await emailGroupService.removeMember(
      req.params.id, 
      decodeURIComponent(req.params.email)
    );
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('❌ Error removing member:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
