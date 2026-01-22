type OpenAIModel = { id: string };

export function selectRandomModel(
  models: OpenAIModel[],
  excludeIds: Set<string> = new Set(),
): string | null {
  if (!models || models.length === 0) return null;
  const availableModels = models.filter((m) => !excludeIds.has(m.id));
  if (availableModels.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * availableModels.length);
  return availableModels[randomIndex].id;
}

/*function makeOpenAIHeaders(apiKey?: string): Record<string, string> {
  return {
    ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    "Content-Type": "application/json",
    "x-alltrue-llm-endpoint-identifier": "EHF-OPENAI-API-LLM",
  };
}*/

function makeOpenAIHeaders(apiKey?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Authorization': 'Bearer ${apiKey}',
    'Content-Type': 'application/json',
    //*'User-Agent': 'EHF Minimum Viable Product',
    'x-alltrue-llm-endpoint-identifier': 'EHF-OPENAI-API-LLM'
    
  };

  /*if (apiKey) {
    'Authorization': 'Bearer ${apiKey}',
    'Content-Type': 'application/json',
    'x-alltrue-llm-endpoint-identifier': 'EHF-OPENAI-API-LLM'
  }*/
  return headers;
}   

export async function listOpenAiCompatibleModels(
  baseUrl: string,
  apiKey?: string,
  //guardiumaiEndpointId?: string,
): Promise<OpenAIModel[]> {
  if (!baseUrl) throw new Error("Base URL is required to list models");

  const normalizedBase = baseUrl.replace(/\/$/, "");

  const response = await fetch(`${normalizedBase}/models`, {
    headers: {
      ...makeOpenAIHeaders(apiKey),
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch models: ${response.status} ${response.statusText}`,
    );
  }

  const data = await response.json();
  const models: OpenAIModel[] = Array.isArray(data?.data) ? data.data : [];
  return models;
}
