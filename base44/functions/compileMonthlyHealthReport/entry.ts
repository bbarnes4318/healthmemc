import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole;

    // Get all family members
    const members = await sr.entities.FamilyMember.list("-created_date", 100);

    if (members.length === 0) {
      return Response.json({ status: "success", message: "No family members found", reports_generated: 0, reports: [] });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const reportDate = now.toISOString().split("T")[0];
    const monthLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    const reports = [];

    for (const member of members) {
      try {
        const filter = { family_member_id: member.id };
        const [meds, vitals, appts, medLogs, caregiverLogs, surgicalLogs, immunizations, eyeExams, hearingTests] = await Promise.all([
          sr.entities.Medication.filter({ ...filter, active: true }),
          sr.entities.VitalRecord.filter(filter, "-recorded_at", 50),
          sr.entities.Appointment.filter(filter, "-date", 20),
          sr.entities.MedicationLog.filter(filter),
          sr.entities.CaregiverVisitLog.filter(filter),
          sr.entities.SurgicalRecovery.filter(filter, "-log_date", 20),
          sr.entities.ImmunizationLog.filter(filter, "-date_administered", 20),
          sr.entities.EyeExamLog.filter(filter, "-exam_date", 10),
          sr.entities.HearingTestLog.filter(filter, "-test_date", 10),
        ]);

        const recentVitals = vitals.filter(v => v.recorded_at && new Date(v.recorded_at) >= thirtyDaysAgo);
        const recentMedLogs = medLogs.filter(l => l.scheduled_date && new Date(l.scheduled_date) >= thirtyDaysAgo);
        const recentCaregiverLogs = caregiverLogs.filter(l => l.visit_date && new Date(l.visit_date) >= thirtyDaysAgo);

        const age = member.date_of_birth
          ? Math.floor((Date.now() - new Date(member.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
          : null;

        const memberData = {
          name: member.name,
          relationship: member.relationship,
          age,
          blood_type: member.blood_type,
          active_medications: meds.map(m => ({ name: m.name, dosage: m.dosage, frequency: m.frequency, prescribing_provider: m.prescribing_provider })),
          recent_vitals: recentVitals.map(v => ({
            type: v.type,
            value: v.secondary_value ? `${v.value}/${v.secondary_value}` : v.value,
            unit: v.unit,
            recorded_at: v.recorded_at,
          })),
          medication_adherence: {
            taken: recentMedLogs.filter(l => l.status === "taken").length,
            missed: recentMedLogs.filter(l => l.status === "missed").length,
            skipped: recentMedLogs.filter(l => l.status === "skipped").length,
          },
          upcoming_appointments: appts.map(a => ({ title: a.title, date: a.date, status: a.status, provider: a.provider })),
          caregiver_visits_30d: recentCaregiverLogs.map(c => ({
            date: c.visit_date,
            caregiver: c.caregiver_name,
            type: c.support_type,
            medication_administered: c.medication_administered,
            meal_taken: c.meal_taken,
            activity_completed: c.activity_completed,
            duration_minutes: c.duration_minutes,
            notes: c.notes,
          })),
          caregiver_care_summary: {
            total_visits: recentCaregiverLogs.length,
            meds_administered: recentCaregiverLogs.filter(c => c.medication_administered).length,
            meals_taken: recentCaregiverLogs.filter(c => c.meal_taken).length,
            activities_completed: recentCaregiverLogs.filter(c => c.activity_completed).length,
          },
          surgical_recovery: surgicalLogs.map(s => ({
            surgery: s.surgery_name,
            surgery_date: s.surgery_date,
            log_date: s.log_date,
            days_post_op: s.days_post_op,
            pain_level: s.pain_level,
            wound_status: s.wound_status,
            mobility: s.mobility_level,
          })),
          immunizations: immunizations.map(i => ({
            vaccine: i.vaccine_name,
            date: i.date_administered,
            next_booster: i.next_booster_date,
          })),
          eye_exams: eyeExams.map(e => ({
            date: e.exam_date,
            acuity: e.acuity_numerator ? `${e.acuity_numerator}/${e.acuity_denominator}` : null,
            eye: e.eye,
          })),
          hearing_tests: hearingTests.map(h => ({
            date: h.test_date,
            result: h.overall_result,
            ear: h.ear,
          })),
        };

        const prompt = `Compile a comprehensive monthly health report for ${member.name} (relationship: ${member.relationship}${age ? `, age: ${age}` : ""}).
This report covers the past 30 days of health data. Provide a structured, professional report with these sections:

1. EXECUTIVE SUMMARY - Brief overview of overall health status this month
2. MEDICATION ADHERENCE - Analysis of taken/missed/skipped medications
3. VITAL SIGNS TRENDS - Summary of recorded vitals and any concerning patterns
4. CAREGIVER VISIT SUMMARY - Visit frequency, medication administration, meal intake, and activity completion rates
5. UPCOMING APPOINTMENTS & CARE NEEDS - Scheduled appointments and recommended follow-ups
6. SURGICAL RECOVERY PROGRESS - If applicable, pain trends, wound healing, and mobility progression
7. PREVENTIVE CARE - Immunization status, eye/hearing exam results
8. HEALTH RECOMMENDATIONS - Actionable recommendations for the coming month

Health Data:
${JSON.stringify(memberData, null, 2)}`;

        const llmResponse = await sr.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: "object",
            properties: {
              report: { type: "string", description: "Full comprehensive health report with section headers" },
              summary: { type: "string", description: "One-paragraph executive summary" },
            },
            required: ["report", "summary"],
          },
        });

        const record = await sr.entities.MedicalRecord.create({
          title: `Monthly Health Report — ${member.name} — ${monthLabel}`,
          category: "visit_summary",
          date: reportDate,
          provider: "Health Me Medical Center — Automated Monthly Report",
          notes: llmResponse.report,
          family_member_id: member.id,
        });

        reports.push({ member: member.name, record_id: record.id, summary: llmResponse.summary });
      } catch (memberErr) {
        console.error(`Error processing member ${member.name}:`, memberErr);
        reports.push({ member: member.name, error: memberErr.message });
      }
    }

    return Response.json({ status: "success", reports_generated: reports.length, reports });
  } catch (error) {
    console.error("Monthly health report compilation error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});