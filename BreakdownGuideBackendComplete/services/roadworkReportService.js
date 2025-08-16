/**
 * Roadwork Report Generation Service
 * Generates automated Start of Service reports and other roadwork analytics
 * © 2024-2025 Anthony Gair. All rights reserved.
 */

import { createClient } from '@supabase/supabase-js';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import cron from 'node-cron';
import nodemailer from 'nodemailer';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Email transporter configuration
const emailTransporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * Initialize scheduled report generation
 * Runs daily at 00:15 (15 minutes past midnight)
 */
export function initializeReportScheduler() {
  console.log('📅 Initializing roadwork report scheduler...');
  
  // Schedule daily report at 00:15
  cron.schedule('15 0 * * *', async () => {
    console.log('🌅 Generating Start of Service report...');
    await generateAndSendDailyReport();
  }, {
    timezone: 'Europe/London'
  });
  
  // Schedule weekly summary on Sundays at 08:00
  cron.schedule('0 8 * * 0', async () => {
    console.log('📊 Generating weekly roadwork summary...');
    await generateWeeklySummary();
  }, {
    timezone: 'Europe/London'
  });
  
  console.log('✅ Report scheduler initialized successfully');
}

/**
 * Generate and send daily Start of Service report
 */
export async function generateAndSendDailyReport() {
  try {
    console.log('📋 Generating Start of Service report...');
    
    // Get active roadworks with diversions
    const { data: activeRoadworks, error: roadworksError } = await supabase
      .from('streetworks')
      .select(`
        *,
        diversion_templates!inner(*)
      `)
      .in('status', ['approved', 'monitoring', 'active'])
      .not('diversion_id', 'is', null)
      .order('severity', { ascending: false })
      .order('sm_start_date', { ascending: true });
    
    if (roadworksError) throw roadworksError;
    
    // Get recently completed roadworks (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const { data: completedRoadworks, error: completedError } = await supabase
      .from('streetworks')
      .select('*')
      .eq('status', 'completed')
      .gte('updated_at', yesterday.toISOString())
      .order('updated_at', { ascending: false });
    
    if (completedError) throw completedError;
    
    // Generate PDF
    const pdfBuffer = await generateStartOfServicePDF(activeRoadworks || [], completedRoadworks || []);
    
    // Save PDF to file system
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `start-of-service-${timestamp}.pdf`;
    const filepath = path.join(process.cwd(), 'reports', filename);
    
    // Ensure reports directory exists
    const reportsDir = path.dirname(filepath);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    fs.writeFileSync(filepath, pdfBuffer);
    
    // Send via email
    await sendReportEmail(pdfBuffer, filename, 'Start of Service Report');
    
    // Log successful generation
    await logReportGeneration('daily_start_of_service', {
      filename,
      activeRoadworks: activeRoadworks?.length || 0,
      completedRoadworks: completedRoadworks?.length || 0
    });
    
    console.log(`✅ Start of Service report generated and sent: ${filename}`);
    
    return {
      success: true,
      filename,
      activeCount: activeRoadworks?.length || 0,
      completedCount: completedRoadworks?.length || 0
    };
    
  } catch (error) {
    console.error('Error generating daily report:', error);
    
    // Send error notification
    await sendErrorNotification('Daily Report Generation Failed', error.message);
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Generate Start of Service PDF document
 */
async function generateStartOfServicePDF(activeRoadworks, completedRoadworks) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });
    
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers);
      resolve(pdfBuffer);
    });
    
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const timeStr = now.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Header
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .text('GO NORTH EAST', { align: 'center' });
    
    doc.fontSize(18)
       .font('Helvetica')
       .text('START OF SERVICE REPORT', { align: 'center' });
    
    doc.fontSize(12)
       .text(`${dateStr} - ${timeStr}`, { align: 'center' });
    
    doc.moveDown(2);
    
    // Summary statistics
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('SUMMARY', { underline: true });
    
    doc.fontSize(11)
       .font('Helvetica')
       .text(`Active Roadworks with Diversions: ${activeRoadworks.length}`)
       .text(`Completed in Last 24 Hours: ${completedRoadworks.length}`)
       .text(`Report Generated: ${timeStr}`);
    
    doc.moveDown(1.5);
    
    // Active roadworks section
    if (activeRoadworks.length > 0) {
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('ACTIVE ROADWORKS & DIVERSIONS', { underline: true });
      
      doc.moveDown(0.5);
      
      activeRoadworks.forEach((roadwork, index) => {
        const location = roadwork.location_description || 
                        roadwork.sm_location_description ||
                        `${roadwork.sm_street_name || 'Unknown Street'}, ${roadwork.sm_area_name || 'Unknown Area'}`;
        
        const workType = roadwork.sm_traffic_management_type || roadwork.work_type || 'Roadworks';
        const promoter = roadwork.sm_promoter_name || roadwork.promoter_organisation || 'Unknown';
        
        // Route information
        const affectedRoutes = roadwork.confirmed_routes || 
                              roadwork.auto_matched_routes || 
                              roadwork.affected_routes || 
                              [];
        
        const routeText = affectedRoutes.length > 0 ? 
                         `Services ${affectedRoutes.join(', ')}` : 
                         'Route impacts being assessed';
        
        // Diversion information
        const diversionRoute = roadwork.diversion_templates?.diversion_route || 
                              roadwork.diversion_route ||
                              'Diversion route TBC';
        
        // Severity indicator
        const severityIcon = getSeverityIcon(roadwork.severity);
        
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text(`${index + 1}. ${severityIcon} ${location}`, { continued: false });
        
        doc.fontSize(10)
           .font('Helvetica')
           .text(`   ${workType} - ${promoter}`, { indent: 20 })
           .text(`   ${routeText} diverted via ${diversionRoute}`, { indent: 20 });
        
        // Add timing information if available
        if (roadwork.sm_start_date && roadwork.sm_end_date) {
          const startDate = new Date(roadwork.sm_start_date).toLocaleDateString('en-GB');
          const endDate = new Date(roadwork.sm_end_date).toLocaleDateString('en-GB');
          doc.text(`   Duration: ${startDate} - ${endDate}`, { indent: 20 });
        }
        
        doc.moveDown(0.5);
        
        // Add page break if needed (before running out of space)
        if (doc.y > 700) {
          doc.addPage();
        }
      });
      
    } else {
      doc.fontSize(12)
         .font('Helvetica')
         .text('✅ No active roadworks requiring diversions at this time.');
    }
    
    doc.moveDown(1.5);
    
    // Recently completed section
    if (completedRoadworks.length > 0) {
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .text('RECENTLY COMPLETED (LAST 24 HOURS)', { underline: true });
      
      doc.moveDown(0.5);
      
      completedRoadworks.slice(0, 10).forEach((roadwork, index) => {
        const location = roadwork.location_description || 
                        roadwork.sm_location_description ||
                        `${roadwork.sm_street_name}, ${roadwork.sm_area_name}`;
        
        const completedTime = new Date(roadwork.updated_at).toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit'
        });
        
        doc.fontSize(11)
           .font('Helvetica')
           .text(`${index + 1}. ${location} - Completed ${completedTime}`);
      });
    }
    
    // Footer
    doc.fontSize(8)
       .font('Helvetica')
       .text('Generated automatically by Go BARRY Roadworks Manager', 50, doc.page.height - 30, {
         align: 'center'
       });
    
    doc.end();
  });
}

