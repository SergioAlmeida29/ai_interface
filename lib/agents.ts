export interface AgentConfig {
  id: string;
  label: string;
  endpoint: string;
  channelId: string;
  envKey: string;
}

export const AGENTS: AgentConfig[] = [
  {
    id: "opus-4-7",
    label: "Opus 4.7",
    endpoint:
      "https://api.iaedu.pt/agent-chat//api/v1/agent/cmoss7l0f658oko01vk2egfpg/stream",
    channelId: "cmpz107qv2uo0l101h6atwoiz",
    envKey: "AGENT_OPUS47_KEY",
  },
  {
    id: "gpt-5-5",
    label: "GPT-5.5",
    endpoint:
      "https://api.iaedu.pt/agent-chat//api/v1/agent/cmor5objoex9gfp01vm7p95jh/stream",
    channelId: "cmqktryo30amvp701aljtgcyz",
    envKey: "AGENT_GPT55_KEY",
  },
  {
    id: "gpt-4o",
    label: "GPT-4o",
    endpoint:
      "https://api.iaedu.pt/agent-chat//api/v1/agent/cmamvd3n40000c801qeacoad2/stream",
    channelId: "cmhrqrlk01fzxg001s24firq0",
    envKey: "AGENT_GPT4O_KEY",
  },
];

export function getAgentById(id: string): AgentConfig | undefined {
  return AGENTS.find((a) => a.id === id);
}

export function getAgentApiKey(agent: AgentConfig): string {
  const key = process.env[agent.envKey];
  if (!key) throw new Error(`Missing env var: ${agent.envKey}`);
  return key;
}
