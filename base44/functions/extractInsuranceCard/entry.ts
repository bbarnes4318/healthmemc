import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { file_url } = await req.json();
    if (!file_url) return Response.json({ error: 'file_url is required' }, { status: 400 });

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Analyze this insurance card or policy document image and extract all available fields. Map the extracted data to these fields:
- provider_name: The insurance company name (e.g., "Blue Cross Blue Shield", "Aetna", "Cigna")
- policy_number: The policy/member ID number
- group_number: The group number if present
- subscriber_name: The name of the insured person
- plan_name: The plan name if present (e.g., "Gold PPO 500")
- plan_type: One of "hmo", "ppo", "epo", "pos", "medicare", "medicaid", "other" — infer from plan name or type indicators
- effective_date: Coverage effective date in YYYY-MM-DD format if visible
- termination_date: Coverage end/termination date in YYYY-MM-DD format if visible
- copay_amount: Copay amount as a number (e.g., 25 for $25)
- deductible_amount: Annual deductible amount as a number
- coinsurance_percentage: Coinsurance percentage as a number (e.g., 20 for 20%)
- out_of_pocket_max: Out-of-pocket maximum as a number
- customer_service_phone: Customer service phone number

Only include fields that are clearly visible on the card/document. Leave fields empty/null if not visible. Do not guess or fabricate values.`,
      file_urls: [file_url],
      response_json_schema: {
        type: "object",
        properties: {
          provider_name: { type: "string" },
          policy_number: { type: "string" },
          group_number: { type: "string" },
          subscriber_name: { type: "string" },
          plan_name: { type: "string" },
          plan_type: { type: "string", enum: ["hmo", "ppo", "epo", "pos", "medicare", "medicaid", "other"] },
          effective_date: { type: "string" },
          termination_date: { type: "string" },
          copay_amount: { type: "number" },
          deductible_amount: { type: "number" },
          coinsurance_percentage: { type: "number" },
          out_of_pocket_max: { type: "number" },
          customer_service_phone: { type: "string" },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
          raw_text: { type: "string" }
        }
      }
    });

    return Response.json({ status: "success", extracted: result });
  } catch (error) {
    console.error('extractInsuranceCard error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});