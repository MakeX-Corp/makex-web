export interface DeployStep {
  id: number;
  title: string;
  description: string;
}

export const DEPLOY_STEPS: DeployStep[] = [
  { id: 1, title: "Choose", description: "Setup method" },
  { id: 2, title: "Setup", description: "App details" },
  { id: 3, title: "Icon", description: "App icon" },
  { id: 4, title: "Deploy", description: "Final step" },
] as const;

export const DEFAULT_AI_GENERATED_DATA = {
  category: "Productivity",
  description:
    "An AI-powered task management app that helps you organize your work and boost productivity with intelligent suggestions and automated workflows.",
  tags: "productivity, task-management, ai, automation, workflow",
} as const;
