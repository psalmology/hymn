import { ApiProfile, ApiSettings, ChatMessage } from '../types';

export interface SendChatResult {
  content: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export interface TestResult {
  success: boolean;
  message: string;
  latencyMs?: number;
  preview?: string;
  status?: number;
}

/**
 * Normalizes base URL:
 * - Trims whitespace
 * - Strips trailing slashes repeatedly
 * - Strips trailing /chat/completions or /models if user accidentally included them
 * - Ensures https:// or http:// protocol
 */
export function normalizeBaseUrl(url: string): string {
  if (!url) return '';
  let trimmed = url.trim();
  // Strip trailing slashes repeatedly
  trimmed = trimmed.replace(/\/+$/, '');
  // If user pasted /chat/completions or /models, strip it
  trimmed = trimmed.replace(/\/chat\/completions\/?$/i, '');
  trimmed = trimmed.replace(/\/models\/?$/i, '');
  // Final strip of trailing slashes
  trimmed = trimmed.replace(/\/+$/, '');

  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = 'https://' + trimmed;
  }
  return trimmed;
}

export function getCompletionsEndpoint(baseURL: string): string {
  const clean = normalizeBaseUrl(baseURL);
  return `${clean}/chat/completions`;
}

export function getModelsEndpoint(baseURL: string): string {
  const clean = normalizeBaseUrl(baseURL);
  return `${clean}/models`;
}

/**
 * Fetches models list from {Base URL}/models
 */
export async function fetchModelsList(baseURL: string, apiKey: string): Promise<string[]> {
  const cleanKey = apiKey?.trim();
  if (!cleanKey) {
    throw new Error('请先填写 API Key 才能获取模型列表。');
  }

  const cleanBase = normalizeBaseUrl(baseURL);
  if (!cleanBase) {
    throw new Error('请先填写有效的 API 地址 (Base URL)。');
  }

  const endpoint = getModelsEndpoint(cleanBase);

  let response: Response;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

    response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${cleanKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        throw new Error('获取模型列表超时 (20秒)，请检查网络连接。可以手动输入模型名。');
      }
      if (err.message && err.message.includes('Failed to fetch')) {
        throw new Error(
          '无法连接到 /models 端点 (Failed to fetch)。可能目标接口不支持跨域 (CORS) 或地址有误，您可以直接手动输入模型名。'
        );
      }
      throw new Error(`网络请求异常: ${err.message}。您可以直接手动输入模型名。`);
    }
    throw new Error('获取模型列表失败，您可以直接手动输入模型名。');
  }

  if (!response.ok) {
    let errDetail = '';
    try {
      const errJson = await response.json();
      errDetail = errJson.error?.message || errJson.message || JSON.stringify(errJson);
    } catch {
      try {
        errDetail = await response.text();
      } catch {
        errDetail = response.statusText;
      }
    }
    if (response.status === 401) {
      throw new Error('认证失败 (401 Unauthorized)：API Key 无效。您可以直接手动输入模型名。');
    } else if (response.status === 404) {
      throw new Error('服务商未提供 /models 接口 (404 Not Found)。您可以直接手动输入模型名。');
    } else {
      throw new Error(`获取失败 (HTTP ${response.status})：${errDetail || '请检查地址，您可以直接手动输入模型名。'}`);
    }
  }

  const data = await response.json();
  const modelList: string[] = [];

  if (Array.isArray(data)) {
    data.forEach((item) => {
      if (typeof item === 'string') modelList.push(item);
      else if (item?.id) modelList.push(String(item.id));
      else if (item?.name) modelList.push(String(item.name));
    });
  } else if (Array.isArray(data?.data)) {
    data.data.forEach((item: unknown) => {
      if (typeof item === 'string') modelList.push(item);
      else if (typeof item === 'object' && item !== null) {
        const obj = item as Record<string, unknown>;
        if (obj.id) modelList.push(String(obj.id));
        else if (obj.name) modelList.push(String(obj.name));
      }
    });
  } else if (Array.isArray(data?.models)) {
    data.models.forEach((item: unknown) => {
      if (typeof item === 'string') modelList.push(item);
      else if (typeof item === 'object' && item !== null) {
        const obj = item as Record<string, unknown>;
        if (obj.id) modelList.push(String(obj.id));
        else if (obj.name) modelList.push(String(obj.name));
      }
    });
  }

  const uniqueModels = Array.from(new Set(modelList)).sort((a, b) => a.localeCompare(b));
  if (uniqueModels.length === 0) {
    throw new Error('返回的数据中未解析到有效的模型 ID，您可以直接手动输入模型名。');
  }

  return uniqueModels;
}

/**
 * Calls an OpenAI-compatible API endpoint
 */
