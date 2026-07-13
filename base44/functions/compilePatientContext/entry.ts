import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const serviceType = body.service_type || 'general';
    const familyMemberId = body.family_member_id || null;

    const filter = familyMemberId ? { family_member_id: familyMemberId } : {};

    const [
      profiles, vitals, medications, records, consultations,
      symptoms, nutrition, exercise, surgicalLogs, immunizations,
      wellnessJournals, medicationLogs
    ] = await Promise.all([
      base44.entities.HealthProfile.filter({}).then(r => r.slice(0, 1)),
      base44.entities.VitalRecord.list('-recorded_at', 30),
      base44.entities.Medication.filter({ active: true }),
      base44.entities.MedicalRecord.list('-date', 20),
      base44.entities.Consultation.list('-created_date', 10),
      base44.entities.SymptomMap.list('-logged_at', 20),
      base44.entities.NutritionLog.list('-date', 14),
      base44.entities.ExerciseLog.list('-date', 14),
      base44.entities.SurgicalRecovery.list('-log_date', 10),
      base44.entities.ImmunizationLog.list('-created_date', 10),
      base44.entities.WellnessJournal.list('-date', 7),
      base44.entities.MedicationLog.list('-scheduled_date', 14),
    ]);

    const profile = profiles[0] || {};
    const sections = [];

    // Patient identity
    sections.push(`## PATIENT PROFILE
Name: ${profile.full_name || user.full_name || 'Patient'}
DOB: ${profile.date_of_birth || 'Unknown'}
Gender: ${profile.gender || 'Unknown'}
Blood Type: ${profile.blood_type || 'Unknown'} ${profile.rh_factor || ''}
Height: ${profile.height || 'Unknown'}
Weight: ${profile.weight || 'Unknown'}`);

    // Allergies
    const allergies = profile.allergies || [];
    if (allergies.length > 0) {
      sections.push(`## ALLERGIES (CRITICAL)
${allergies.map(a => `⚠️ ${a}`).join('\n')}`);
    }

    // Chronic conditions
    const conditions = profile.chronic_conditions || profile.medical_conditions || [];
    if (Array.isArray(conditions) && conditions.length > 0) {
      sections.push(`## CHRONIC CONDITIONS
${conditions.map(c => `• ${c}`).join('\n')}`);
    } else if (typeof conditions === 'string' && conditions) {
      sections.push(`## CHRONIC CONDITIONS
${conditions}`);
    }

    // Current medications
    if (medications.length > 0) {
      sections.push(`## CURRENT MEDICATIONS
${medications.map(m => `• ${m.name} ${m.dosage} — ${m.frequency}${m.notes ? ` (${m.notes})` : ''}`).join('\n')}`);
    }

    // Recent vitals (deduplicate by type, keep latest)
    const vitalsByType = {};
    for (const v of vitals) {
      if (!vitalsByType[v.type]) vitalsByType[v.type] = v;
    }
    const vitalEntries = Object.values(vitalsByType);
    if (vitalEntries.length > 0) {
      sections.push(`## LATEST VITAL SIGNS
${vitalEntries.map(v => {
  let val = v.value;
  if (v.type === 'blood_pressure' && v.secondary_value) val = `${v.value}/${v.secondary_value}`;
  return `• ${v.type.replace(/_/g, ' ')}: ${val} ${v.unit || ''}${v.recorded_at ? ` (${new Date(v.recorded_at).toLocaleDateString()})` : ''}`;
}).join('\n')}`);
    }

    // Recent symptoms
    if (symptoms.length > 0) {
      sections.push(`## RECENT SYMPTOMS
${symptoms.map(s => `• ${new Date(s.logged_at).toLocaleDateString()}: ${s.body_region.replace(/_/g, ' ')} — ${s.severity} ${s.pain_type || ''} pain. ${s.symptom_description || ''}`).join('\n')}`);
    }

    // Recent medical records
    if (records.length > 0) {
      sections.push(`## RECENT MEDICAL RECORDS
${records.map(r => `• ${r.date ? new Date(r.date).toLocaleDateString() : 'Recent'}: ${r.title} (${r.category || 'record'})${r.notes ? ` — ${r.notes.substring(0, 200)}` : ''}`).join('\n')}`);
    }

    // Recent consultations
    if (consultations.length > 0) {
      sections.push(`## PREVIOUS CONSULTATIONS
${consultations.map(c => `• ${c.type} (${c.status})${c.symptoms ? ` — ${c.symptoms.substring(0, 100)}` : ''}${c.report?.summary ? ` — ${c.report.summary.substring(0, 100)}` : ''}`).join('\n')}`);
    }

    // Medication adherence
    if (medicationLogs.length > 0) {
      const taken = medicationLogs.filter(m => m.status === 'taken').length;
      const missed = medicationLogs.filter(m => m.status === 'missed').length;
      sections.push(`## MEDICATION ADHERENCE (last 14 days)
Taken: ${taken}, Missed: ${missed}, Adherence: ${medicationLogs.length > 0 ? Math.round((taken / medicationLogs.length) * 100) : 0}%`);
    }

    // Surgical recovery
    if (surgicalLogs.length > 0) {
      sections.push(`## SURGICAL RECOVERY
${surgicalLogs.slice(0, 5).map(s => `• ${s.surgery_name} (${s.surgery_date ? new Date(s.surgery_date).toLocaleDateString() : 'recent'}) — Pain: ${s.pain_level || 'N/A'}/10, Wound: ${s.wound_status || 'N/A'}, Mobility: ${s.mobility_level || 'N/A'}`).join('\n')}`);
    }

    // Nutrition summary
    if (nutrition.length > 0) {
      const totalCal = nutrition.reduce((s, n) => s + (n.calories || 0), 0);
      const avgCal = Math.round(totalCal / nutrition.length);
      sections.push(`## NUTRITION (recent ${nutrition.length} meals)
Average calories per meal: ${avgCal}
Recent foods: ${nutrition.slice(0, 8).map(n => n.food_name).join(', ')}`);
    }

    // Exercise summary
    if (exercise.length > 0) {
      const totalMin = exercise.reduce((s, e) => s + (e.duration_minutes || 0), 0);
      sections.push(`## EXERCISE (recent ${exercise.length} sessions)
Total duration: ${totalMin} min
Recent activities: ${exercise.slice(0, 8).map(e => `${e.exercise_name} (${e.intensity})`).join(', ')}`);
    }

    // Wellness journal
    if (wellnessJournals.length > 0) {
      const latest = wellnessJournals[0];
      sections.push(`## WELLNESS JOURNAL (latest)
Date: ${latest.date}
Mood: ${latest.mood} (${latest.mood_score}/5), Stress: ${latest.stress_level} (${latest.stress_score}/5), Sleep: ${latest.sleep_quality} (${latest.sleep_hours || 'N/A'}h)${latest.notes ? `\nNotes: ${latest.notes}` : ''}`);
    }

    // Immunizations
    if (immunizations.length > 0) {
      sections.push(`## IMMUNIZATIONS
${immunizations.slice(0, 5).map(i => `• ${i.vaccine_name || i.immunization_name || 'Vaccine'} — ${i.date_administered || i.administered_date || 'Date N/A'}`).join('\n')}`);
    }

    const context = sections.join('\n\n');

    return Response.json({
      context,
      data_points: {
        vitals: vitalEntries.length,
        medications: medications.length,
        records: records.length,
        consultations: consultations.length,
        symptoms: symptoms.length,
        nutrition: nutrition.length,
        exercise: exercise.length,
        surgical: surgicalLogs.length,
        immunizations: immunizations.length,
        wellness: wellnessJournals.length,
        medLogs: medicationLogs.length,
      }
    });
  } catch (error) {
    console.error('compilePatientContext error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});