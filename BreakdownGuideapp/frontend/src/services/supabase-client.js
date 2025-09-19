// Supabase client configuration
import { createClient } from '@supabase/supabase-js'

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://oieliubbvvdzhzvikzal.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pZWxpdWJidnZkemh6dmlremFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1NTA5OTUsImV4cCI6MjA3MTEyNjk5NX0.L0qUXBFOnzxoXt-ChhMAW8zqgprUXFdvqR2dxJ1GTU8'

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Production table mapping:
// vehicles → fleet_vehicles
// supervisors → supervisors (email authentication only)
// assessment_logs → wizard_progress

// Authentication helpers
export const authHelpers = {
  // Sign in with email/password
  async signInWithPassword(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    
    // Get supervisor details after successful auth
    if (data.user) {
      const supervisor = await this.getSupervisorByEmail(data.user.email)
      return { user: data.user, supervisor, session: data.session }
    }
    
    return data
  },

  // Get current session
  async getCurrentSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    
    if (session) {
      const supervisor = await this.getSupervisorByEmail(session.user.email)
      return { session, supervisor }
    }
    
    return { session: null, supervisor: null }
  },

  // Get supervisor by email
  async getSupervisorByEmail(email) {
    const { data, error } = await supabase
      .from('supervisors')
      .select('*')
      .eq('email', email)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error // PGRST116 = not found
    return data
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // Listen to auth changes
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

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

  // Supervisor operations
  async getSupervisor(supervisorId) {
    const { data, error } = await supabase
      .from('supervisors')
      .select('*')
      .eq('id', supervisorId)
      .single()
    
    if (error) throw error
    return data
  },

  async getAllSupervisors() {
    const { data, error } = await supabase
      .from('supervisors')
      .select('*')
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
