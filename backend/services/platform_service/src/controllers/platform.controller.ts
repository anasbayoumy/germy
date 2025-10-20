import { Request, Response } from 'express';
import axios from 'axios';
import { execute } from '../config/database';
import { config } from '../config/env';
// Use only tables that exist in shared schema.sql
// We will perform raw SQL via db.client for simplicity where needed

export class PlatformController {

  async getStatus(_req: Request, res: Response) {
    res.json({
      success: true,
      services: {
        auth: config.authServiceUrl,
        user: config.userServiceUrl
      }
    });
  }

  // Plans
  async listPlans(_req: Request, res: Response) {
    const { rows } = await execute("SELECT * FROM subscription_plans ORDER BY price_monthly ASC");
    res.json({ success: true, data: rows });
  }
  
  // Companies
  async listCompanies(_req: Request, res: Response) {
    const { rows } = await execute("SELECT * FROM companies ORDER BY created_at DESC");
    res.json({ success: true, data: rows });
  }
  
  // Company settings
  async getCompanySettings(req: Request, res: Response) {
    const { companyId } = req.params;
    const { rows } = await execute(`SELECT * FROM company_settings WHERE company_id = $1`, [companyId]);
    res.json({ success: true, data: rows[0] || null });
  }
  async updateCompanySettings(req: Request, res: Response) {
    const { companyId } = req.params;
    const payload = req.body || {};
    const upsert = `INSERT INTO company_settings (company_id, work_hours_start, work_hours_end, work_days, timezone, allow_remote_work,
      require_photo_verification, require_location_verification, geofence_radius_meters, late_tolerance_minutes,
      auto_approve_attendance, notification_settings)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      ON CONFLICT (company_id)
      DO UPDATE SET work_hours_start=$2, work_hours_end=$3, work_days=$4, timezone=$5, allow_remote_work=$6,
        require_photo_verification=$7, require_location_verification=$8, geofence_radius_meters=$9, late_tolerance_minutes=$10,
        auto_approve_attendance=$11, notification_settings=$12, updated_at=NOW()
      RETURNING *`;
    const params = [companyId, payload.work_hours_start, payload.work_hours_end, payload.work_days, payload.timezone,
      payload.allow_remote_work, payload.require_photo_verification, payload.require_location_verification,
      payload.geofence_radius_meters, payload.late_tolerance_minutes, payload.auto_approve_attendance,
      payload.notification_settings];
    const { rows } = await execute(upsert, params);
    res.json({ success: true, data: rows[0] });
  }
  
  // Company subscriptions
  async listSubscriptions(_req: Request, res: Response) {
    const { rows } = await execute("SELECT * FROM company_subscriptions ORDER BY created_at DESC");
    res.json({ success: true, data: rows });
  }

  async listPendingCompanies(_req: Request, res: Response) {
    const url = `${config.authServiceUrl}/api/approval/companies/pending`;
    const { data } = await axios.get(url);
    res.json(data);
  }

  async approveCompany(req: Request, res: Response) {
    const { companyId } = req.params;
    const url = `${config.authServiceUrl}/api/approval/companies/${companyId}/approve`;
    const { data } = await axios.post(url, {});
    res.json(data);
  }

  async rejectCompany(req: Request, res: Response) {
    const { companyId } = req.params;
    const url = `${config.authServiceUrl}/api/approval/companies/${companyId}/reject`;
    const { data } = await axios.post(url, {});
    res.json(data);
  }

  // Audit logs
  async listAuditLogs(_req: Request, res: Response) {
    const { rows } = await execute("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 500");
    res.json({ success: true, data: rows });
  }

  // Integrations
  async listIntegrations(_req: Request, res: Response) {
    const { rows } = await execute("SELECT * FROM integrations ORDER BY created_at DESC");
    res.json({ success: true, data: rows });
  }
}


