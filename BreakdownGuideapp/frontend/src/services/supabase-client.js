// Supabase client configuration
import { createClient } from '@supabase/supabase-js'

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://oieliubbvvdzhzvikzal.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Production table mapping:
// vehicles → fleet_vehicles
// supervisors → users  
// assessment_logs → wizard_progress

// Helper functions for common operations
export const supabaseHelpers = {
  // Breakdown operations
  async createBreakdown(breakdown) {
    const { data, error } = await supabase
      .from('breakdowns')
      .insert(breakdown)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateBreakdown(id, updates) {
    const { data, error } = await supabase
      .from('breakdowns')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getActiveBreakdowns() {
    const { data, error } = await supabase
      .from('breakdowns')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Vehicle operations (updated table name: vehicles → fleet_vehicles)
  async getVehicle(fleetNumber) {
    const { data, error } = await supabase
      .from('fleet_vehicles')
      .select('*')
      .eq('fleet_number', fleetNumber)
      .single()
    
    if (error) throw error
    return data
  },

  async getAllVehicles() {
    const { data, error } = await supabase
      .from('fleet_vehicles')
      .select('*')
      .order('fleet_number')
    
    if (error) throw error
    return data
  },

  async searchVehicles(searchTerm) {
    const { data, error } = await supabase
      .from('fleet_vehicles')
      .select('*')
      .or(`fleet_number.ilike.%${searchTerm}%,registration.ilike.%${searchTerm}%`)
      .order('fleet_number')
    
    if (error) throw error
    return data
  },

  // Assessment logs (updated table name: assessment_logs → wizard_progress)
  async logAssessmentStep(stepData) {
    const { data, error } = await supabase
      .from('wizard_progress')
      .insert(stepData)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // User operations (updated table name: supervisors → users)
  async getUser(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    return data
  },

  async getAllSupervisors() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'supervisor')
      .order('name')
    
    if (error) throw error
    return data
  },

  // Breakdown ID generation
  async generateBreakdownId() {
    const year = new Date().getFullYear()
    
    // Get current count for the year
    const { count, error } = await supabase
      .from('breakdowns')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${year}-01-01`)
      .lt('created_at', `${year + 1}-01-01`)
    
    if (error) throw error
    
    const nextNumber = (count || 0) + 1
    return `BD-${year}-${nextNumber.toString().padStart(5, '0')}`
  }
}

// Export default
export default supabase
