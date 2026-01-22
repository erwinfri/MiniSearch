import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText } from "ai";
import {
  listOpenAiCompatibleModels,
  selectRandomModel,
} from "../../shared/openaiModels";
import { addLogEntry } from "./logEntries";
import {
  getSettings,
  getTextGenerationState,
  updateResponse,
  updateTextGenerationState,
} from "./pubSub";
import { sleep } from "./sleep";
import {
  canStartResponding,
  getDefaultChatCompletionCreateParamsStreaming,
  getDefaultChatMessages,
  getFormattedSearchResults,
} from "./textGenerationUtilities";
import type { ChatMessage } from "./types";

let currentAbortController: AbortController | null = null;

interface GenerateOptions {
  messages: ChatMessage[];
  onUpdate: (text: string, reasoningContent?: string) => void;
}

interface GenerateResult {
  text: string;
  reasoningContent?: string;
}

async function createOpenAiGeneration({
  messages,
  onUpdate,
}: GenerateOptions): Promise<GenerateResult> {
  const settings = getSettings();
  const openaiProvider = createOpenAICompatible({
    name: settings.openAiApiBaseUrl,
    baseURL: settings.openAiApiBaseUrl,
    apiKey: settings.openAiApiKey,
    
    headers: {
      'x-alltrue-llm-firewall-user-session': '{"user-session-user-email": "erwin.friethoff@nl.ibm.com"}',
      'x-alltrue-llm-endpoint-identifier': settings.guardiumaiEndpointId,
    },
  });

  const params = getDefaultChatCompletionCreateParamsStreaming();

  let effectiveModel = settings.openAiApiModel;
  let availableModels: { id: string }[] = [];

  if (!effectiveModel) {
    try {
      availableModels = await listOpenAiCompatibleModels(
        settings.openAiApiBaseUrl,
        settings.openAiApiKey,
        
      );
      const selectedModel = selectRandomModel(availableModels);
      if (selectedModel) effectiveModel = selectedModel;
    } catch (err) {
      addLogEntry(
        `Failed to list OpenAI models: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  const maxRetries = 5;
  const attemptedModels = new Set<string>();
  let currentAttempt = 0;

  const tryNextModel = async (): Promise<GenerateResult> => {
    if (currentAttempt >= maxRetries) {
      throw new Error(
        `Failed to generate text after ${maxRetries} retries with different models`,
      );
    }

    if (effectiveModel) {
      attemptedModels.add(effectiveModel);
    }

    currentAttempt++;

    currentAbortController = new AbortController();
    let shouldRetry = false;

    try {
      const result = await generateText({
        model: openaiProvider.chatModel(effectiveModel),
        messages,
        maxTokens: params.max_tokens,
        temperature: params.temperature,
        topP: params.top_p,
        frequencyPenalty: params.frequency_penalty,
        presencePenalty: params.presence_penalty,
        abortSignal: currentAbortController.signal,
        maxRetries: 0,
        onError: async (error: unknown) => {
          if (
            getTextGenerationState() === "interrupted" ||
            (error instanceof DOMException && error.name === "AbortError")
          ) {
            throw new Error("Chat generation interrupted");
          }

          if (availableModels.length > 0 && currentAttempt < maxRetries) {
            const nextModel = selectRandomModel(
              availableModels,
              attemptedModels,
            );
            if (nextModel) {
              addLogEntry(
                `Model "${effectiveModel}" failed, retrying with "${nextModel}" (Attempt ${currentAttempt}/${maxRetries})`,
              );
              effectiveModel = nextModel;
              shouldRetry = true;
              await sleep(100 * currentAttempt);
              throw error;
            }
          }

          throw error;
        },
      });

      if (getTextGenerationState() === "interrupted") {
        currentAbortController.abort();
        throw new Error("Chat generation interrupted");
      }

      const text = result.text;
      const reasoning = result.experimental_providerMetadata?.openai?.reasoning || "";
      
      onUpdate(text, reasoning);

      return { text, reasoningContent: reasoning };
    } catch (error) {
      if (
        getTextGenerationState() === "interrupted" ||
        (error instanceof DOMException && error.name === "AbortError")
      ) {
        throw new Error("Chat generation interrupted");
      }

      if (shouldRetry) {
        return tryNextModel();
      }

      throw error;
    } finally {
      currentAbortController = null;
    }
  };

  return tryNextModel();
}

export async function generateTextWithOpenAi() {
  await canStartResponding();
  updateTextGenerationState("preparingToGenerate");

  const messages = getDefaultChatMessages(getFormattedSearchResults(true));
  const settings = getSettings();

  await createOpenAiGeneration({
    messages,
    onUpdate: (text, reasoningContent) => {
      if (getTextGenerationState() !== "generating") {
        updateTextGenerationState("generating");
      }

      if (reasoningContent && reasoningContent.length > 0) {
        if (text && text.length > 0) {
          updateResponse(
            `${settings.reasoningStartMarker}${reasoningContent}${settings.reasoningEndMarker}\n\n${text}`,
          );
        } else {
          updateResponse(`${settings.reasoningStartMarker}${reasoningContent}`);
        }
      } else {
        updateResponse(text);
      }
    },
  });
}

export async function generateChatWithOpenAi(
  messages: ChatMessage[],
  onUpdate: (partialResponse: string) => void,
) {
  const settings = getSettings();
  const result = await createOpenAiGeneration({
    messages,
    onUpdate: (text, reasoningContent) => {
      if (reasoningContent && reasoningContent.length > 0) {
        if (text && text.length > 0) {
          onUpdate(
            `${settings.reasoningStartMarker}${reasoningContent}${settings.reasoningEndMarker}\n\n${text}`,
          );
        } else {
          onUpdate(`${settings.reasoningStartMarker}${reasoningContent}`);
        }
      } else {
        onUpdate(text);
      }
    },
  });

  if (result.reasoningContent && result.reasoningContent.length > 0) {
    return `${settings.reasoningStartMarker}${result.reasoningContent}${settings.reasoningEndMarker}\n\n${result.text}`;
  }

  return result.text;
}
