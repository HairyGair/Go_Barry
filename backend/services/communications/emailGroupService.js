// backend/services/communications/emailGroupService.js
// Email group management service for Go BARRY communications

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class EmailGroupService {
  constructor() {
    this.dataPath = path.join(__dirname, '../../data/emailGroups.json');
    this.groups = [];
    this.loadGroups();
  }

  async loadGroups() {
    try {
      const data = await fs.readFile(this.dataPath, 'utf-8');
      this.groups = JSON.parse(data);
    } catch (error) {
      console.log('📧 No existing email groups found, creating new file');
      this.groups = this.getDefaultGroups();
      await this.saveGroups();
    }
  }

  async saveGroups() {
    try {
      await fs.writeFile(this.dataPath, JSON.stringify(this.groups, null, 2));
    } catch (error) {
      console.error('❌ Error saving email groups:', error);
      throw error;
    }
  }

  getDefaultGroups() {
    return [
      {
        id: 'depot-managers',
        name: 'Depot Managers',
        description: 'All depot managers across Go North East',
        members: [
          { email: 'percy.main@gonortheast.co.uk', name: 'Percy Main Depot' },
          { email: 'washington@gonortheast.co.uk', name: 'Washington Depot' },
          { email: 'gateshead@gonortheast.co.uk', name: 'Gateshead Depot' },
          { email: 'consett@gonortheast.co.uk', name: 'Consett Depot' },
          { email: 'hexham@gonortheast.co.uk', name: 'Hexham Depot' }
        ],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'operations-team',
        name: 'Operations Team',
        description: 'Operations supervisors and coordinators',
        members: [
          { email: 'operations@gonortheast.co.uk', name: 'Operations Main' },
          { email: 'supervisor1@gonortheast.co.uk', name: 'Supervisor 1' },
          { email: 'supervisor2@gonortheast.co.uk', name: 'Supervisor 2' }
        ],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'emergency-contacts',
        name: 'Emergency Contacts',
        description: 'Critical incident notification list',
        members: [
          { email: 'emergency@gonortheast.co.uk', name: 'Emergency Response' },
          { email: 'control@gonortheast.co.uk', name: 'Control Room' },
          { email: 'management@gonortheast.co.uk', name: 'Senior Management' }
        ],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'driver-comms',
        name: 'Driver Communications',
        description: 'Driver updates and notifications',
        members: [
          { email: 'drivers@gonortheast.co.uk', name: 'Drivers List' },
          { email: 'driver-support@gonortheast.co.uk', name: 'Driver Support' }
        ],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }

  async getAllGroups() {
    await this.loadGroups();
    return this.groups.filter(g => g.isActive);
  }

  async getActiveGroups() {
    return this.getAllGroups();
  }

  async getGroup(id) {
    await this.loadGroups();
    return this.groups.find(g => g.id === id);
  }

  async createGroup(groupData) {
    await this.loadGroups();
    
    const newGroup = {
      id: this.generateId(groupData.name),
      ...groupData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.groups.push(newGroup);
    await this.saveGroups();
    
    console.log(`✅ Created email group: ${newGroup.name}`);
    return newGroup;
  }

  async updateGroup(id, updates) {
    await this.loadGroups();
    
    const index = this.groups.findIndex(g => g.id === id);
    if (index === -1) return null;

    this.groups[index] = {
      ...this.groups[index],
      ...updates,
      id: this.groups[index].id, // Prevent ID changes
      createdAt: this.groups[index].createdAt, // Preserve creation date
      updatedAt: new Date().toISOString()
    };

    await this.saveGroups();
    console.log(`✅ Updated email group: ${this.groups[index].name}`);
    return this.groups[index];
  }

  async deleteGroup(id) {
    await this.loadGroups();
    
    const index = this.groups.findIndex(g => g.id === id);
    if (index === -1) return false;

    const deletedGroup = this.groups.splice(index, 1)[0];
    await this.saveGroups();
    
    console.log(`🗑️ Deleted email group: ${deletedGroup.name}`);
    return true;
  }

  async addMember(groupId, member) {
    await this.loadGroups();
    
    const group = this.groups.find(g => g.id === groupId);
    if (!group) return null;

    // Check if member already exists
    if (group.members.some(m => m.email === member.email)) {
      throw new Error('Member already exists in this group');
    }

    group.members.push({
      email: member.email,
      name: member.name || member.email,
      addedAt: new Date().toISOString()
    });

    group.updatedAt = new Date().toISOString();
    await this.saveGroups();
    
    console.log(`✅ Added ${member.email} to group ${group.name}`);
    return group;
  }

  async removeMember(groupId, email) {
    await this.loadGroups();
    
    const group = this.groups.find(g => g.id === groupId);
    if (!group) return null;

    const memberIndex = group.members.findIndex(m => m.email === email);
    if (memberIndex === -1) {
      throw new Error('Member not found in this group');
    }

    group.members.splice(memberIndex, 1);
    group.updatedAt = new Date().toISOString();
    await this.saveGroups();
    
    console.log(`✅ Removed ${email} from group ${group.name}`);
    return group;
  }

  generateId(name) {
    return name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') + 
      '-' + Date.now().toString(36);
  }

  // Get all unique email addresses across all groups
  async getAllUniqueEmails() {
    await this.loadGroups();
    
    const emailSet = new Set();
    this.groups
      .filter(g => g.isActive)
      .forEach(group => {
        group.members.forEach(member => {
          emailSet.add(member.email);
        });
      });
    
    return Array.from(emailSet);
  }

  // Get groups containing a specific email
  async getGroupsByEmail(email) {
    await this.loadGroups();
    
    return this.groups.filter(group => 
      group.isActive && 
      group.members.some(member => member.email === email)
    );
  }
}

export default EmailGroupService;