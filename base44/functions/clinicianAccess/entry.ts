import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { token } = body;

    if (!token) return Response.json({ error: 'Access token required' }, { status: 400 });

    const grants = await base44.asServiceRole.entities.ClinicianAccess.filter({ access_token: token });
    if (grants.length === 0) return Response.json({ error: 'Invalid or unknown access token' }, { status: 404 });

    const grant = grants[0];

    if (grant.status === 'revoked') return Response.json({ error: 'Access has been revoked by the patient' }, { status: 403 });
    if (new Date(grant.expires_at) < new Date()) return Response.json({ error: 'Access has expired' }, { status: 403 });

    const owner = await base44.asServiceRole.entities.User.get(grant.created_by_id);

    const result = {
      patient_name: owner.full_name,
      patient_email: owner.email,
      doctor_name: grant.doctor_name,
      specialty: grant.specialty,
      expires_at: grant.expires_at,
      accessed_at: grant.accessed_at,
      share_records: grant.share_records,
      share_consultations: grant.share_consultations,
      share_medications: grant.share_medications,
      share_vitals: grant.share_vitals,
    };

    if (grant.share_records) {
      result.records = await base44.asServiceRole.entities.MedicalRecord.filter({ created_by_id: grant.created_by_id }, '-date', 50);
    }
    if (grant.share_consultations) {
      result.consultations = await base44.asServiceRole.entities.Consultation.filter({ created_by_id: grant.created_by_id }, '-created_date', 20);
    }
    if (grant.share_medications) {
      result.medications = await base44.asServiceRole.entities.Medication.filter({ created_by_id: grant.created_by_id, active: true });
    }
    if (grant.share_vitals) {
      result.vitals = await base44.asServiceRole.entities.VitalRecord.filter({ created_by_id: grant.created_by_id }, '-recorded_at', 50);
    }

    await base44.asServiceRole.entities.ClinicianAccess.update(grant.id, { accessed_at: new Date().toISOString() });

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});