export async function sendChatCompletion(
  settings: ApiSettings | ApiProfile,
  messages: ChatMessage[],
  systemPrompt?: string
): Promise<SendChatResult> {
  const apiKey = settings.apiKey?.trim();
  if (!apiKey) {
    throw new Error('API Key 未填写。请先在「设置」中配置您的 API Key。');
  }

  const endpoint = getCompletionsEndpoint(settings.baseURL || 'https://api.openai.com/v1');
  const model = settings.model?.trim() || 'gpt-4o-mini';

  // Format payload for OpenAI compatibility
  const formattedMessages: Array<{ role: string; content: string }> = [];

  const effectiveSysPrompt = systemPrompt || settings.systemPrompt?.trim();
  if (effectiveSysPrompt) {
    formattedMessages.push({
      role: 'system',
      content: effectiveSysPrompt,
    });
  }

  // Include conversation history
  messages.forEach((msg) => {
    if (!msg.failed && msg.content) {
      formattedMessages.push({
        role: msg.role === 'system' ? 'system' : msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      });
    }
  });

  if (formattedMessages.length === 0 || formattedMessages[formattedMessages.length - 1].role !== 'user') {
    throw new Error('没有有效的用户输入消息。');
  }

  const bodyPayload: Record<string, unknown> = {
    model,
    messages: formattedMessages,
    temperature: settings.temperature ?? 0.7,
  };

  if (settings.maxTokens && settings.maxTokens > 0) {
    bodyPayload.max_tokens = settings.maxTokens;
  }

  let response: Response;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(bodyPayload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        throw new Error('请求超时 (60秒)，请检查网络连接或更换模型。');
      }
      if (err.message && err.message.includes('Failed to fetch')) {
        throw new Error(
          '无法连接到服务器 (Failed to fetch)。可能原因：\n1. Base URL 填写有误或域名无法访问\n2. 目标服务禁止了浏览器跨域请求 (CORS)\n3. 本地网络未开启代理或无法直连海外节点'
        );
      }
      throw new Error(`网络连接异常: ${err.message}`);
    }
    throw new Error('网络请求发生了未知错误。');
  }

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errorJson = await response.json();
      if (errorJson?.error?.message) {
        errorDetail = errorJson.error.message;
      } else if (errorJson?.message) {
        errorDetail = errorJson.message;
      } else {
        errorDetail = JSON.stringify(errorJson);
      }
    } catch {
      try {
        errorDetail = await response.text();
      } catch {
        errorDetail = response.statusText;
      }
    }

    if (response.status === 401) {
      throw new Error(`认证失败 (401 Unauthorized)：API Key 无效或过期。\n${errorDetail}`);
    } else if (response.status === 404) {
      throw new Error(`路径不存在 (404 Not Found)：请检查 Base URL 是否正确（通常需要包含 /v1 或具体版本路径）。\n${errorDetail}`);
    } else if (response.status === 429) {
      throw new Error(`请求受限 (429 Too Many Requests)：账户配额耗尽或超出速率限制。\n${errorDetail}`);
    } else if (response.status >= 500) {
      throw new Error(`服务端异常 (${response.status})：目标模型服务暂时不可用。\n${errorDetail}`);
    } else {
      throw new Error(`请求失败 (HTTP ${response.status})：${errorDetail}`);
    }
  }

  const data = await response.json();
  const choice = data.choices?.[0];
  const replyContent = choice?.message?.content || choice?.text || '';

  if (!replyContent && choice?.finish_reason !== 'stop') {
    throw new Error('API 返回的数据为空或格式不匹配。');
  }

  return {
    content: replyContent,
    usage: data.usage,
  };
}

/**
 * Tests connection to the configured API endpoint
 */
export async function testApiConnection(settings: ApiSettings | ApiProfile): Promise<TestResult> {
  const startTime = Date.now();
  const apiKey = settings.apiKey?.trim();
  if (!apiKey) {
    return {
      success: false,
      message: '测试失败：尚未填写 API Key。请先填入 Key 再进行测试。',
    };
  }

  const endpoint = getCompletionsEndpoint(settings.baseURL || 'https://api.openai.com/v1');
  const model = settings.model?.trim() || 'gpt-4o-mini';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 18000); // 18s timeout for test

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Say "pong" or one word.' }],
        max_tokens: 10,
        temperature: 0.1,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      let errText = '';
      try {
        const errJson = await response.json();
        errText = errJson.error?.message || errJson.message || JSON.stringify(errJson);
      } catch {
        errText = await response.text();
      }
      return {
        success: false,
        status: response.status,
        message: `HTTP ${response.status} 错误: ${errText || response.statusText}`,
        latencyMs,
      };
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'OK';

    return {
      success: true,
      message: `连接成功！模型响应正常。`,
      latencyMs,
      preview: reply.trim(),
    };
  } catch (err: unknown) {
    const latencyMs = Date.now() - startTime;
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        return {
          success: false,
          message: '连接超时 (18秒)：服务器未在规定时间内响应。',
          latencyMs,
        };
      }
      if (err.message.includes('Failed to fetch')) {
        return {
          success: false,
          message:
            '无法连接到此端点 (Failed to fetch)。可能是因为目标 API 不支持浏览器跨域 (CORS) 访问，或 Base URL 不可达。',
          latencyMs,
        };
      }
      return {
        success: false,
        message: `网络错误: ${err.message}`,
        latencyMs,
      };
    }
    return {
      success: false,
      message: '发生了未知错误。',
      latencyMs,
    };
  }
}