/**
 * Generate weekly roadwork summary report
 */
export async function generateWeeklySummary() {
  try {
    console.log('📊 Generating weekly roadwork summary...');
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    // Get week's activity
    const { data: weekActivity, error } = await supabase
      .from('streetworks')
      .select('*')
      .gte('created_at', weekAgo.toISOString())
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Calculate statistics
    const stats = calculateWeeklyStats(weekActivity || []);
    
    // Generate summary email
    const summaryHtml = generateWeeklySummaryHTML(stats, weekActivity || []);
    
    // Send email
    await emailTransporter.sendMail({
      from: process.env.SMTP_FROM || 'no-reply@gobarry.co.uk',
      to: process.env.WEEKLY_REPORT_RECIPIENTS || 'operations@gonortheast.co.uk',
      subject: `Go North East - Weekly Roadworks Summary`,
      html: summaryHtml
    });
    
    console.log('✅ Weekly summary sent successfully');
    
    return { success: true, stats };
    
  } catch (error) {
    console.error('Error generating weekly summary:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send report via email
 */
async function sendReportEmail(pdfBuffer, filename, subject) {
  try {
    const recipients = process.env.REPORT_RECIPIENTS || 'operations@gonortheast.co.uk,control@gonortheast.co.uk';
    
    const mailOptions = {
      from: process.env.SMTP_FROM || 'no-reply@gobarry.co.uk',
      to: recipients,
      subject: `${subject} - ${new Date().toLocaleDateString('en-GB')}`,
      html: `
        <h2>Go North East - ${subject}</h2>
        <p>Please find attached the automated ${subject.toLowerCase()} for ${new Date().toLocaleDateString('en-GB')}.</p>
        <p>This report contains:</p>
        <ul>
          <li>Active roadworks requiring service diversions</li>
          <li>Recently completed roadworks (last 24 hours)</li>
          <li>Summary statistics</li>
        </ul>
        <p><strong>Generated automatically by Go BARRY at ${new Date().toLocaleTimeString('en-GB')}</strong></p>
        <hr>
        <p style="font-size: 12px; color: #666;">
          This is an automated message from the Go BARRY traffic intelligence system.<br>
          For technical support, contact the development team.
        </p>
      `,
      attachments: [
        {
          filename: filename,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };
    
    const result = await emailTransporter.sendMail(mailOptions);
    console.log(`📧 Report email sent successfully: ${result.messageId}`);
    
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('Error sending report email:', error);
    throw error;
  }
}

/**
 * Send error notification email
 */
async function sendErrorNotification(subject, errorMessage) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@gobarry.co.uk';
    
    await emailTransporter.sendMail({
      from: process.env.SMTP_FROM || 'no-reply@gobarry.co.uk',
      to: adminEmail,
      subject: `Go BARRY Error: ${subject}`,
      html: `
        <h2>Go BARRY System Error</h2>
        <p><strong>Error:</strong> ${subject}</p>
        <p><strong>Details:</strong> ${errorMessage}</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        <p>Please investigate and resolve this issue.</p>
      `
    });
    
  } catch (emailError) {
    console.error('Failed to send error notification:', emailError);
  }
}

/**
 * Log report generation for audit trail
 */
async function logReportGeneration(reportType, details) {
  try {
    const { error } = await supabase
      .from('report_generation_log')
      .insert({
        report_type: reportType,
        generated_at: new Date().toISOString(),
        details: details,
        status: 'success'
      });
    
    if (error) throw error;
    
  } catch (error) {
    console.warn('Failed to log report generation:', error);
    // Don't throw - logging failure shouldn't break report generation
  }
}

/**
 * Calculate weekly statistics
 */
function calculateWeeklyStats(weekActivity) {
  const stats = {
    totalRoadworks: weekActivity.length,
    newRoadworks: weekActivity.filter(rw => rw.status === 'pending_review').length,
    activeRoadworks: weekActivity.filter(rw => ['approved', 'monitoring', 'active'].includes(rw.status)).length,
    completedRoadworks: weekActivity.filter(rw => rw.status === 'completed').length,
    
    // Severity breakdown
    critical: weekActivity.filter(rw => rw.severity === 'critical').length,
    high: weekActivity.filter(rw => rw.severity === 'high').length,
    medium: weekActivity.filter(rw => rw.severity === 'medium').length,
    low: weekActivity.filter(rw => rw.severity === 'low').length,
    
    // Diversion statistics
    withDiversions: weekActivity.filter(rw => rw.diversion_id).length,
    
    // Most active promoters
    promoters: {}
  };
  
  // Count promoters
  weekActivity.forEach(rw => {
    const promoter = rw.sm_promoter_name || rw.promoter_organisation || 'Unknown';
    stats.promoters[promoter] = (stats.promoters[promoter] || 0) + 1;
  });
  
  return stats;
}

/**
 * Generate weekly summary HTML
 */
function generateWeeklySummaryHTML(stats, weekActivity) {
  const topPromoters = Object.entries(stats.promoters)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);
  
  return `
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #1E40AF;">Go North East - Weekly Roadworks Summary</h1>
      <p><strong>Week ending:</strong> ${new Date().toLocaleDateString('en-GB')}</p>
      
      <h2>Overview</h2>
      <table style="border-collapse: collapse; width: 100%;">
        <tr style="background-color: #F3F4F6;">
          <td style="padding: 10px; border: 1px solid #D1D5DB;">Total Roadworks</td>
          <td style="padding: 10px; border: 1px solid #D1D5DB; font-weight: bold;">${stats.totalRoadworks}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #D1D5DB;">New This Week</td>
          <td style="padding: 10px; border: 1px solid #D1D5DB;">${stats.newRoadworks}</td>
        </tr>
        <tr style="background-color: #F3F4F6;">
          <td style="padding: 10px; border: 1px solid #D1D5DB;">Currently Active</td>
          <td style="padding: 10px; border: 1px solid #D1D5DB;">${stats.activeRoadworks}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #D1D5DB;">Completed</td>
          <td style="padding: 10px; border: 1px solid #D1D5DB;">${stats.completedRoadworks}</td>
        </tr>
        <tr style="background-color: #F3F4F6;">
          <td style="padding: 10px; border: 1px solid #D1D5DB;">With Diversions</td>
          <td style="padding: 10px; border: 1px solid #D1D5DB;">${stats.withDiversions}</td>
        </tr>
      </table>
      
      <h2>Severity Breakdown</h2>
      <ul>
        <li><span style="color: #DC2626;">Critical:</span> ${stats.critical}</li>
        <li><span style="color: #EF4444;">High:</span> ${stats.high}</li>
        <li><span style="color: #F59E0B;">Medium:</span> ${stats.medium}</li>
        <li><span style="color: #10B981;">Low:</span> ${stats.low}</li>
      </ul>
      
      ${topPromoters.length > 0 ? `
        <h2>Most Active Promoters</h2>
        <ol>
          ${topPromoters.map(([promoter, count]) => 
            `<li>${promoter}: ${count} roadworks</li>`
          ).join('')}
        </ol>
      ` : ''}
      
      <hr style="margin: 30px 0;">
      <p style="font-size: 12px; color: #6B7280;">
        Generated automatically by Go BARRY Roadworks Manager<br>
        ${new Date().toISOString()}
      </p>
    </body>
    </html>
  `;
}

/**
 * Get severity icon for PDF
 */
function getSeverityIcon(severity) {
  const icons = {
    critical: '🚨',
    high: '⚠️',
    medium: '🚧',
    low: 'ℹ️'
  };
  return icons[severity?.toLowerCase()] || '🚧';
}

/**
 * Generate on-demand report
 */
export async function generateOnDemandReport(reportType, options = {}) {
  try {
    switch (reportType) {
      case 'daily':
        return await generateAndSendDailyReport();
      case 'weekly':
        return await generateWeeklySummary();
      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }
  } catch (error) {
    console.error(`Error generating ${reportType} report:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Get report generation statistics
 */
export async function getReportStats() {
  try {
    const { data, error } = await supabase
      .from('report_generation_log')
      .select('*')
      .order('generated_at', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    
    const stats = {
      totalReports: data?.length || 0,
      recentReports: data?.filter(r => 
        new Date(r.generated_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length || 0,
      successRate: data?.length > 0 ? 
        data.filter(r => r.status === 'success').length / data.length : 0,
      lastGenerated: data?.[0]?.generated_at || null
    };
    
    return {
      success: true,
      stats,
      recentReports: data?.slice(0, 10) || []
    };
    
  } catch (error) {
    console.error('Error getting report stats:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export default {
  initializeReportScheduler,
  generateAndSendDailyReport,
  generateWeeklySummary,
  generateOnDemandReport,
  getReportStats
};