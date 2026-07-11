import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { file_url, family_member_id } = await req.json();
    if (!file_url) return Response.json({ error: 'file_url is required' }, { status: 400 });

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Analyze this lab report document and extract all key medical values. For each value, identify the test name, numeric value, unit, and map it to one of these vital types:
- blood_pressure (systolic in "value", diastolic in "secondary_value", unit "mmHg")
- heart_rate (unit "bpm")
- oxygen_saturation (unit "%")
- blood_glucose (unit "mg/dL")
- weight (unit "kg")
- temperature (unit "°C" or "°F")

Only include values that clearly map to one of these types. For blood pressure, extract both systolic and diastolic. Include the original test name in the notes field.`,
      file_urls: [file_url],
      response_json_schema: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string", enum: ["blood_pressure", "heart_rate", "oxygen_saturation", "blood_glucose", "weight", "temperature"] },
                value: { type: "number" },
                secondary_value: { type: "number" },
                unit: { type: "string" },
                notes: { type: "string" }
              },
              required: ["type", "value"]
            }
          }
        }
      }
    });

    const items = result.items || [];
    const created = [];
    for (const item of items) {
      const record = await base44.entities.VitalRecord.create({
        type: item.type,
        value: item.value,
        secondary_value: item.secondary_value,
        unit: item.unit,
        notes: item.notes,
        recorded_at: new Date().toISOString(),
        family_member_id: family_member_id || undefined,
      });
      created.push(record);
    }

    return Response.json({ extracted: created.length, records: created });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});