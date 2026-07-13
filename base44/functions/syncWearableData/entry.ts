import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    let user = null;
    try { user = await base44.auth.me(); } catch (e) {}

    let connections;
    if (user) {
      connections = await base44.asServiceRole.entities.WearableConnection.filter({
        created_by_id: user.id,
        status: "active"
      });
    } else {
      connections = await base44.asServiceRole.entities.WearableConnection.filter({
        status: "active"
      });
    }

    const today = new Date();
    const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);
    const startDate = threeDaysAgo.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];

    const results = [];
    for (const conn of connections) {
      try {
        if (conn.wearable_type !== "oura") {
          results.push({ connection_id: conn.id, skipped: `Wearable type '${conn.wearable_type}' not yet supported` });
          continue;
        }
        const syncResult = await syncOuraData(base44, conn, startDate, endDate);
        await base44.asServiceRole.entities.WearableConnection.update(conn.id, {
          last_sync_date: new Date().toISOString(),
          last_error: ""
        });
        results.push({ connection_id: conn.id, ...syncResult });
      } catch (error) {
        console.error(`Sync failed for connection ${conn.id}:`, error.message);
        await base44.asServiceRole.entities.WearableConnection.update(conn.id, {
          last_error: error.message.substring(0, 500)
        });
        results.push({ connection_id: conn.id, error: error.message });
      }
    }

    return Response.json({ synced: results.length, results, date: endDate });
  } catch (error) {
    console.error("Wearable sync error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function syncOuraData(base44, conn, startDate, endDate) {
  const token = conn.access_token;
  const familyMemberId = conn.family_member_id || "";
  const headers = { "Authorization": `Bearer ${token}` };

  const sleepRes = await fetch(
    `https://api.ouraring.com/v2/usercollection/sleep?start_date=${startDate}&end_date=${endDate}`,
    { headers }
  );
  if (!sleepRes.ok) {
    const errText = await sleepRes.text();
    throw new Error(`Oura sleep API ${sleepRes.status}: ${errText.substring(0, 200)}`);
  }
  const sleepData = await sleepRes.json();

  const activityRes = await fetch(
    `https://api.ouraring.com/v2/usercollection/daily_activity?start_date=${startDate}&end_date=${endDate}`,
    { headers }
  );
  if (!activityRes.ok) {
    const errText = await activityRes.text();
    throw new Error(`Oura activity API ${activityRes.status}: ${errText.substring(0, 200)}`);
  }
  const activityData = await activityRes.json();

  const recordsToCreate = [];

  for (const sleep of sleepData.data || []) {
    const day = sleep.day;
    const dateIso = new Date(day + "T12:00:00Z").toISOString();

    if (sleep.total_sleep_duration) {
      recordsToCreate.push({
        type: "sleep_hours",
        value: Math.round((sleep.total_sleep_duration / 3600) * 10) / 10,
        unit: "hrs",
        recorded_at: dateIso,
        notes: `Oura Auto-Sync | ${day}`,
        family_member_id: familyMemberId
      });
    }

    if (sleep.lowest_heart_rate) {
      recordsToCreate.push({
        type: "heart_rate",
        value: sleep.lowest_heart_rate,
        unit: "bpm",
        recorded_at: dateIso,
        notes: `Oura Auto-Sync | ${day}`,
        family_member_id: familyMemberId
      });
    }
  }

  for (const activity of activityData.data || []) {
    const day = activity.day;
    const dateIso = new Date(day + "T12:00:00Z").toISOString();

    const activeSeconds = (activity.low_activity || 0) + (activity.medium_activity || 0) + (activity.high_activity || 0);
    if (activeSeconds > 0) {
      recordsToCreate.push({
        type: "activity_minutes",
        value: Math.round(activeSeconds / 60),
        unit: "min",
        recorded_at: dateIso,
        notes: `Oura Auto-Sync | ${day}`,
        family_member_id: familyMemberId
      });
    }

    if (activity.steps) {
      recordsToCreate.push({
        type: "steps",
        value: activity.steps,
        unit: "steps",
        recorded_at: dateIso,
        notes: `Oura Auto-Sync | ${day}`,
        family_member_id: familyMemberId
      });
    }
  }

  const filterQuery = familyMemberId ? { family_member_id: familyMemberId } : {};
  const recentVitals = await base44.asServiceRole.entities.VitalRecord.filter(filterQuery, "-recorded_at", 500);

  const existingKeys = new Set();
  for (const rec of recentVitals) {
    if (rec.notes && rec.notes.includes("Oura Auto-Sync")) {
      const match = rec.notes.match(/\| (\d{4}-\d{2}-\d{2})/);
      if (match) {
        existingKeys.add(`${rec.type}|${match[1]}`);
      }
    }
  }

  const newRecords = recordsToCreate.filter(r => {
    const day = r.notes.match(/\| (\d{4}-\d{2}-\d{2})/);
    if (!day) return true;
    return !existingKeys.has(`${r.type}|${day[1]}`);
  });

  let created = 0;
  if (newRecords.length > 0) {
    await base44.asServiceRole.entities.VitalRecord.bulkCreate(newRecords);
    created = newRecords.length;
  }

  return {
    sleep_days: (sleepData.data || []).length,
    activity_days: (activityData.data || []).length,
    records_created: created,
    duplicates_skipped: recordsToCreate.length - created
  };
}