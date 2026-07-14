import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;

    const body = await req.json();
    const { token } = body;

    if (!token) {
      return Response.json({ error: "No access token provided" }, { status: 400 });
    }

    // Look up the RecordShare by access_token
    const shares = await sr.entities.RecordShare.filter({ access_token: token, status: "active" });
    if (shares.length === 0) {
      return Response.json({ error: "Invalid or revoked access link" }, { status: 404 });
    }

    const share = shares[0];

    // Check expiration
    if (new Date(share.expires_at) < new Date()) {
      return Response.json({ error: "This access link has expired" }, { status: 410 });
    }

    // Fetch the assigned records
    const recordIds = share.assigned_record_ids || [];
    const records = await Promise.all(
      recordIds.map((id) => sr.entities.MedicalRecord.get(id).catch(() => null))
    );
    const validRecords = records.filter((r) => r !== null);

    // Get patient info
    const users = await sr.entities.User.filter({ id: share.created_by_id });
    const patient = users[0];

    // Update last_accessed_at
    await sr.entities.RecordShare.update(share.id, { last_accessed_at: new Date().toISOString() });

    return Response.json({
      patient_name: patient?.full_name || "Patient",
      patient_email: patient?.email || "",
      recipient_name: share.recipient_name,
      recipient_email: share.recipient_email,
      expires_at: share.expires_at,
      accessed_at: share.last_accessed_at,
      records: validRecords,
    });
  } catch (error) {
    console.error("getSharedRecords error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});