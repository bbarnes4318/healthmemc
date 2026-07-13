import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { file_url, record_id } = await req.json();
    if (!file_url) return Response.json({ error: 'file_url is required' }, { status: 400 });

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are an OCR system for medical documents. Extract ALL text from this document image or PDF exactly as written. Preserve the structure, headings, test names, values, units, reference ranges, dates, doctor names, lab names, patient info, and any other text visible in the document. Output the extracted text in a clean, readable markdown format. If the document is a lab report, organize it with clear sections (Patient Info, Test Results, Notes, etc.). Do not interpret or summarize — extract the raw text faithfully. If the image is blurry or unreadable in parts, note that and extract what you can.`,
      file_urls: [file_url],
    });

    if (record_id) {
      await base44.entities.MedicalRecord.update(record_id, {
        notes: result,
      });
    }

    // Also extract structured lab values and create VitalRecord entries for trend tracking
    let extractedValues = [];
    try {
      const labResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are a medical data extraction system. From the following extracted medical document text, identify any measurable lab values, vital signs, or test results. For each value found, output a JSON object with:
- type: one of "blood_pressure", "heart_rate", "oxygen_saturation", "blood_glucose", "weight", "temperature", "steps", "sleep_hours", "activity_minutes"
- value: the numeric value (for blood_pressure, use systolic as value and diastolic as secondary_value)
- secondary_value: the diastolic value for blood_pressure, null otherwise
- unit: the unit of measurement (e.g. "mmHg", "bpm", "mg/dL", "°F", "lbs", "kg", "%")
- date: the date the test was performed in ISO format if available, null otherwise

Only include values that clearly match standard vital sign or lab categories. Do NOT include cholesterol, CBC, or other complex lab panels — only the types listed above. If no matching values are found, return an empty array.

Document text:
${result}

Output a JSON array of objects.`,
        response_json_schema: {
          type: "object",
          properties: {
            values: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  value: { type: "number" },
                  secondary_value: { type: "number" },
                  unit: { type: "string" },
                  date: { type: "string" }
                }
              }
            }
          }
        }
      });

      extractedValues = labResult?.values || [];
      if (extractedValues.length > 0) {
        const vitalRecords = extractedValues.map(v => ({
          type: v.type,
          value: v.value,
          secondary_value: v.secondary_value || undefined,
          unit: v.unit || "",
          recorded_at: v.date ? new Date(v.date).toISOString() : new Date().toISOString(),
          notes: `Extracted via OCR from medical record${record_id ? ` ${record_id}` : ""}`,
        }));
        await base44.asServiceRole.entities.VitalRecord.bulkCreate(vitalRecords);
      }
    } catch (labErr) {
      console.error('Lab value extraction error:', labErr);
    }

    return Response.json({
      extracted_text: result,
      updated: !!record_id,
      lab_values_extracted: extractedValues.length,
    });
  } catch (error) {
    console.error('OCR error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});