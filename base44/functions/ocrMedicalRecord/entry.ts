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

    return Response.json({ extracted_text: result, updated: !!record_id });
  } catch (error) {
    console.error('OCR error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});